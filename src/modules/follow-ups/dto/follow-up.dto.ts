import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  FollowUpType,
  FollowUpStatus,
} from '../follow-up.entity';

export class CreateFollowUpDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patient_id: string;

  @ApiProperty({ enum: FollowUpType })
  @IsEnum(FollowUpType)
  type: FollowUpType;

  @ApiPropertyOptional({ description: 'Message content for the task' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateFollowUpDto {
  @ApiPropertyOptional({ enum: FollowUpStatus })
  @IsOptional()
  @IsEnum(FollowUpStatus)
  status?: FollowUpStatus;
}
