import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { CapacityService } from './capacity.service';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

class CapacityOverviewQuery {
  @IsDateString()
  date: string;
}

@ApiTags('Capacity')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('capacity')
export class CapacityController {
  constructor(private readonly capacityService: CapacityService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Centre, doctor and room utilization for a date' })
  @ApiQuery({ name: 'date', example: '2035-06-01' })
  async overview(@Query() query: CapacityOverviewQuery) {
    return this.capacityService.getOverview(query.date);
  }
}
