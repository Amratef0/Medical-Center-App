import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a prescription' })
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'List prescriptions' })
  findAll() {
    return this.prescriptionsService.findAll();
  }

  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'List prescriptions for a patient' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.prescriptionsService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'List prescriptions for a doctor' })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.prescriptionsService.findByDoctor(doctorId);
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get a prescription' })
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update a prescription' })
  update(@Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.prescriptionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a prescription' })
  remove(@Param('id') id: string) {
    return this.prescriptionsService.remove(id);
  }
}
