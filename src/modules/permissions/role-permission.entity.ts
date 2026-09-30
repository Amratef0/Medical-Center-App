import { Column, Entity, PrimaryColumn } from 'typeorm';
import { UserRole } from '../users/user.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'enum', enum: UserRole })
  role: UserRole;

  @PrimaryColumn({ type: 'varchar', length: 128 })
  permission_key: string;

  @Column({ type: 'boolean', default: false })
  granted: boolean;
}
