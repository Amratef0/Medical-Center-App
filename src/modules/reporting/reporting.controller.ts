import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { ReportRangeQuery } from './dto/report-range.dto';

@ApiTags('Reporting')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('daily')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get daily operations report',
    description: 'Returns scheduling utilization, revenue, and drop-offs for a given date.',
  })
  @ApiQuery({ name: 'date', required: false, example: '2025-06-01' })
  getDailyReport(@Query('date') date?: string) {
    return this.reportingService.getDailyReport(
      date || new Date().toISOString().split('T')[0],
    );
  }

  @Get('doctor-utilization')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get doctor utilization report (slot-based, legacy)',
    description: 'Returns capacity vs bookings per doctor for a date range.',
  })
  @ApiQuery({ name: 'from', required: true, example: '2025-06-01' })
  @ApiQuery({ name: 'to', required: true, example: '2025-06-30' })
  getDoctorUtilization(@Query('from') from: string, @Query('to') to: string) {
    return this.reportingService.getDoctorUtilization(from, to);
  }

  @Get('conversion-rate')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get assessment-to-paid conversion rate',
    description:
      'Returns the ratio of assessments that converted to paid packages vs drop-offs.',
  })
  @ApiQuery({ name: 'from', required: true, example: '2025-06-01' })
  @ApiQuery({ name: 'to', required: true, example: '2025-06-30' })
  getConversionRate(@Query('from') from: string, @Query('to') to: string) {
    return this.reportingService.getConversionRate(from, to);
  }

  @Get('patient-source')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Patient referral source breakdown' })
  getPatientSource(@Query() query: ReportRangeQuery) {
    return this.reportingService.getPatientSourceReport(query.from, query.to);
  }

  @Get('capacity')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Centre, doctor and room capacity utilization' })
  getCapacity(@Query() query: ReportRangeQuery) {
    return this.reportingService.getCapacityReport(query.from, query.to);
  }

  @Get('attendance')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Attendance, no-show and cancellation rates' })
  getAttendance(@Query() query: ReportRangeQuery) {
    return this.reportingService.getAttendanceReport(query.from, query.to);
  }

  @Get('packages')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Package lifecycle and renewals' })
  getPackages(@Query() query: ReportRangeQuery) {
    return this.reportingService.getPackagesReport(query.from, query.to);
  }

  @Get('finance')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.FINANCE)
  @ApiOperation({ summary: 'Centre-wide finance roll-up' })
  getFinance(@Query() query: ReportRangeQuery) {
    return this.reportingService.getFinanceReport(query.from, query.to);
  }
}
