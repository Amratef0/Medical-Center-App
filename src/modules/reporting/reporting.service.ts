import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleSlot } from '../scheduling/schedule-slot.entity';
import { Payment, PaymentStatus } from '../finance/payment.entity';
import { PatientPackage } from '../packages/patient-package.entity';
import { FollowUpTask, FollowUpType } from '../follow-ups/follow-up.entity';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(ScheduleSlot)
    private slotsRepo: Repository<ScheduleSlot>,
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(PatientPackage)
    private patientPackagesRepo: Repository<PatientPackage>,
    @InjectRepository(FollowUpTask)
    private followUpsRepo: Repository<FollowUpTask>,
  ) {}

  // ──────────── Daily Report ────────────

  async getDailyReport(date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Slots on this date
    const allSlots = await this.slotsRepo
      .createQueryBuilder('slot')
      .where('DATE(slot.start_time) = :date', { date: targetDate })
      .getMany();

    const totalSlots = allSlots.length;
    const bookedSlots = allSlots.filter((s) => s.booked_count > 0).length;
    const fullSlots = allSlots.filter((s) => s.booked_count >= s.capacity).length;
    const totalBookings = allSlots.reduce((sum, s) => sum + s.booked_count, 0);
    const totalCapacity = allSlots.reduce((sum, s) => sum + s.capacity, 0);
    const utilizationRate = totalCapacity > 0
      ? Math.round((totalBookings / totalCapacity) * 100)
      : 0;

    // Revenue for this date
    const payments = await this.paymentsRepo
      .createQueryBuilder('p')
      .where('DATE(p.created_at) = :date', { date: targetDate })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getMany();

    const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Drop-offs for this date
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

  // ──────────── Doctor Utilization ────────────

  async getDoctorUtilization(from: string, to: string) {
    const slots = await this.slotsRepo
      .createQueryBuilder('slot')
      .where('slot.start_time >= :from', { from: new Date(from) })
      .andWhere('slot.end_time <= :to', { to: new Date(to) })
      .getMany();

    // Group by doctor_id
    const doctorMap = new Map<string, { total_capacity: number; total_booked: number; slots_count: number }>();

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

  // ──────────── Conversion Rate ────────────

  async getConversionRate(from: string, to: string) {
    // Total patient packages created in the period (represents patients who paid)
    const paidPackages = await this.patientPackagesRepo
      .createQueryBuilder('pp')
      .where('pp.created_at >= :from', { from: new Date(from) })
      .andWhere('pp.created_at <= :to', { to: new Date(to + 'T23:59:59') })
      .getCount();

    // Total completed payments in the period
    const completedPayments = await this.paymentsRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :from', { from: new Date(from) })
      .andWhere('p.created_at <= :to', { to: new Date(to + 'T23:59:59') })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getCount();

    // Total drop-offs in the period
    const dropoffs = await this.followUpsRepo
      .createQueryBuilder('f')
      .where('f.created_at >= :from', { from: new Date(from) })
      .andWhere('f.created_at <= :to', { to: new Date(to + 'T23:59:59') })
      .andWhere('f.type = :type', { type: FollowUpType.DROP_OFF })
      .getCount();

    // Conversion = paid packages / (paid packages + drop-offs)
    const totalAssessments = paidPackages + dropoffs;
    const conversionRate = totalAssessments > 0
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
}
