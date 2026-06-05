import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Payment } from './payment.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Invoice } from './invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PurchaseOrder, Invoice])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
