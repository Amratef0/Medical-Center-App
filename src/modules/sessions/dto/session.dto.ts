import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SessionStatus, SessionType } from '../session.entity';
import { AttendanceStatus } from '../attendance.entity';

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  patient_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  slot_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  treatment_plan_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  patient_package_id?: string;

  @ApiProperty({ enum: SessionType })
  @IsEnum(SessionType)
  session_type: SessionType;

  @ApiProperty()
  @IsDateString()
  session_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reception_notes?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @ApiPropertyOptional({ enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doctor_notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  absence_reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_deducted?: boolean;
}

export class CreateAttendanceDto {
  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
