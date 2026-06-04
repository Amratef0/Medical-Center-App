import { Controller, Get, Post, Put, Delete, Body, Param, Query,UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { CreateMedicalHistoryDto, UpdateMedicalHistoryDto } from './dto/medical-history.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new patient' })
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: User) {
    return this.patientsService.create(dto, user);
  }

 @Get()
@Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
@ApiOperation({ summary: 'Get all patients' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search?: string,
) {
  return this.patientsService.findAll(+page, +limit, search);
}

  @Get(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update patient' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete patient (Admin only)' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}

@ApiTags('Medical History')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('patients/:patientId/medical-history')
export class MedicalHistoryController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update medical history for a patient' })
  create(@Param('patientId') patientId: string, @Body() dto: CreateMedicalHistoryDto) {
    return this.patientsService.createMedicalHistory(patientId, dto);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get medical history for a patient' })
  get(@Param('patientId') patientId: string) {
    return this.patientsService.getMedicalHistory(patientId);
  }

  @Put()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update medical history' })
  update(@Param('patientId') patientId: string, @Body() dto: UpdateMedicalHistoryDto) {
    return this.patientsService.updateMedicalHistory(patientId, dto);
  }
}
