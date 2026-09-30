import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async emit(dto: CreateNotificationDto): Promise<void> {
    try {
      if (dto.type && dto.reference_id && await this.hasRecentUnread(dto.type, dto.reference_id, dto.target_role)) {
        return;
      }
      await this.create(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Notification was not stored: ${message}`);
    }
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepo.create(dto);
    return this.notificationsRepo.save(notification);
  }

  async findAll(role?: string): Promise<Notification[]> {
    const qb = this.notificationsRepo
      .createQueryBuilder('notif')
      .orderBy('notif.created_at', 'DESC')
      .limit(30);

    if (role && role !== 'ADMIN' && role !== 'OPERATIONS_MANAGER') {
      qb.where('notif.target_role = :role OR notif.target_role = :all', {
        role,
        all: 'ALL',
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Notification> {
    const notif = await this.notificationsRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    const notif = await this.findOne(id);
    Object.assign(notif, dto);
    return this.notificationsRepo.save(notif);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notif = await this.findOne(id);
    notif.is_read = true;
    return this.notificationsRepo.save(notif);
  }

  async markAllAsRead(role?: string): Promise<void> {
    const qb = this.notificationsRepo.createQueryBuilder()
      .update(Notification)
      .set({ is_read: true })
      .where('is_read = false');

    if (role && role !== 'ADMIN' && role !== 'OPERATIONS_MANAGER') {
      qb.andWhere('(target_role = :role OR target_role = :all)', { role, all: 'ALL' });
    }

    await qb.execute();
  }

  async remove(id: string): Promise<void> {
    const notif = await this.findOne(id);
    await this.notificationsRepo.remove(notif);
  }

  async notifyPackageEndingSoon(patientName: string, remaining: number, refId?: string): Promise<void> {
    const message = `باقة المريض (${patientName}) متبقي بها ${remaining} جلسات فقط. يُنصح بتجهيز الفاتورة للتجديد لتفادي انقطاع العلاج.`;
    await this.emitToRoles(NotificationType.PACKAGE_ENDING_SOON, 'تنبيه باقة على وشك الانتهاء', message, ['RECEPTIONIST', 'FINANCE'], refId);
  }

  async notifyCapacityReached(doctorName: string, refId?: string): Promise<void> {
    await this.emit({
      type: NotificationType.CAPACITY_LIMIT_REACHED,
      title: 'تنبيه السعة القصوى للطبيب',
      message: `الطبيب ${doctorName} وصل للحد الأقصى اليوم. يتم تحويل المواعيد الجديدة تلقائياً.`,
      target_role: 'ALL',
      reference_id: refId,
    });
  }

  async notifyPaymentVerified(patientName: string, refId?: string): Promise<void> {
    const message = `دفعة التقييم للمريض (${patientName}) تم اعتمادها بنجاح من قسم المالية ويمكن بدء الجلسة.`;
    await this.emitToRoles(NotificationType.PAYMENT_VERIFIED, 'التحقق المالي لجلسة التقييم', message, ['RECEPTIONIST', 'DOCTOR'], refId);
  }

  async notifyAssessmentEndedEarlier(sessionId: string, actualMinutes: number, scheduledMinutes: number): Promise<void> {
    await this.emit({
      type: NotificationType.ASSESSMENT_ENDED_EARLIER,
      title: 'جلسة تقييم انتهت مبكراً',
      message: `جلسة التقييم ${sessionId} انتهت بعد ${actualMinutes} دقيقة من أصل ${scheduledMinutes}.`,
      target_role: 'OPERATIONS_MANAGER',
      reference_id: sessionId,
    });
  }

  async notifyAttendanceRecorded(sessionId: string): Promise<void> {
    await this.emit({
      type: NotificationType.ATTENDANCE_RECORDED,
      title: 'تم تسجيل الحضور',
      message: `تم تسجيل حضور الجلسة ${sessionId}.`,
      target_role: 'RECEPTIONIST',
      reference_id: sessionId,
    });
  }

  async notifyMissedAppointment(sessionId: string): Promise<void> {
    await this.emit({
      type: NotificationType.MISSED_APPOINTMENT,
      title: 'موعد لم يُحضر',
      message: `سُجّل غياب للجلسة ${sessionId}.`,
      target_role: 'RECEPTIONIST',
      reference_id: sessionId,
    });
  }

  private async emitToRoles(
    type: NotificationType,
    title: string,
    message: string,
    roles: string[],
    referenceId?: string,
  ): Promise<void> {
    for (const target_role of roles) {
      await this.emit({ type, title, message, target_role, reference_id: referenceId });
    }
  }

  private async hasRecentUnread(type: NotificationType, referenceId: string, targetRole?: string): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const qb = this.notificationsRepo.createQueryBuilder('notif')
      .where('notif.type = :type', { type })
      .andWhere('notif.reference_id = :referenceId', { referenceId })
      .andWhere('notif.is_read = false')
      .andWhere('notif.created_at >= :since', { since });
    if (targetRole) qb.andWhere('notif.target_role = :targetRole', { targetRole });
    return (await qb.getCount()) > 0;
  }
}
