import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, default: NotificationType.GENERAL })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  target_role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_id?: string;
}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
