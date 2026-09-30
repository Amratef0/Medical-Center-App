import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { AllowAnyStaff, Roles, RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new system notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @AllowAnyStaff()
  @ApiOperation({ summary: 'Get recent system notifications' })
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAll(user.role);
  }

  @Get(':id')
  @AllowAnyStaff()
  @ApiOperation({ summary: 'Get notification by ID' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update notification' })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.update(id, dto);
  }

  @Patch(':id/read')
  @AllowAnyStaff()
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @AllowAnyStaff()
  @ApiOperation({ summary: 'Mark all notifications as read for current role' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
