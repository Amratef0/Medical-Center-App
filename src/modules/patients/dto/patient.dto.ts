import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PatientStatus } from '../patient.entity';

export class CreatePatientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

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
  @IsString()
  date_of_birth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  age?: number;

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
  referral_friend_name?: string;

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
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registeredBy?: string;

  @ApiPropertyOptional({ enum: PatientStatus })
  @IsOptional()
  status?: any;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({ enum: PatientStatus })
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}
