import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @PrimaryColumn({ type: 'varchar', length: 128 })
  permission_key: string;

  @Column({ type: 'boolean' })
  granted: boolean;

  @Column({ type: 'uuid', nullable: true })
  granted_by: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  granted_at: Date;
}
