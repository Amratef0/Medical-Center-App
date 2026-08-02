import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new system notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get recent system notifications' })
  @ApiQuery({ name: 'role', required: false, type: String })
  findAll(@Query('role') role?: string, @Request() req?: any) {
    const userRole = role || (req?.user?.role);
    return this.notificationsService.findAll(userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update notification' })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.update(id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current role' })
  markAllAsRead(@Query('role') role?: string, @Request() req?: any) {
    const userRole = role || (req?.user?.role);
    return this.notificationsService.markAllAsRead(userRole);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
