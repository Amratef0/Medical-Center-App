import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';

export const PACKAGE_SESSIONS_THRESHOLD = 'package_sessions_threshold';
export const PACKAGE_RENEWAL_WINDOW_DAYS = 'package.renewal_window_days';
export const CLINIC_TIMEZONE = 'clinic.timezone';
export const SESSIONS_MISSED_GRACE_MINUTES = 'sessions.missed_grace_minutes';
export const CAPACITY_CENTER_MAX_SESSIONS_PER_DAY = 'capacity.center.max_sessions_per_day';
export const CAPACITY_WARN_THRESHOLD_PCT = 'capacity.warn_threshold_pct';
export const CAPACITY_FULL_THRESHOLD_PCT = 'capacity.full_threshold_pct';

export const jobLastRunKey = (jobName: string) => `jobs.${jobName}.last_success_at`;
export const jobLastErrorKey = (jobName: string) => `jobs.${jobName}.last_error`;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepo: Repository<SystemSetting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const row = await this.settingsRepo.findOne({ where: { setting_key: key } });
    return row?.value ?? null;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const raw = await this.get(key);
    if (raw == null) {
      await this.set(key, String(fallback));
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async getOptionalNumber(key: string): Promise<number | null> {
    const raw = await this.get(key);
    if (raw == null || raw.trim() === '') {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  async set(key: string, value: string): Promise<SystemSetting> {
    await this.settingsRepo.upsert({ setting_key: key, value }, ['setting_key']);
    return this.settingsRepo.findOneOrFail({ where: { setting_key: key } });
  }

  async getClinicTimezone(): Promise<string> {
    return (await this.get(CLINIC_TIMEZONE)) ?? 'Asia/Riyadh';
  }

  findAll(): Promise<SystemSetting[]> {
    return this.settingsRepo.find({ order: { setting_key: 'ASC' } });
  }
}
