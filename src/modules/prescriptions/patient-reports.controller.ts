import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePatientReportDto, UpdatePatientReportDto } from './dto/prescription.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Patient reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('patients/:patientId/reports')
export class PatientReportsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Add a report to a patient chart' })
  create(@Param('patientId') patientId: string, @Body() dto: CreatePatientReportDto) {
    return this.prescriptionsService.createReport(patientId, dto);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'List reports for a patient' })
  findAll(@Param('patientId') patientId: string) {
    return this.prescriptionsService.findReports(patientId);
  }

  @Put(':reportId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update a patient report' })
  update(
    @Param('patientId') patientId: string,
    @Param('reportId') reportId: string,
    @Body() dto: UpdatePatientReportDto,
  ) {
    return this.prescriptionsService.updateReport(patientId, reportId, dto);
  }

  @Delete(':reportId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a patient report' })
  remove(@Param('patientId') patientId: string, @Param('reportId') reportId: string) {
    return this.prescriptionsService.removeReport(patientId, reportId);
  }
}
