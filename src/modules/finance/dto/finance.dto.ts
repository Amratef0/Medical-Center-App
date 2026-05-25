import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patient_id: string;

  @ApiPropertyOptional({ description: 'Package ID' })
  @IsOptional()
  @IsUUID()
  package_id?: string;

  @ApiPropertyOptional({ description: 'Patient Package ID' })
  @IsOptional()
  @IsUUID()
  patient_package_id?: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'PERCENTAGE' })
  @IsOptional()
  @IsString()
  discount_type?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'PO-2025-001' })
  @IsString()
  po_number: string;

  @ApiProperty({ example: 'MedEquip Co.' })
  @IsString()
  vendor_name: string;

  @ApiPropertyOptional({ example: 'Purchase of medical supplies' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 5000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_amount?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patient_id: string;

  @ApiPropertyOptional({ description: 'Payment ID associated with this invoice' })
  @IsOptional()
  @IsUUID()
  payment_id?: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 250.00, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
