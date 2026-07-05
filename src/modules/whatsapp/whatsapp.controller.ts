import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('WhatsApp')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('contacts')
  @ApiOperation({ summary: 'Get all WhatsApp contacts (Doctors and Patients)' })
  getContacts() {
    return this.whatsappService.getContacts();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get WhatsApp message templates' })
  getTemplates() {
    return this.whatsappService.getTemplates();
  }

  @Get('flows')
  @ApiOperation({ summary: 'Get WhatsApp automation flows' })
  getFlows() {
    return this.whatsappService.getFlows();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get WhatsApp message history log' })
  getHistory() {
    return this.whatsappService.getHistory();
  }

  @Post('send')
  @ApiOperation({ summary: 'Send direct WhatsApp message' })
  sendMessage(
    @Body() dto: { phone: string; message: string; templateId?: string },
  ) {
    return this.whatsappService.sendMessage(dto);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a WhatsApp message' })
  scheduleMessage(
    @Body() dto: { phone: string; message: string; templateId?: string; scheduledTime: string },
  ) {
    return this.whatsappService.scheduleMessage(dto);
  }
}
