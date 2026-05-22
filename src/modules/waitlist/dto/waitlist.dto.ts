import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWaitlistDto {
  @ApiProperty()
  @IsUUID()
  patient_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  preferred_date?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  preferred_time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWaitlistDto extends PartialType(CreateWaitlistDto) {}
