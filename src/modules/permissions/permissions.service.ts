import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { UserPermission } from './user-permission.entity';
import { User, UserRole } from '../users/user.entity';
import { PERMISSION_CATALOGUE } from './permission-catalogue';

export type PermissionSource = 'override' | 'role' | 'denied';

export interface EffectivePermissionEntry {
  key: string;
  granted: boolean;
  source: PermissionSource;
}

type PermissionRequestCache = {
  permissionEffectiveByUser?: Map<string, Map<string, EffectivePermissionEntry>>;
};

@Injectable()
export class PermissionsService {

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepo: Repository<UserPermission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async listCatalogue(): Promise<Permission[]> {
    return this.permissionRepo.find({ order: { key: 'ASC' } });
  }

  async getRolePermissions(role: UserRole): Promise<{
    role: UserRole;
    permissions: Array<{ key: string; granted: boolean }>;
  }> {
    const rows = await this.rolePermissionRepo.find({ where: { role } });
    const grantedByKey = new Map(rows.map((r) => [r.permission_key, r.granted]));
    const permissions = PERMISSION_CATALOGUE.map((p) => ({
      key: p.key,
      granted: grantedByKey.get(p.key) ?? false,
    }));
    return { role, permissions };
  }

  async setRolePermissions(
    role: UserRole,
    updates: Array<{ key: string; granted: boolean }>,
  ): Promise<{ role: UserRole; permissions: Array<{ key: string; granted: boolean }> }> {
    this.validateKeys(updates.map((u) => u.key));
    for (const { key, granted } of updates) {
      await this.rolePermissionRepo.save({ role, permission_key: key, granted });
    }
    return this.getRolePermissions(role);
  }

  async getUserPermissions(userId: string): Promise<{
    user_id: string;
    role: UserRole;
    permissions: EffectivePermissionEntry[];
    overrides: Array<{ key: string; granted: boolean; granted_by: string | null; granted_at: Date }>;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const effective = await this.resolveEffective(userId);
    const overrides = await this.userPermissionRepo.find({ where: { user_id: userId } });
    return {
      user_id: userId,
      role: user.role,
      permissions: PERMISSION_CATALOGUE.map((p) => effective.get(p.key)!),
      overrides: overrides.map((o) => ({
        key: o.permission_key,
        granted: o.granted,
        granted_by: o.granted_by,
        granted_at: o.granted_at,
      })),
    };
  }

  async setUserPermissions(
    userId: string,
    actor: User,
    updates: Array<{ key: string; granted: boolean | null }>,
  ): Promise<Awaited<ReturnType<PermissionsService['getUserPermissions']>>> {
    const target = await this.userRepo.findOne({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    this.validateKeys(updates.map((u) => u.key));

    if (actor.id === userId) {
      const revokesSettings = updates.some(
        (u) => u.key === 'settings.manage' && (u.granted === false || u.granted === null),
      );
      if (revokesSettings) {
        throw new ForbiddenException({
          ar: 'لا يمكنك إزالة صلاحية إدارة الإعدادات عن حسابك.',
          en: 'You cannot remove settings.manage from your own account.',
        });
      }
    }

    for (const { key, granted } of updates) {
      if (granted === null) {
        await this.userPermissionRepo.delete({ user_id: userId, permission_key: key });
        continue;
      }
      await this.userPermissionRepo.save({
        user_id: userId,
        permission_key: key,
        granted,
        granted_by: actor.id,
      });
    }

    return this.getUserPermissions(userId);
  }

  async hasPermission(
    userId: string,
    permissionKey: string,
    req?: PermissionRequestCache,
  ): Promise<boolean> {
    const effective = await this.resolveEffective(userId, req);
    return effective.get(permissionKey)?.granted ?? false;
  }

  async resolveEffective(
    userId: string,
    req?: PermissionRequestCache,
  ): Promise<Map<string, EffectivePermissionEntry>> {
    if (req?.permissionEffectiveByUser?.has(userId)) {
      return req.permissionEffectiveByUser.get(userId)!;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [roleRows, overrideRows] = await Promise.all([
      this.rolePermissionRepo.find({ where: { role: user.role } }),
      this.userPermissionRepo.find({ where: { user_id: userId } }),
    ]);

    const roleByKey = new Map(roleRows.map((r) => [r.permission_key, r.granted]));
    const overrideByKey = new Map(overrideRows.map((o) => [o.permission_key, o.granted]));

    const result = new Map<string, EffectivePermissionEntry>();
    for (const { key } of PERMISSION_CATALOGUE) {
      if (overrideByKey.has(key)) {
        const granted = overrideByKey.get(key)!;
        result.set(key, { key, granted, source: 'override' });
      } else if (roleByKey.has(key)) {
        const granted = roleByKey.get(key)!;
        result.set(key, {
          key,
          granted,
          source: granted ? 'role' : 'denied',
        });
      } else {
        result.set(key, { key, granted: false, source: 'denied' });
      }
    }

    if (req) {
      if (!req.permissionEffectiveByUser) {
        req.permissionEffectiveByUser = new Map();
      }
      req.permissionEffectiveByUser.set(userId, result);
    }
    return result;
  }

  private validateKeys(keys: string[]): void {
    const allowed = new Set(PERMISSION_CATALOGUE.map((p) => p.key));
    const invalid = keys.filter((k) => !allowed.has(k));
    if (invalid.length) {
      throw new BadRequestException(`Unknown permission keys: ${invalid.join(', ')}`);
    }
  }
}
