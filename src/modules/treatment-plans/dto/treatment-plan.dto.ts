import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TreatmentPlanServiceDto {
  @ApiProperty()
  @IsUUID()
  service_id: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sessions_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTreatmentPlanDto {
  @ApiProperty()
  @IsUUID()
  patient_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  total_sessions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ type: [TreatmentPlanServiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentPlanServiceDto)
  plan_services?: TreatmentPlanServiceDto[];
}

export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
