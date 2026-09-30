import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Daily session cap; omit or null for unlimited',
    minimum: 1,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  max_sessions_per_day?: number | null;
}

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateDoctorAvailabilityDto {
  @ApiProperty({ description: '0=Sunday, 1=Monday ... 6=Saturday', minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  start_time: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  end_time: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  slot_capacity?: number;
}

export class UpdateDoctorAvailabilityDto extends PartialType(CreateDoctorAvailabilityDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
