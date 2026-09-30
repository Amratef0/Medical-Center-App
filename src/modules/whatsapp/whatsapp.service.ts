import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { WhatsAppLog, WhatsAppMessageStatus } from '../follow-ups/whatsapp-log.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { WhatsAppTemplate } from './whatsapp-template.entity';
import { WhatsAppFlow } from './whatsapp-flow.entity';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider';
import type { WhatsAppProvider } from './providers/whatsapp-provider';

@Injectable()
export class WhatsappService {
  constructor(
    @InjectRepository(WhatsAppLog)
    private whatsappLogsRepo: Repository<WhatsAppLog>,
    @InjectRepository(Patient)
    private patientsRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorsRepo: Repository<Doctor>,
    @InjectRepository(WhatsAppTemplate)
    private templatesRepo: Repository<WhatsAppTemplate>,
    @InjectRepository(WhatsAppFlow)
    private flowsRepo: Repository<WhatsAppFlow>,
    @Inject(WHATSAPP_PROVIDER)
    private readonly provider: WhatsAppProvider,
  ) {}

  async getContacts(): Promise<any[]> {
    const patients = await this.patientsRepo.find({
      select: ['id', 'first_name', 'last_name', 'phone', 'whatsapp_opt_out'],
    });
    const doctors = await this.doctorsRepo.find({ select: ['id', 'name', 'phone'] });

    const patientContacts = patients.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      phone: p.phone || '',
      department: 'مرضى',
      icon: '👤',
      opt_out: p.whatsapp_opt_out,
    }));

    const doctorContacts = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone || '',
      department: 'أطباء',
      icon: '👨‍⚕️',
    }));

    return [...doctorContacts, ...patientContacts];
  }

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    return this.templatesRepo.find({
      where: { is_active: true },
      order: { created_at: 'ASC' },
    });
  }

  async updateTemplate(
    id: string,
    dto: Partial<WhatsAppTemplate>,
  ): Promise<WhatsAppTemplate> {
    const row = await this.templatesRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Template not found');
    Object.assign(row, {
      name_ar: dto.name_ar ?? row.name_ar,
      name_en: dto.name_en ?? row.name_en,
      provider_template_name:
        dto.provider_template_name ?? row.provider_template_name,
      message_ar: dto.message_ar ?? row.message_ar,
      message_en: dto.message_en ?? row.message_en,
      variables: dto.variables ?? row.variables,
      approval_status: dto.approval_status ?? row.approval_status,
      is_active: dto.is_active ?? row.is_active,
    });
    return this.templatesRepo.save(row);
  }

  async getFlows(): Promise<WhatsAppFlow[]> {
    return this.flowsRepo.find({ order: { created_at: 'ASC' } });
  }

  async updateFlow(id: string, dto: Partial<WhatsAppFlow>): Promise<WhatsAppFlow> {
    const row = await this.flowsRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Flow not found');
    Object.assign(row, {
      name_ar: dto.name_ar ?? row.name_ar,
      name_en: dto.name_en ?? row.name_en,
      message: dto.message ?? row.message,
      delay: dto.delay ?? row.delay,
      delay_unit: dto.delay_unit ?? row.delay_unit,
      enabled: dto.enabled ?? row.enabled,
    });
    return this.flowsRepo.save(row);
  }

  async getHistory(): Promise<WhatsAppLog[]> {
    return this.whatsappLogsRepo.find({
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async sendMessage(dto: {
    phone: string;
    message: string;
    templateId?: string;
  }): Promise<WhatsAppLog> {
    const patient = await this.patientsRepo.findOne({ where: { phone: dto.phone } });
    if (patient?.whatsapp_opt_out) {
      throw new ForbiddenException({
        message: {
          ar: 'المريض اختار عدم استقبال رسائل واتساب',
          en: 'Patient has opted out of WhatsApp messages',
        },
      });
    }

    const result = await this.provider.send({
      to: dto.phone,
      body: dto.message,
      templateName: dto.templateId,
    });

    const status =
      result.status === 'MOCK'
        ? WhatsAppMessageStatus.MOCK
        : result.status === 'SENT'
          ? WhatsAppMessageStatus.SENT
          : result.status === 'QUEUED'
            ? WhatsAppMessageStatus.QUEUED
            : WhatsAppMessageStatus.FAILED;

    const log = this.whatsappLogsRepo.create({
      phone_number: dto.phone,
      message_body: dto.message,
      template_name: dto.templateId || 'Direct Message',
      status,
      sent_at: status === WhatsAppMessageStatus.FAILED ? undefined : new Date(),
      patient_id: patient ? patient.id : undefined,
      provider_message_id: result.providerMessageId ?? undefined,
      error_message: result.errorMessage,
      attempt_count: 1,
    });

    return this.whatsappLogsRepo.save(log);
  }

  async scheduleMessage(dto: {
    phone: string;
    message: string;
    templateId?: string;
    scheduledTime: string;
  }): Promise<WhatsAppLog> {
    const when = new Date(dto.scheduledTime);
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException('scheduledTime must be an ISO datetime');
    }

    const patient = await this.patientsRepo.findOne({ where: { phone: dto.phone } });
    if (patient?.whatsapp_opt_out) {
      throw new ForbiddenException({
        message: {
          ar: 'المريض اختار عدم استقبال رسائل واتساب',
          en: 'Patient has opted out of WhatsApp messages',
        },
      });
    }

    const log = this.whatsappLogsRepo.create({
      phone_number: dto.phone,
      message_body: dto.message,
      template_name: dto.templateId || 'Scheduled Message',
      status: WhatsAppMessageStatus.PENDING,
      patient_id: patient ? patient.id : undefined,
      scheduled_for: when,
    });

    return this.whatsappLogsRepo.save(log);
  }

  /** Used by T-008 dispatcher. Returns how many messages were attempted. */
  async dispatchDueMessages(limit = 50): Promise<number> {
    const due = await this.whatsappLogsRepo.find({
      where: {
        status: WhatsAppMessageStatus.PENDING,
        scheduled_for: LessThanOrEqual(new Date()),
      },
      take: limit,
      order: { scheduled_for: 'ASC' },
    });

    let attempted = 0;
    for (const row of due) {
      attempted += 1;
      if (row.patient_id) {
        const patient = await this.patientsRepo.findOne({
          where: { id: row.patient_id },
        });
        if (patient?.whatsapp_opt_out) {
          row.status = WhatsAppMessageStatus.FAILED;
          row.error_message = 'Patient opted out';
          await this.whatsappLogsRepo.save(row);
          continue;
        }
      }

      const result = await this.provider.send({
        to: row.phone_number,
        body: row.message_body || '',
        templateName: row.template_name,
      });

      row.attempt_count = (row.attempt_count || 0) + 1;
      row.provider_message_id = result.providerMessageId ?? row.provider_message_id;
      if (result.status === 'MOCK') {
        row.status = WhatsAppMessageStatus.MOCK;
        row.sent_at = new Date();
        row.error_message = null as unknown as string;
      } else if (result.status === 'SENT' || result.status === 'QUEUED') {
        row.status =
          result.status === 'SENT'
            ? WhatsAppMessageStatus.SENT
            : WhatsAppMessageStatus.QUEUED;
        row.sent_at = new Date();
        row.error_message = null as unknown as string;
      } else {
        row.status = WhatsAppMessageStatus.FAILED;
        row.error_message = result.errorMessage || 'send failed';
      }
      await this.whatsappLogsRepo.save(row);
    }
    return attempted;
  }

  async applyWebhookStatus(args: {
    providerMessageId: string;
    status: 'DELIVERED' | 'READ' | 'FAILED';
    errorMessage?: string;
  }): Promise<WhatsAppLog | null> {
    const row = await this.whatsappLogsRepo.findOne({
      where: { provider_message_id: args.providerMessageId },
    });
    if (!row) return null;

    if (args.status === 'DELIVERED') row.status = WhatsAppMessageStatus.DELIVERED;
    if (args.status === 'READ') row.status = WhatsAppMessageStatus.READ;
    if (args.status === 'FAILED') {
      row.status = WhatsAppMessageStatus.FAILED;
      row.error_message = args.errorMessage ?? '';
    }
    return this.whatsappLogsRepo.save(row);
  }
}
