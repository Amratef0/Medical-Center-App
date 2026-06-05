import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto/follow-up.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Follow-ups')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a follow-up task' })
  create(@Body() dto: CreateFollowUpDto) {
    return this.followUpsService.create(dto);
  }

  @Get()
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all follow-up tasks' })
  findAll() {
    return this.followUpsService.findAll();
  }

  @Get('pending')
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending follow-up tasks' })
  findPending() {
    return this.followUpsService.findPending();
  }

  @Get('patient/:patientId')
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get follow-ups for a specific patient' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.followUpsService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get follow-up task by ID' })
  findOne(@Param('id') id: string) {
    return this.followUpsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update follow-up task (status, notes, assignment)' })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followUpsService.update(id, dto);
  }

  @Get('patient/:patientId/whatsapp-logs')
  @Roles(UserRole.CUSTOMER_SUPPORT, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get WhatsApp message logs for a patient' })
  getWhatsAppLogs(@Param('patientId') patientId: string) {
    return this.followUpsService.getWhatsAppLogs(patientId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete follow-up task' })
  remove(@Param('id') id: string) {
    return this.followUpsService.remove(id);
  }
}
