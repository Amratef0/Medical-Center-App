import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import {
  ContractStatus,
  CollectionStatus,
  LetterType,
  LetterStatus,
} from '../contract.entity';

// ============ DTOs للتعاقدات ============

export class CreateContractDto {
  @ApiProperty({ example: 'شركة التأمين الوطنية' })
  @IsString()
  organization_name: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiPropertyOptional({ example: '0501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@company.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'الرياض - حي العليا' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'CNT-2024-001' })
  @IsOptional()
  @IsString()
  contract_number?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_value?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number;

  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({ example: 'الدفع كل ربع سنة' })
  @IsOptional()
  @IsString()
  payment_terms?: string;

  @ApiPropertyOptional({ example: ['علاج طبيعي', 'تخاطب'] })
  @IsOptional()
  @IsArray()
  covered_services?: string[];

  @ApiPropertyOptional({ example: 'ملاحظات عامة' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  collected_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  remaining_amount?: number;

  @ApiPropertyOptional({ enum: CollectionStatus })
  @IsOptional()
  @IsEnum(CollectionStatus)
  collection_status?: CollectionStatus;
}

// ============ DTOs للخطابات ============

export class CreateLetterDto {
  @ApiProperty({ example: 'uuid-contract-id' })
  @IsString()
  contract_id: string;

  @ApiProperty({ example: 'خطاب تجديد التعاقد' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ example: 'محتوى الخطاب...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: LetterType })
  @IsOptional()
  @IsEnum(LetterType)
  letter_type?: LetterType;

  @ApiPropertyOptional({ enum: LetterStatus })
  @IsOptional()
  @IsEnum(LetterStatus)
  status?: LetterStatus;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  letter_date: string;

  @ApiPropertyOptional({ example: '2024-06-20' })
  @IsOptional()
  @IsDateString()
  received_date?: string;

  @ApiPropertyOptional({ example: '2024-07-01' })
  @IsOptional()
  @IsDateString()
  response_date?: string;

  @ApiPropertyOptional({ example: 'REF-2024-001' })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document_path?: string;

  @ApiPropertyOptional({ example: 'إدارة المركز' })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiPropertyOptional({ example: 'شركة التأمين' })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLetterDto extends PartialType(CreateLetterDto) {}

// ============ DTO لدفعة التحصيل ============

export class RecordPaymentDto {
  @ApiProperty({ example: 1000, description: 'مبلغ التحصيل' })
  @IsNumber()
  @Min(0.01, { message: 'يجب أن يكون مبلغ التحصيل أكبر من صفر' })
  amount: number;

  @ApiPropertyOptional({ example: 'تحصيل دفعة إضافية', description: 'ملاحظات التحصيل' })
  @IsOptional()
  @IsString()
  notes?: string;
}

