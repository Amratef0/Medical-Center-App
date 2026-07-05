import { Controller, Get, Post, Put, Delete, Body, Param,Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto, UpdateWaitlistDto } from './dto/waitlist.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';


@ApiTags('Waitlist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add patient to waitlist' })
  create(@Body() dto: CreateWaitlistDto) {
    return this.waitlistService.create(dto);
  }

@Get()
@Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
@ApiOperation({ summary: 'Get all waitlist entries' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'search', required: false, type: String })
findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('search') search?: string,
) {
  return this.waitlistService.findAll(+page, +limit, search);
}

@Get(':id')
@Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
@ApiOperation({ summary: 'Get waitlist entry by ID' })
findOne(@Param('id') id: string) {
  return this.waitlistService.findOne(id);
}

  @Put(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update waitlist entry' })
  update(@Param('id') id: string, @Body() dto: UpdateWaitlistDto) {
    return this.waitlistService.update(id, dto);
  }

  @Post(':id/assign')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign slot to waitlist entry and convert to session' })
  assign(
    @Param('id') id: string,
    @Body('slot_id') slotId: string,
    @Body('session_date') sessionDate: string,
  ) {
    return this.waitlistService.assignFromWaitlist(id, slotId, sessionDate);
  }

  @Delete(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove from waitlist' })
  remove(@Param('id') id: string) {
    return this.waitlistService.remove(id);
  }
}
