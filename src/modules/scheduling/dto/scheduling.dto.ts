import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { SlotType } from '../schedule-slot.entity';

export class CreateSlotDto {
  @ApiProperty({ description: 'Doctor ID' })
  @IsUUID()
  doctor_id: string;

  @ApiPropertyOptional({ description: 'Service ID' })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({ example: '2025-06-01T09:00:00Z', description: 'Start time (ISO Datetime)' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2025-06-01T09:30:00Z', description: 'End time (ISO Datetime)' })
  @IsDateString()
  end_time: string;

  @ApiPropertyOptional({ example: 1, description: 'Slot capacity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: SlotType })
  @IsOptional()
  @IsEnum(SlotType)
  type?: SlotType;
}

export class GenerateBulkSlotsDto {
  @ApiProperty({ description: 'Doctor ID' })
  @IsUUID()
  doctor_id: string;

  @ApiPropertyOptional({ description: 'Service ID' })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({
    example: [0, 2, 4],
    description: 'Days of the week (0=Sunday, 6=Saturday). E.g. [0,2,4] = Sun/Tue/Thu',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  pattern: number[];

  @ApiProperty({ example: '2025-06-01', description: 'Start date range' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2025-08-31', description: 'End date range' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ example: '09:00', description: 'Daily start time' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be in HH:mm format' })
  start_time: string;

  @ApiProperty({ example: '17:00', description: 'Daily end time' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be in HH:mm format' })
  end_time: string;

  @ApiProperty({ example: 30, description: 'Duration of each slot in minutes' })
  @IsNumber()
  @Min(5)
  slot_duration_minutes: number;

  @ApiPropertyOptional({ example: 1, description: 'Capacity per slot' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}

export class UpdateSlotDto {
  @ApiPropertyOptional()
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ enum: SlotType })
  @IsOptional()
  @IsEnum(SlotType)
  type?: SlotType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}

export class SlotQueryDto {
  @ApiPropertyOptional({ description: 'Filter by doctor ID' })
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiPropertyOptional({ description: 'Filter by service ID' })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiPropertyOptional({ example: '2025-06-01', description: 'From date' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2025-06-30', description: 'To date' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
