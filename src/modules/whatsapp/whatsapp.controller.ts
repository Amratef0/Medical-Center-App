import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

const WHATSAPP_ROLES = [
  UserRole.ADMIN,
  UserRole.OPERATIONS_MANAGER,
  UserRole.CUSTOMER_SUPPORT,
  UserRole.RECEPTIONIST,
] as const;

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  @Get('contacts')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(...WHATSAPP_ROLES)
  @ApiOperation({ summary: 'Get WhatsApp contacts' })
  getContacts() {
    return this.whatsappService.getContacts();
  }

  @Get('templates')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(...WHATSAPP_ROLES)
  @ApiOperation({ summary: 'Get WhatsApp message templates' })
  getTemplates() {
    return this.whatsappService.getTemplates();
  }

  @Put('templates/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a WhatsApp template' })
  updateTemplate(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.whatsappService.updateTemplate(id, dto as never);
  }

  @Get('flows')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(...WHATSAPP_ROLES)
  @ApiOperation({ summary: 'Get WhatsApp automation flows' })
  getFlows() {
    return this.whatsappService.getFlows();
  }

  @Put('flows/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a WhatsApp automation flow' })
  updateFlow(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.whatsappService.updateFlow(id, dto as never);
  }

  @Get('history')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(...WHATSAPP_ROLES)
  @ApiOperation({ summary: 'Get WhatsApp message history' })
  getHistory() {
    return this.whatsappService.getHistory();
  }

  @Post('send')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(...WHATSAPP_ROLES)
  @ApiOperation({ summary: 'Send a WhatsApp message via configured provider' })
  sendMessage(
    @Body() dto: { phone: string; message: string; templateId?: string },
  ) {
    return this.whatsappService.sendMessage(dto);
  }

  @Post('schedule')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(...WHATSAPP_ROLES)
  @ApiOperation({ summary: 'Schedule a WhatsApp message' })
  scheduleMessage(
    @Body()
    dto: {
      phone: string;
      message: string;
      templateId?: string;
      scheduledTime: string;
    },
  ) {
    return this.whatsappService.scheduleMessage(dto);
  }

  @Post('webhook')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Provider delivery webhook (signature required)' })
  async webhook(
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Req() req: { rawBody?: Buffer; body: any },
  ) {
    const secret = this.config.get<string>('WHATSAPP_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Webhook secret is not configured');
    }
    const raw =
      req.rawBody?.toString('utf8') ||
      JSON.stringify(req.body ?? {});
    const expected = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signature || '');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const statuses = req.body?.entry?.[0]?.changes?.[0]?.value?.statuses || [];
    for (const st of statuses) {
      const map: Record<string, 'DELIVERED' | 'READ' | 'FAILED'> = {
        delivered: 'DELIVERED',
        read: 'READ',
        failed: 'FAILED',
      };
      const mapped = map[st.status];
      if (mapped && st.id) {
        await this.whatsappService.applyWebhookStatus({
          providerMessageId: st.id,
          status: mapped,
          errorMessage: st.errors?.[0]?.title,
        });
      }
    }
    return { ok: true };
  }
}
