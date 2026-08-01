import { Controller, Get, Post, Put, Delete, Body, Param, Query,UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto, CreateAttendanceDto } from './dto/session.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { SessionConfirmStatus } from './session.entity';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Book a new session' })
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Get('calendar-view')
  @ApiOperation({ summary: 'Get calendar sessions between dates' })
  @ApiQuery({ name: 'from', required: true, type: String })
  @ApiQuery({ name: 'to', required: true, type: String })
  @ApiQuery({ name: 'doctor_id', required: false, type: String })
  @ApiQuery({ name: 'room_id', required: false, type: String })
  getCalendarView(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('doctor_id') doctorId?: string,
    @Query('room_id') roomId?: string,
  ) {
    return this.sessionsService.getCalendarView(from, to, doctorId, roomId);
  }

  @Put(':id/reschedule')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Reschedule session date/time or room' })
  reschedule(
    @Param('id') id: string,
    @Body('session_date') sessionDate: string,
    @Body('room_id') roomId?: string,
  ) {
    return this.sessionsService.reschedule(id, sessionDate, roomId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
@ApiQuery({ name: 'doctor_id', required: false, type: String })
@ApiQuery({ name: 'from', required: false, type: String })
@ApiQuery({ name: 'to', required: false, type: String })
findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search?: string,
  @Query('doctor_id') doctor_id?: string,
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  return this.sessionsService.findAll(+page, +limit, search, doctor_id, from, to);
}

@Get('patient/:patientId')
@ApiOperation({ summary: 'Get all sessions for a patient' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
findByPatient(
  @Param('patientId') patientId: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.sessionsService.findByPatient(patientId, +page, +limit);
}

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get all sessions for a specific date (YYYY-MM-DD)' })
  findByDate(@Param('date') date: string) {
    return this.sessionsService.findByDate(date);
  }

  @Put(':id/confirm')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Confirm or decline a session' })
  confirm(
    @Param('id') id: string,
    @Body('confirm_status') confirmStatus: SessionConfirmStatus,
  ) {
    return this.sessionsService.confirm(id, confirmStatus);
  }

  @Get('daily-followup')
  @ApiOperation({ summary: 'Get daily follow-up summary and session status list' })
  @ApiQuery({ name: 'date', required: false, type: String })
  getDailyFollowUp(@Query('date') date?: string) {
    return this.sessionsService.getDailyFollowUp(date);
  }

  @Post(':id/check-in')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Check-in patient for a session' })
  checkIn(@Param('id') id: string) {
    return this.sessionsService.checkIn(id);
  }

  @Post(':id/check-out')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Check-out patient after a session' })
  checkOut(@Param('id') id: string) {
    return this.sessionsService.checkOut(id);
  }

  @Post(':id/start')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark session as started' })
  startSession(@Param('id') id: string) {
    return this.sessionsService.startSession(id);
  }

  @Post(':id/end')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark session as ended' })
  endSession(@Param('id') id: string) {
    return this.sessionsService.endSession(id);
  }

  @Put(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update session (status, notes, etc.)' })
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete session (Admin only)' })
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('sessions/:sessionId/attendance')
export class AttendanceController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark attendance for a session' })
  mark(@Param('sessionId') sessionId: string, @Body() dto: CreateAttendanceDto) {
    return this.sessionsService.markAttendance(sessionId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get attendance record for a session' })
  get(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getAttendance(sessionId);
  }
}
