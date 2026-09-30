import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  key: string;

  @Column({ type: 'text' })
  description_ar: string;

  @Column({ type: 'text' })
  description_en: string;
}
