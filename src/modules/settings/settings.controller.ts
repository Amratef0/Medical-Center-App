import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UserRole } from '../users/user.entity';

class UpdateSettingDto {
  @IsString()
  value: string;
}

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List system settings' })
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Read one system setting' })
  async findOne(@Param('key') key: string) {
    return { key, value: await this.settingsService.get(key) };
  }

  @Put(':key')
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings.manage')
  @ApiOperation({ summary: 'Write one system setting' })
  async update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    const saved = await this.settingsService.set(key, dto.value);
    return { key: saved.setting_key, value: saved.value };
  }
}
