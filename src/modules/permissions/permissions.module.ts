import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { UserPermission } from './user-permission.entity';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from '../users/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission, UserPermission, User])],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    PermissionsGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
