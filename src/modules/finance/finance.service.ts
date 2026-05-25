import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, ApprovalStatus } from './payment.entity';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { PurchaseOrder } from './purchase-order.entity';
import {
  CreatePaymentDto,
  CreateInvoiceDto,
  CreatePurchaseOrderDto,
} from './dto/finance.dto';
import { User } from '../users/user.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepo: Repository<Invoice>,
    @InjectRepository(PurchaseOrder)
    private poRepo: Repository<PurchaseOrder>,
  ) {}

  // ──────────── Payments & Discount Approvals ────────────

  async recordPayment(dto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentsRepo.create({
      ...dto,
      status: PaymentStatus.PAID,
      approval_status: ApprovalStatus.APPROVED,
    });
    return this.paymentsRepo.save(payment);
  }

  async requestDiscountPayment(dto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentsRepo.create({
      ...dto,
      status: PaymentStatus.PENDING,
      approval_status: ApprovalStatus.PENDING,
    });
    return this.paymentsRepo.save(payment);
  }

  async findAllPayments(): Promise<Payment[]> {
    return this.paymentsRepo.find({
      relations: ['patient_package'],
      order: { created_at: 'DESC' },
    });
  }

  async findPaymentsByPatient(patientId: string): Promise<Payment[]> {
    return this.paymentsRepo.find({
      where: { patient_id: patientId },
      relations: ['patient_package'],
      order: { created_at: 'DESC' },
    });
  }

  async findPendingDiscounts(): Promise<Payment[]> {
    return this.paymentsRepo.find({
      where: { approval_status: ApprovalStatus.PENDING },
      relations: ['patient_package'],
      order: { created_at: 'ASC' },
    });
  }

  async approveDiscount(id: string, approvedBy: User): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment record not found');

    if (payment.approval_status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Payment is not pending discount approval');
    }

    payment.approval_status = ApprovalStatus.APPROVED;
    payment.status = PaymentStatus.PAID;
    payment.approved_by = approvedBy.id;
    payment.approved_at = new Date();
    return this.paymentsRepo.save(payment);
  }

  async rejectDiscount(id: string, approvedBy: User): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment record not found');

    if (payment.approval_status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Payment is not pending discount approval');
    }

    payment.approval_status = ApprovalStatus.REJECTED;
    payment.status = PaymentStatus.REJECTED;
    payment.approved_by = approvedBy.id;
    payment.approved_at = new Date();
    return this.paymentsRepo.save(payment);
  }

  // ──────────── Purchase Orders ────────────

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, user: User): Promise<PurchaseOrder> {
    const po = this.poRepo.create({
      ...dto,
      created_by: user.id,
    });
    return this.poRepo.save(po);
  }

  async findAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.poRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  // ──────────── Invoices ────────────

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const discount = dto.discount || 0;
    const totalAmount = dto.subtotal - discount;

    if (totalAmount < 0) {
      throw new BadRequestException('Total amount cannot be negative');
    }

    const invoice = this.invoicesRepo.create({
      invoice_number: invoiceNumber,
      patient_id: dto.patient_id,
      payment_id: dto.payment_id,
      subtotal: dto.subtotal,
      discount,
      total_amount: totalAmount,
      status: InvoiceStatus.PENDING,
    });

    return this.invoicesRepo.save(invoice);
  }

  async markInvoicePaid(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_at = new Date();
    return this.invoicesRepo.save(invoice);
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    invoice.status = InvoiceStatus.CANCELLED;
    return this.invoicesRepo.save(invoice);
  }

  async findInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepo.findOne({
      where: { id },
      relations: ['payment'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findInvoicesByPatient(patientId: string): Promise<Invoice[]> {
    return this.invoicesRepo.find({
      where: { patient_id: patientId },
      relations: ['payment'],
      order: { created_at: 'DESC' },
    });
  }

  // ──────────── Financial Summary ────────────

  async getPatientFinancialSummary(patientId: string) {
    const payments = await this.findPaymentsByPatient(patientId);
    const invoices = await this.findInvoicesByPatient(patientId);

    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalInvoiced = invoices
      .filter((i) => i.status !== InvoiceStatus.CANCELLED)
      .reduce((sum, i) => sum + Number(i.total_amount), 0);

    const outstandingBalance = totalInvoiced - totalPaid;

    return {
      patient_id: patientId,
      total_paid: totalPaid,
      total_invoiced: totalInvoiced,
      outstanding_balance: outstandingBalance,
      payments_count: payments.length,
      invoices_count: invoices.length,
    };
  }

  // ──────────── Helpers ────────────

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await this.invoicesRepo
      .createQueryBuilder('invoice')
      .where('invoice.invoice_number LIKE :prefix', { prefix: `INV-${year}-%` })
      .orderBy('invoice.created_at', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoice_number.split('-')[2], 10);
      sequence = lastNum + 1;
    }

    return `INV-${year}-${String(sequence).padStart(5, '0')}`;
  }
}
