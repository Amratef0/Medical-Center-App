import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import {
  CreateSlotDto,
  GenerateBulkSlotsDto,
  UpdateSlotDto,
  SlotQueryDto,
} from './dto/scheduling.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Scheduling')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('slots')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a single slot' })
  createSlot(@Body() dto: CreateSlotDto, @CurrentUser() user: User) {
    return this.schedulingService.createSlot(dto, user.id);
  }

  @Post('slots/bulk')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate slots in bulk',
    description: 'Generate multiple slots based on a day-of-week pattern and date range. E.g., pattern [0,2,4] = Sun/Tue/Thu.',
  })
  generateBulkSlots(
    @Body() dto: GenerateBulkSlotsDto,
    @CurrentUser() user: User,
  ) {
    return this.schedulingService.generateBulkSlots(dto, user.id);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get all slots (with optional filters)' })
  findSlots(@Query() query: SlotQueryDto) {
    return this.schedulingService.findSlots(query);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get available slots for booking' })
  findAvailableSlots(@Query() query: SlotQueryDto) {
    return this.schedulingService.findAvailableSlots(query);
  }

  @Get('slots/:id')
  @ApiOperation({ summary: 'Get slot by ID' })
  findOne(@Param('id') id: string) {
    return this.schedulingService.findOne(id);
  }

  @Put('slots/:id')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update slot (status, capacity)' })
  update(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.schedulingService.update(id, dto);
  }

  @Delete('slots/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete slot (only if no bookings)' })
  remove(@Param('id') id: string) {
    return this.schedulingService.remove(id);
  }

  @Patch('slots/:id/book')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Book a slot (increment booked_count)' })
  bookSlot(@Param('id') id: string) {
    return this.schedulingService.bookSlot(id);
  }

  @Patch('slots/:id/cancel-booking')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Cancel a booking on a slot (decrement booked_count)' })
  cancelBooking(@Param('id') id: string) {
    return this.schedulingService.cancelBooking(id);
  }
}
