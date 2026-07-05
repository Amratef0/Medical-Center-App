import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppLog, WhatsAppMessageStatus } from '../follow-ups/whatsapp-log.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';

@Injectable()
export class WhatsappService {
  constructor(
    @InjectRepository(WhatsAppLog)
    private whatsappLogsRepo: Repository<WhatsAppLog>,
    @InjectRepository(Patient)
    private patientsRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorsRepo: Repository<Doctor>,
  ) {}

  async getContacts(): Promise<any[]> {
    const patients = await this.patientsRepo.find({ select: ['id', 'first_name', 'last_name', 'phone'] });
    const doctors = await this.doctorsRepo.find({ select: ['id', 'name', 'phone'] });

    const patientContacts = patients.map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      phone: p.phone || '',
      department: 'مرضى',
      icon: '👤',
    }));

    const doctorContacts = doctors.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone || '',
      department: 'أطباء',
      icon: '👨‍⚕️',
    }));

    const staticContacts = [
      { id: 'reception', name: 'موظف الاستقبال', phone: '0504444444', department: 'استقبال', icon: '📞' }
    ];

    return [...staticContacts, ...doctorContacts, ...patientContacts];
  }

  async getTemplates(): Promise<any[]> {
    return [
      { id: '1', nameAr: 'تذكير بموعد', nameEn: 'Appointment Reminder', icon: '📅', messageAr: 'تذكير بموعدك مع د. {doctor} يوم {date} الساعة {time}', messageEn: 'Reminder for your appointment with Dr. {doctor} on {date} at {time}' },
      { id: '2', nameAr: 'تأكيد موعد', nameEn: 'Appointment Confirmation', icon: '✅', messageAr: 'تم تأكيد موعدك مع د. {doctor} يوم {date} الساعة {time}', messageEn: 'Your appointment with Dr. {doctor} on {date} at {time} has been confirmed' },
      { id: '3', nameAr: 'استفسار', nameEn: 'Inquiry', icon: '❓', messageAr: 'استفسار بخصوص {topic}', messageEn: 'Inquiry regarding {topic}' },
      { id: '4', nameAr: 'تأكيد دفع', nameEn: 'Payment Confirmation', icon: '💰', messageAr: 'تم تأكيد دفع مبلغ {amount} عن الفاتورة {invoice}', messageEn: 'Payment of {amount} for invoice {invoice} has been confirmed' }
    ];
  }

  async getFlows(): Promise<any[]> {
    return [
      { id: '1', nameAr: 'تذكير بالموعد', nameEn: 'Appointment Reminder', message: 'تذكير بموعدك مع د. {doctor} يوم {date} الساعة {time}', delay: 24, delayUnit: 'hours', enabled: true },
      { id: '2', nameAr: 'متابعة ما بعد الموعد', nameEn: 'Post-Appointment Follow-up', message: 'كيف كانت تجربتك مع د. {doctor}؟', delay: 2, delayUnit: 'days', enabled: true },
      { id: '3', nameAr: 'تأكيد الحضور', nameEn: 'Attendance Confirmation', message: 'يرجى تأكيد حضورك للموعد مع د. {doctor} يوم {date}', delay: 48, delayUnit: 'hours', enabled: false }
    ];
  }

  async getHistory(): Promise<WhatsAppLog[]> {
    return this.whatsappLogsRepo.find({
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async sendMessage(dto: { phone: string; message: string; templateId?: string }): Promise<WhatsAppLog> {
    // Try to find if phone belongs to a patient
    const patient = await this.patientsRepo.findOne({
      where: { phone: dto.phone }
    });

    const log = this.whatsappLogsRepo.create({
      phone_number: dto.phone,
      message_body: dto.message,
      template_name: dto.templateId || 'Direct Message',
      status: WhatsAppMessageStatus.SENT,
      sent_at: new Date(),
      patient_id: patient ? patient.id : undefined,
    });

    console.log(`📱 [WhatsApp API Sim] Sent to ${dto.phone}: ${dto.message}`);
    return this.whatsappLogsRepo.save(log);
  }

  async scheduleMessage(dto: { phone: string; message: string; templateId?: string; scheduledTime: string }): Promise<WhatsAppLog> {
    const patient = await this.patientsRepo.findOne({
      where: { phone: dto.phone }
    });

    const log = this.whatsappLogsRepo.create({
      phone_number: dto.phone,
      message_body: dto.message,
      template_name: dto.templateId || 'Scheduled Message',
      status: WhatsAppMessageStatus.PENDING,
      patient_id: patient ? patient.id : undefined,
      error_message: `Scheduled for: ${dto.scheduledTime}`,
    });

    return this.whatsappLogsRepo.save(log);
  }
}
