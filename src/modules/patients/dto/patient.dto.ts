import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PatientStatus } from '../patient.entity';

export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'الاسم رباعي بالعربي' })
  @IsOptional()
  @IsString()
  full_name_ar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referral_source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referral_doctor_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  national_id_photo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  national_id_front?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  national_id_back?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergency_contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({ enum: PatientStatus })
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}
