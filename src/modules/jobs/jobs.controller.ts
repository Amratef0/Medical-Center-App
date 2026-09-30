import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Last successful run and last error per scheduled job' })
  getHealth() {
    return this.jobsService.getHealthSnapshot();
  }
}
