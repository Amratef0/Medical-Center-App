import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  AttachmentKind,
  AttachmentOwnerType,
} from '../attachment.entity';
import { MAX_ATTACHMENT_BYTES } from '../../storage/storage.constants';

export class PresignAttachmentDto {
  @ApiProperty({ enum: AttachmentOwnerType })
  @IsEnum(AttachmentOwnerType)
  owner_type: AttachmentOwnerType;

  @ApiProperty()
  @IsUUID()
  owner_id: string;

  @ApiProperty({ enum: AttachmentKind })
  @IsEnum(AttachmentKind)
  kind: AttachmentKind;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mime_type: string;

  @ApiProperty({ example: 102400 })
  @IsInt()
  @Min(1)
  @Max(MAX_ATTACHMENT_BYTES)
  size_bytes: number;
}

export class ConfirmAttachmentDto {
  @ApiProperty()
  @IsString()
  storage_key: string;

  @ApiProperty({ enum: AttachmentOwnerType })
  @IsEnum(AttachmentOwnerType)
  owner_type: AttachmentOwnerType;

  @ApiProperty()
  @IsUUID()
  owner_id: string;

  @ApiProperty({ enum: AttachmentKind })
  @IsEnum(AttachmentKind)
  kind: AttachmentKind;

  @ApiProperty()
  @IsString()
  mime_type: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(MAX_ATTACHMENT_BYTES)
  size_bytes: number;
}

export class AttachmentDownloadQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expires?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sig?: string;
}
