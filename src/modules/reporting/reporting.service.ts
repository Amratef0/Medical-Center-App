import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleSlot } from '../scheduling/schedule-slot.entity';
import { Payment, PaymentStatus } from '../finance/payment.entity';
import { Invoice, InvoiceStatus } from '../finance/invoice.entity';
import { PatientPackage, PatientPackageStatus } from '../packages/patient-package.entity';
import { FollowUpTask, FollowUpType } from '../follow-ups/follow-up.entity';
import { Patient } from '../patients/patient.entity';
import { Session, SessionStatus } from '../sessions/session.entity';
import {
  CapacityService,
  CapacityOverview,
} from '../capacity/capacity.service';
import {
  SettingsService,
  PACKAGE_SESSIONS_THRESHOLD,
  PACKAGE_RENEWAL_WINDOW_DAYS,
} from '../settings/settings.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(ScheduleSlot)
    private slotsRepo: Repository<ScheduleSlot>,
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepo: Repository<Invoice>,
    @InjectRepository(PatientPackage)
    private patientPackagesRepo: Repository<PatientPackage>,
    @InjectRepository(FollowUpTask)
    private followUpsRepo: Repository<FollowUpTask>,
    @InjectRepository(Patient)
    private patientsRepo: Repository<Patient>,
    @InjectRepository(Session)
    private sessionsRepo: Repository<Session>,
    private readonly capacityService: CapacityService,
    private readonly settings: SettingsService,
  ) {}

  async getDailyReport(date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const allSlots = await this.slotsRepo
      .createQueryBuilder('slot')
      .where('DATE(slot.start_time) = :date', { date: targetDate })
      .getMany();

    const totalSlots = allSlots.length;
    const bookedSlots = allSlots.filter((s) => s.booked_count > 0).length;
    const fullSlots = allSlots.filter((s) => s.booked_count >= s.capacity).length;
    const totalBookings = allSlots.reduce((sum, s) => sum + s.booked_count, 0);
    const totalCapacity = allSlots.reduce((sum, s) => sum + s.capacity, 0);
    const utilizationRate =
      totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

    const payments = await this.paymentsRepo
      .createQueryBuilder('p')
      .where('DATE(p.created_at) = :date', { date: targetDate })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getMany();

    const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const dropoffs = await this.followUpsRepo
      .createQueryBuilder('f')
      .where('DATE(f.created_at) = :date', { date: targetDate })
      .andWhere('f.type = :type', { type: FollowUpType.DROP_OFF })
      .getCount();

    return {
      date: targetDate,
      scheduling: {
        total_slots: totalSlots,
        booked_slots: bookedSlots,
        full_slots: fullSlots,
        total_bookings: totalBookings,
        total_capacity: totalCapacity,
        utilization_rate_percent: utilizationRate,
      },
      finance: {
        revenue,
        payments_count: payments.length,
      },
      operations: {
        dropoffs,
      },
    };
  }

  async getDoctorUtilization(from: string, to: string) {
    const slots = await this.slotsRepo
      .createQueryBuilder('slot')
      .where('slot.start_time >= :from', { from: new Date(from) })
      .andWhere('slot.end_time <= :to', { to: new Date(to) })
      .getMany();

    const doctorMap = new Map<
      string,
      { total_capacity: number; total_booked: number; slots_count: number }
    >();

    for (const slot of slots) {
      if (!slot.doctor_id) continue;
      const existing = doctorMap.get(slot.doctor_id) || {
        total_capacity: 0,
        total_booked: 0,
        slots_count: 0,
      };

      existing.total_capacity += slot.capacity;
      existing.total_booked += slot.booked_count;
      existing.slots_count += 1;

      doctorMap.set(slot.doctor_id, existing);
    }

    const utilization = Array.from(doctorMap.entries()).map(
      ([doctor_id, data]) => ({
        doctor_id,
        total_slots: data.slots_count,
        total_capacity: data.total_capacity,
        total_booked: data.total_booked,
        utilization_percent:
          data.total_capacity > 0
            ? Math.round((data.total_booked / data.total_capacity) * 100)
            : 0,
      }),
    );

    return {
      period: { from, to },
      doctors: utilization,
    };
  }

  async getConversionRate(from: string, to: string) {
    const paidPackages = await this.patientPackagesRepo
      .createQueryBuilder('pp')
      .where('pp.created_at >= :from', { from: new Date(from) })
      .andWhere('pp.created_at <= :to', { to: new Date(to + 'T23:59:59') })
      .getCount();

    const completedPayments = await this.paymentsRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :from', { from: new Date(from) })
      .andWhere('p.created_at <= :to', { to: new Date(to + 'T23:59:59') })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getCount();

    const dropoffs = await this.followUpsRepo
      .createQueryBuilder('f')
      .where('f.created_at >= :from', { from: new Date(from) })
      .andWhere('f.created_at <= :to', { to: new Date(to + 'T23:59:59') })
      .andWhere('f.type = :type', { type: FollowUpType.DROP_OFF })
      .getCount();

    const totalAssessments = paidPackages + dropoffs;
    const conversionRate =
      totalAssessments > 0
        ? Math.round((paidPackages / totalAssessments) * 100)
        : 0;

    return {
      period: { from, to },
      paid_packages: paidPackages,
      dropoffs,
      total_assessments: totalAssessments,
      conversion_rate_percent: conversionRate,
      completed_payments: completedPayments,
    };
  }

  async getPatientSourceReport(from: string, to: string) {
    const rows = await this.patientsRepo
      .createQueryBuilder('p')
      .select(
        `COALESCE(NULLIF(TRIM(p.referral_source), ''), 'unknown')`,
        'source',
      )
      .addSelect('COUNT(*)', 'count')
      .where('p.registration_date >= :from', { from })
      .andWhere('p.registration_date <= :to', { to })
      .groupBy('source')
      .getRawMany<{ source: string; count: string }>();

    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
    const sources = rows.map((r) => {
      const count = Number(r.count);
      return {
        source: r.source,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });

    const doctorReferrals = await this.patientsRepo
      .createQueryBuilder('p')
      .select('p.referral_doctor_name', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('p.registration_date >= :from', { from })
      .andWhere('p.registration_date <= :to', { to })
      .andWhere(`p.referral_source ILIKE '%Doctor Referral%'`)
      .andWhere('p.referral_doctor_name IS NOT NULL')
      .groupBy('p.referral_doctor_name')
      .orderBy('count', 'DESC')
      .getRawMany();

    const friendReferrals = await this.patientsRepo
      .createQueryBuilder('p')
      .select('p.referral_friend_name', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('p.registration_date >= :from', { from })
      .andWhere('p.registration_date <= :to', { to })
      .andWhere(`p.referral_source ILIKE '%Friend%'`)
      .andWhere('p.referral_friend_name IS NOT NULL')
      .groupBy('p.referral_friend_name')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      period: { from, to },
      total_patients: total,
      sources,
      doctor_referral_breakdown: doctorReferrals.map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
      friend_referral_breakdown: friendReferrals.map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
    };
  }

  async getCapacityReport(from: string, to: string) {
    const days: CapacityOverview[] = [];
    for (const date of this.eachDateInclusive(from, to)) {
      days.push(await this.capacityService.getOverview(date));
    }

    return {
      period: { from, to },
      days,
      thresholds: days[0]?.thresholds ?? {
        warn_pct: 80,
        full_pct: 100,
      },
    };
  }

  /**
   * Attendance denominator: sessions scheduled in [from, to], excluding those still
   * SCHEDULED with session_date in the future (relative to report run time).
   */
  async getAttendanceReport(from: string, to: string) {
    const now = new Date();
    const qb = this.sessionsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.doctor', 'doctor')
      .leftJoinAndSelect('s.attendance', 'attendance')
      .where('s.session_date >= :from', { from: new Date(from) })
      .andWhere('s.session_date <= :to', { to: new Date(`${to}T23:59:59`) })
      .andWhere(
        '(s.status != :scheduled OR s.session_date <= :now)',
        { scheduled: SessionStatus.SCHEDULED, now },
      );

    const sessions = await qb.getMany();
    const total = sessions.length;

    const attended = sessions.filter(
      (s) =>
        s.status === SessionStatus.ATTENDED ||
        s.attendance?.status === 'ATTENDED',
    ).length;
    const missed = sessions.filter(
      (s) =>
        s.status === SessionStatus.MISSED ||
        s.attendance?.status === 'ABSENT',
    ).length;
    const cancelled = sessions.filter(
      (s) => s.status === SessionStatus.CANCELED,
    ).length;

    const pct = (n: number) =>
      total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

    const byDoctorMap = new Map<
      string,
      { doctor_id: string; doctor_name: string; total: number; attended: number; missed: number; cancelled: number }
    >();

    for (const s of sessions) {
      const key = s.doctor_id ?? 'unassigned';
      const row =
        byDoctorMap.get(key) ??
        {
          doctor_id: key,
          doctor_name: s.doctor?.name ?? 'Unassigned',
          total: 0,
          attended: 0,
          missed: 0,
          cancelled: 0,
        };
      row.total += 1;
      if (
        s.status === SessionStatus.ATTENDED ||
        s.attendance?.status === 'ATTENDED'
      ) {
        row.attended += 1;
      } else if (
        s.status === SessionStatus.MISSED ||
        s.attendance?.status === 'ABSENT'
      ) {
        row.missed += 1;
      } else if (s.status === SessionStatus.CANCELED) {
        row.cancelled += 1;
      }
      byDoctorMap.set(key, row);
    }

    const by_doctor = Array.from(byDoctorMap.values()).map((row) => ({
      ...row,
      attendance_pct: pct(row.attended),
      no_show_pct: pct(row.missed),
      cancellation_pct: pct(row.cancelled),
    }));

    return {
      period: { from, to },
      denominator_note:
        'Sessions in range excluding future SCHEDULED (session_date > now)',
      totals: {
        sessions: total,
        attended,
        missed,
        cancelled,
        attendance_pct: pct(attended),
        no_show_pct: pct(missed),
        cancellation_pct: pct(cancelled),
      },
      by_doctor,
    };
  }

  async getPackagesReport(from: string, to: string) {
    const threshold = await this.settings.getNumber(
      PACKAGE_SESSIONS_THRESHOLD,
      3,
    );
    const renewalDays = await this.settings.getNumber(
      PACKAGE_RENEWAL_WINDOW_DAYS,
      14,
    );

    const active = await this.patientPackagesRepo.count({
      where: { status: PatientPackageStatus.ACTIVE },
    });

    const endingSoon = await this.patientPackagesRepo
      .createQueryBuilder('pp')
      .where('pp.status = :active', { active: PatientPackageStatus.ACTIVE })
      .andWhere('pp.remaining_sessions <= :threshold', { threshold })
      .getCount();

    const completedInRange = await this.patientPackagesRepo
      .createQueryBuilder('pp')
      .where('pp.status IN (:...done)', {
        done: [PatientPackageStatus.EXHAUSTED, PatientPackageStatus.EXPIRED],
      })
      .andWhere('pp.updated_at >= :from', { from: new Date(from) })
      .andWhere('pp.updated_at <= :to', { to: new Date(`${to}T23:59:59`) })
      .getCount();

    const renewals = await this.patientPackagesRepo.query(
      `
      SELECT COUNT(DISTINCT newer.id)::int AS count
      FROM patient_packages newer
      INNER JOIN patient_packages older
        ON older.patient_id = newer.patient_id
        AND older.id != newer.id
        AND older.status IN ('EXHAUSTED', 'EXPIRED')
        AND newer.created_at >= older.updated_at
        AND newer.created_at <= older.updated_at + ($3 || ' days')::interval
      WHERE newer.created_at >= $1::date
        AND newer.created_at <= ($2::date + interval '1 day')
      `,
      [from, to, String(renewalDays)],
    );

    return {
      period: { from, to },
      renewal_window_days: renewalDays,
      ending_soon_threshold: threshold,
      active_packages: active,
      ending_soon: endingSoon,
      completed_in_period: completedInRange,
      renewals_in_period: Number(renewals[0]?.count ?? 0),
    };
  }

  async getFinanceReport(from: string, to: string) {
    const rangeStart = new Date(from);
    const rangeEnd = new Date(`${to}T23:59:59`);
    const num = (v: unknown) => Number(v ?? 0);

    const pendingPayments = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('p.created_at >= :from', { from: rangeStart })
      .andWhere('p.created_at <= :to', { to: rangeEnd })
      .andWhere('p.status = :pending', { pending: PaymentStatus.PENDING })
      .getRawOne();

    const verifiedPayments = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('p.created_at >= :from', { from: rangeStart })
      .andWhere('p.created_at <= :to', { to: rangeEnd })
      .andWhere('p.status = :paid', { paid: PaymentStatus.PAID })
      .getRawOne();

    const discounts = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.discount), 0)', 'total')
      .where('p.created_at >= :from', { from: rangeStart })
      .andWhere('p.created_at <= :to', { to: rangeEnd })
      .getRawOne();

    const invoiceTotals = await this.invoicesRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.total_amount), 0)', 'invoiced')
      .where('i.created_at >= :from', { from: rangeStart })
      .andWhere('i.created_at <= :to', { to: rangeEnd })
      .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
      .getRawOne();

    const paidInvoiceTotal = await this.invoicesRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.total_amount), 0)', 'paid')
      .where('i.created_at >= :from', { from: rangeStart })
      .andWhere('i.created_at <= :to', { to: rangeEnd })
      .andWhere('i.status = :paid', { paid: InvoiceStatus.PAID })
      .getRawOne();

    // payments.package_id is varchar; packages.id is uuid — join via
    // patient_packages (real FK) and a cast fallback for legacy package_id.
    const revenueByPackage = await this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoin(
        'patient_packages',
        'pp',
        'pp.id = p.patient_package_id',
      )
      .leftJoin(
        'packages',
        'pkg',
        'pkg.id = pp.package_id OR pkg.id::text = p.package_id',
      )
      .select(`COALESCE(pkg.name, 'Other')`, 'category')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'payments')
      .where('p.created_at >= :from', { from: rangeStart })
      .andWhere('p.created_at <= :to', { to: rangeEnd })
      .andWhere('p.status = :paid', { paid: PaymentStatus.PAID })
      .groupBy('pkg.name')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    const outstanding =
      num(invoiceTotals?.invoiced) - num(paidInvoiceTotal?.paid);

    return {
      period: { from, to },
      pending_payments: {
        amount: num(pendingPayments?.total),
        count: num(pendingPayments?.count),
      },
      verified_payments: {
        amount: num(verifiedPayments?.total),
        count: num(verifiedPayments?.count),
      },
      outstanding_balance: outstanding,
      discounts_granted: num(discounts?.total),
      revenue_by_category: revenueByPackage.map((r) => ({
        category: r.category,
        revenue: num(r.revenue),
        payments: num(r.payments),
      })),
    };
  }

  private eachDateInclusive(from: string, to: string): string[] {
    const out: string[] = [];
    const cursor = new Date(`${from}T12:00:00.000Z`);
    const end = new Date(`${to}T12:00:00.000Z`);
    while (cursor <= end) {
      out.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      if (out.length > 366) break;
    }
    return out;
  }
}
