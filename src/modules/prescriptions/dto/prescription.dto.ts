import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsUUID()
  patient_id: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsUUID()
  doctor_id?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  medications?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachment_ref?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;
}

export class UpdatePrescriptionDto {
  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsUUID()
  patient_id?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsUUID()
  doctor_id?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== '' && value !== null && value !== undefined)
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  medications?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachment_ref?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;
}

export class CreatePatientReportDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  report_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export class UpdatePatientReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  report_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}
