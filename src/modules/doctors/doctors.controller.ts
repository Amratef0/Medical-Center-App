import { Controller, Get, Post, Put, Delete, Body, Param, Query,UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  CreateDoctorAvailabilityDto,
  UpdateDoctorAvailabilityDto,
} from './dto/doctor.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Doctors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Create a new doctor' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

@Get()
@ApiOperation({ summary: 'Get all active doctors' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search?: string,
) {
  return this.doctorsService.findAll(+page, +limit, search);
}

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID with availability' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Update doctor' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate doctor (Admin only)' })
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}

@ApiTags('Doctor Availability')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('doctors/:doctorId/availability')
export class DoctorAvailabilityController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Add availability slot for a doctor' })
  add(@Param('doctorId') doctorId: string, @Body() dto: CreateDoctorAvailabilityDto) {
    return this.doctorsService.addAvailability(doctorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all availability slots for a doctor' })
  get(@Param('doctorId') doctorId: string) {
    return this.doctorsService.getAvailability(doctorId);
  }

  @Put(':availabilityId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Update availability slot' })
  update(
    @Param('doctorId') doctorId: string,
    @Param('availabilityId') availabilityId: string,
    @Body() dto: UpdateDoctorAvailabilityDto,
  ) {
    return this.doctorsService.updateAvailability(doctorId, availabilityId, dto);
  }

  @Delete(':availabilityId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Deactivate availability slot' })
  remove(@Param('doctorId') doctorId: string, @Param('availabilityId') availabilityId: string) {
    return this.doctorsService.removeAvailability(doctorId, availabilityId);
  }
}
