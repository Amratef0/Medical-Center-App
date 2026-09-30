import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class PermissionGrantDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsBoolean()
  granted: boolean;
}

export class SetRolePermissionsDto {
  @ApiProperty({ type: [PermissionGrantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionGrantDto)
  permissions: PermissionGrantDto[];
}

export class UserPermissionUpdateDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty({ description: 'true/false for override; null clears override' })
  @IsOptional()
  granted: boolean | null;
}

export class SetUserPermissionsDto {
  @ApiProperty({ type: [UserPermissionUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionUpdateDto)
  permissions: UserPermissionUpdateDto[];
}

export class RoleParamDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
