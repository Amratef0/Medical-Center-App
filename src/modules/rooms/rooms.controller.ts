import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Rooms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Create a new room' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search?: string) {
    return this.roomsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Update room' })
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete room (Admin only)' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
