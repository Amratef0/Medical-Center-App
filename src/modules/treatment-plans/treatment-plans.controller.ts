import { Controller, Get, Post, Put, Delete, Body, Param,Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TreatmentPlansService } from './treatment-plans.service';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto } from './dto/treatment-plan.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Treatment Plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('treatment-plans')
export class TreatmentPlansController {
  constructor(private readonly treatmentPlansService: TreatmentPlansService) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a treatment plan (Doctor only)' })
  create(@Body() dto: CreateTreatmentPlanDto) {
    return this.treatmentPlansService.create(dto);
  }

 @Get()
@Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.RECEPTIONIST)
@ApiOperation({ summary: 'Get all treatment plans' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search?: string,
) {
  return this.treatmentPlansService.findAll(+page, +limit, search);
}

@Get('patient/:patientId')
@Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.RECEPTIONIST)
@ApiOperation({ summary: 'Get treatment plans for a specific patient' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
findByPatient(
  @Param('patientId') patientId: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.treatmentPlansService.findByPatient(patientId, +page, +limit);
}

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get treatment plan by ID' })
  findOne(@Param('id') id: string) {
    return this.treatmentPlansService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update treatment plan' })
  update(@Param('id') id: string, @Body() dto: UpdateTreatmentPlanDto) {
    return this.treatmentPlansService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete treatment plan (Admin only)' })
  remove(@Param('id') id: string) {
    return this.treatmentPlansService.remove(id);
  }
}
