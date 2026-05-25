import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUpTask, FollowUpStatus } from './follow-up.entity';
import { WhatsAppLog, WhatsAppMessageStatus } from './whatsapp-log.entity';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto/follow-up.dto';

@Injectable()
export class FollowUpsService {
  constructor(
    @InjectRepository(FollowUpTask)
    private followUpsRepo: Repository<FollowUpTask>,
    @InjectRepository(WhatsAppLog)
    private whatsappLogsRepo: Repository<WhatsAppLog>,
  ) {}

  async create(dto: CreateFollowUpDto): Promise<FollowUpTask> {
    const task = this.followUpsRepo.create(dto);
    const savedTask = await this.followUpsRepo.save(task);

    // Save WhatsApp Log stub
    const log = this.whatsappLogsRepo.create({
      patient_id: dto.patient_id,
      followup_task_id: savedTask.id,
      phone_number: '+1234567890', // placeholder phone number
      message_body: dto.message || `Missed session follow-up of type ${dto.type}`,
      status: WhatsAppMessageStatus.SENT,
      sent_at: new Date(),
    });
    await this.whatsappLogsRepo.save(log);

    console.log(
      `📱 [WhatsApp Stub] Follow-up task created & logged for patient ${dto.patient_id}: ${dto.type}`,
    );

    return savedTask;
  }

  async findAll(status?: FollowUpStatus): Promise<FollowUpTask[]> {
    const where = status ? { status } : {};
    return this.followUpsRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findPending(): Promise<FollowUpTask[]> {
    return this.followUpsRepo.find({
      where: { status: FollowUpStatus.PENDING },
      order: { created_at: 'ASC' },
    });
  }

  async findByPatient(patientId: string): Promise<FollowUpTask[]> {
    return this.followUpsRepo.find({
      where: { patient_id: patientId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FollowUpTask> {
    const task = await this.followUpsRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Follow-up task not found');
    return task;
  }

  async update(id: string, dto: UpdateFollowUpDto): Promise<FollowUpTask> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.followUpsRepo.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.followUpsRepo.remove(task);
  }

  async getWhatsAppLogs(patientId: string): Promise<WhatsAppLog[]> {
    return this.whatsappLogsRepo.find({
      where: { patient_id: patientId },
      order: { created_at: 'DESC' },
    });
  }
}
