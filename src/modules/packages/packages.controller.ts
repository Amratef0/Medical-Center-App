import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import {
  CreatePackageDto,
  UpdatePackageDto,
  AssignPackageDto,
} from './dto/package.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Packages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a new package' })
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all packages' })
  findAll() {
    return this.packagesService.findAll();
  }

  @Get('assign/completed-sessions')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get sessions completed today where the patient does not have an active package' })
  getCompletedSessions() {
    return this.packagesService.getCompletedFirstSessions();
  }

  @Post('assign')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a package to a patient' })
  assign(@Body() dto: AssignPackageDto, @CurrentUser() user: User) {
    return this.packagesService.assignToPatient(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID' })
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Update package' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete package (Admin only)' })
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}

@ApiTags('Patient Packages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('patient-packages')
export class PatientPackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get all patient packages across the center' })
  getAllPatientPackages() {
    return this.packagesService.findAllPatientPackages();
  }

  @Get('patient/:patientId')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get all packages for a patient' })
  getPatientPackages(@Param('patientId') patientId: string) {
    return this.packagesService.getPatientPackages(patientId);
  }

  @Patch(':id/deduct')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Deduct a session from a patient package' })
  deductSession(@Param('id') id: string) {
    return this.packagesService.deductSession(id);
  }
}
