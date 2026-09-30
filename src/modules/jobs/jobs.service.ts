import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Session, SessionStatus, SessionType } from '../sessions/session.entity';
import { AttendanceStatus } from '../sessions/attendance.entity';
import {
  SettingsService,
  SESSIONS_MISSED_GRACE_MINUTES,
  jobLastRunKey,
  jobLastErrorKey,
} from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CapacityService } from '../capacity/capacity.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  PatientPackage,
  PatientPackageStatus,
} from '../packages/patient-package.entity';
import { Patient } from '../patients/patient.entity';
import {
  PACKAGE_SESSIONS_THRESHOLD,
  PACKAGE_RENEWAL_WINDOW_DAYS,
} from '../settings/settings.service';
import { Notification, NotificationType } from '../notifications/notification.entity';
import { User } from '../users/user.entity';

export const JOB_NAMES = [
  'markMissedSessions',
  'dispatchScheduledMessages',
  'evaluatePackageThresholds',
  'evaluateCapacity',
  'purgeExpiredRefreshTokens',
] as const;

export type JobName = (typeof JOB_NAMES)[number];

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly capacityService: CapacityService,
    private readonly whatsappService: WhatsappService,
    @InjectRepository(Session)
    private readonly sessionsRepo: Repository<Session>,
    @InjectRepository(PatientPackage)
    private readonly patientPackagesRepo: Repository<PatientPackage>,
    @InjectRepository(Patient)
    private readonly patientsRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async getHealthSnapshot(): Promise<
    Record<
      JobName,
      { last_success_at: string | null; last_error: string | null }
    >
  > {
    const out = {} as Record<
      JobName,
      { last_success_at: string | null; last_error: string | null }
    >;
    for (const name of JOB_NAMES) {
      out[name] = {
        last_success_at: await this.settings.get(jobLastRunKey(name)),
        last_error: await this.settings.get(jobLastErrorKey(name)),
      };
    }
    return out;
  }

  @Cron('*/15 * * * *')
  async markMissedSessions(): Promise<void> {
    await this.runJob('markMissedSessions', async () => {
      const grace = await this.settings.getNumber(SESSIONS_MISSED_GRACE_MINUTES, 60);

      const candidates = await this.sessionsRepo
        .createQueryBuilder('session')
        .leftJoin('session.attendance', 'attendance')
        .where('session.status = :scheduled', { scheduled: SessionStatus.SCHEDULED })
        .andWhere(
          `(session.session_date + make_interval(mins => COALESCE(NULLIF(session.scheduled_duration_minutes, 0),
            CASE WHEN session.session_type = :assessment THEN 60 ELSE 45 END) + :grace)) < NOW()`,
          { grace, assessment: SessionType.ASSESSMENT },
        )
        .andWhere(
          '(attendance.id IS NULL OR attendance.status != :attended)',
          { attended: AttendanceStatus.ATTENDED },
        )
        .getMany();

      for (const session of candidates) {
        session.status = SessionStatus.MISSED;
        await this.sessionsRepo.save(session);
        await this.notifications.notifyMissedAppointment(session.id);
      }

      if (candidates.length > 0) {
        this.logger.log(`markMissedSessions: marked ${candidates.length} session(s) as MISSED`);
      }
    });
  }

  @Cron('*/5 * * * *')
  async dispatchScheduledMessages(): Promise<void> {
    await this.runJob('dispatchScheduledMessages', async () => {
      const attempted = await this.whatsappService.dispatchDueMessages(50);
      this.logger.log(`dispatchScheduledMessages: attempted ${attempted} due message(s)`);
    });
  }

  @Cron('0 6 * * *', { timeZone: 'Asia/Riyadh' })
  async evaluatePackageThresholds(): Promise<void> {
    await this.runJob('evaluatePackageThresholds', async () => {
      const threshold = await this.settings.getNumber(PACKAGE_SESSIONS_THRESHOLD, 3);
      const active = await this.patientPackagesRepo.find({
        where: { status: PatientPackageStatus.ACTIVE },
      });

      for (const pp of active) {
        if (pp.remaining_sessions > threshold) continue;
        if (await this.hasPackageAlertWithinDays(pp.id, 7)) continue;

        const patient = await this.patientsRepo.findOne({
          where: { id: pp.patient_id },
        });
        const name = patient?.full_name_ar || patient?.first_name || 'Patient';
        await this.notifications.notifyPackageEndingSoon(
          name,
          pp.remaining_sessions,
          pp.id,
        );
      }
    });
  }

  @Cron('0 7 * * *', { timeZone: 'Asia/Riyadh' })
  async evaluateCapacity(): Promise<void> {
    await this.runJob('evaluateCapacity', async () => {
      const tz = await this.settings.getClinicTimezone();
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
      const tomorrow = this.addDaysToDateLabel(today, 1);
      await this.capacityService.emitProjectedThresholdAlerts(tomorrow);
    });
  }

  @Cron('0 3 * * *', { timeZone: 'Asia/Riyadh' })
  async purgeExpiredRefreshTokens(): Promise<void> {
    await this.runJob('purgeExpiredRefreshTokens', async () => {
      const result = await this.usersRepo
        .createQueryBuilder()
        .update(User)
        .set({ refresh_token_hash: null as unknown as string })
        .where('is_active = false')
        .andWhere('refresh_token_hash IS NOT NULL')
        .execute();

      this.logger.log(
        `purgeExpiredRefreshTokens: cleared refresh tokens for ${result.affected ?? 0} inactive user(s)`,
      );
    });
  }

  private async runJob(name: JobName, fn: () => Promise<void>): Promise<void> {
    const lockKey = this.jobLockKey(name);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const lockRow = await queryRunner.query(
        'SELECT pg_try_advisory_lock($1) AS acquired',
        [lockKey],
      );
      if (!lockRow?.[0]?.acquired) {
        this.logger.debug(`${name}: skipped (advisory lock held elsewhere)`);
        return;
      }

      try {
        await fn();
        await this.settings.set(jobLastRunKey(name), new Date().toISOString());
        await this.settings.set(jobLastErrorKey(name), '');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`${name} failed: ${message}`);
        await this.settings.set(jobLastErrorKey(name), message);
      } finally {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      }
    } finally {
      await queryRunner.release();
    }
  }

  private jobLockKey(jobName: string): number {
    let hash = 0;
    for (let i = 0; i < jobName.length; i++) {
      hash = (hash * 31 + jobName.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) + 900_000;
  }

  private addDaysToDateLabel(dateLabel: string, days: number): string {
    const anchor = new Date(`${dateLabel}T12:00:00.000Z`);
    anchor.setUTCDate(anchor.getUTCDate() + days);
    return anchor.toISOString().slice(0, 10);
  }

  private async hasPackageAlertWithinDays(
    packageId: string,
    days: number,
  ): Promise<boolean> {
    const since = new Date(Date.now() - days * 86_400_000);
    const count = await this.notificationsRepo
      .createQueryBuilder('n')
      .where('n.type = :type', { type: NotificationType.PACKAGE_ENDING_SOON })
      .andWhere('n.reference_id = :ref', { ref: packageId })
      .andWhere('n.created_at >= :since', { since })
      .getCount();

    return count > 0;
  }
}
