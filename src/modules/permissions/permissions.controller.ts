import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { AllowAnyStaff, Roles, RolesGuard } from '../../common/guards/roles.guard';
import { User, UserRole } from '../users/user.entity';
import { SetRolePermissionsDto, SetUserPermissionsDto } from './dto/permissions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Permission catalogue (Admin only)' })
  listCatalogue() {
    return this.permissionsService.listCatalogue();
  }

  @Get('permissions/effective')
  @AllowAnyStaff()
  @ApiOperation({ summary: 'Effective permissions for the current user' })
  async effectiveForCurrentUser(@CurrentUser() user: User) {
    const map = await this.permissionsService.resolveEffective(user.id);
    return {
      user_id: user.id,
      role: user.role,
      permissions: Array.from(map.values()),
    };
  }

  @Get('roles/:role/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Role default permissions (Admin only)' })
  getRolePermissions(@Param('role') role: UserRole) {
    return this.permissionsService.getRolePermissions(role);
  }

  @Put('roles/:role/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update role default permissions (Admin only)' })
  setRolePermissions(
    @Param('role') role: UserRole,
    @Body() dto: SetRolePermissionsDto,
  ) {
    return this.permissionsService.setRolePermissions(role, dto.permissions);
  }

  @Get('users/:id/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'User effective permissions with overrides (Admin only)' })
  getUserPermissions(@Param('id') id: string) {
    return this.permissionsService.getUserPermissions(id);
  }

  @Put('users/:id/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set user permission overrides (Admin only)' })
  setUserPermissions(
    @Param('id') id: string,
    @CurrentUser() actor: User,
    @Body() dto: SetUserPermissionsDto,
  ) {
    return this.permissionsService.setUserPermissions(id, actor, dto.permissions);
  }
}
