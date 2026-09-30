import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_concurrent_sessions?: number;
}

export class UpdateRoomDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_concurrent_sessions?: number;
}
