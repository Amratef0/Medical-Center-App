import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import {
  CreatePaymentDto,
  CreateInvoiceDto,
  CreatePurchaseOrderDto,
} from './dto/finance.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Finance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ──────────── Payments & Discounts ────────────

  @Post('payments')
  @Roles(UserRole.RECEPTIONIST, UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Record a direct paid payment' })
  recordPayment(@Body() dto: CreatePaymentDto) {
    return this.financeService.recordPayment(dto);
  }

  @Post('discounts')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Request a discount payment (needs Finance approval)' })
  requestDiscount(@Body() dto: CreatePaymentDto) {
    return this.financeService.requestDiscountPayment(dto);
  }

  @Get('payments')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all payments' })
  findAllPayments() {
    return this.financeService.findAllPayments();
  }

  @Get('patients/:patientId/payments')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get payments for a specific patient' })
  findPaymentsByPatient(@Param('patientId') patientId: string) {
    return this.financeService.findPaymentsByPatient(patientId);
  }

  @Get('discounts/pending')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending discount payments' })
  findPendingDiscounts() {
    return this.financeService.findPendingDiscounts();
  }

  @Patch('discounts/:id/approve')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a pending discount' })
  approveDiscount(@Param('id') id: string, @CurrentUser() user: User) {
    return this.financeService.approveDiscount(id, user);
  }

  @Patch('discounts/:id/reject')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a pending discount' })
  rejectDiscount(@Param('id') id: string, @CurrentUser() user: User) {
    return this.financeService.rejectDiscount(id, user);
  }

  // ──────────── Purchase Orders ────────────

  @Post('purchase-orders')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a purchase order' })
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: User) {
    return this.financeService.createPurchaseOrder(dto, user);
  }

  @Get('purchase-orders')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all purchase orders' })
  findAllPurchaseOrders() {
    return this.financeService.findAllPurchaseOrders();
  }

  // ──────────── Invoices ────────────

  @Post('invoices')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new invoice' })
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(dto);
  }

  @Get('invoices/:id')
  @Roles(UserRole.FINANCE, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get invoice by ID' })
  findInvoice(@Param('id') id: string) {
    return this.financeService.findInvoice(id);
  }

  @Patch('invoices/:id/mark-paid')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  markInvoicePaid(@Param('id') id: string) {
    return this.financeService.markInvoicePaid(id);
  }

  @Patch('invoices/:id/cancel')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an invoice' })
  cancelInvoice(@Param('id') id: string) {
    return this.financeService.cancelInvoice(id);
  }

  // ──────────── Summary ────────────

  @Get('patients/:patientId/summary')
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get financial summary for a patient' })
  getPatientSummary(@Param('patientId') patientId: string) {
    return this.financeService.getPatientFinancialSummary(patientId);
  }
}
