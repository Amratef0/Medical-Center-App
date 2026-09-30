import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn({ name: 'setting_key' })
  setting_key: string;

  @Column({ type: 'text' })
  value: string;
}
