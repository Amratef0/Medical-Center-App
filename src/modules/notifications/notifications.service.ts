import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

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

  // Quick helper triggers for system events (Phase 14)
  async notifyPackageEndingSoon(patientName: string, remaining: number, refId?: string): Promise<void> {
    await this.create({
      type: NotificationType.PACKAGE_ENDING_SOON,
      title: 'تنبيه باقة على وشك الانتهاء',
      message: `باقة المريض (${patientName}) متبقي بها ${remaining} جلسات فقط. يُنصح بتجهيز الفاتورة للتجديد لتفادي انقطاع العلاج.`,
      target_role: 'RECEPTIONIST',
      reference_id: refId,
    });
  }

  async notifyCapacityReached(doctorName: string, refId?: string): Promise<void> {
    await this.create({
      type: NotificationType.CAPACITY_LIMIT_REACHED,
      title: 'تنبيه السعة القصوى للطبيب',
      message: `الطبيب ${doctorName} وصل للحد الأقصى اليوم. يتم تحويل المواعيد الجديدة تلقائياً.`,
      target_role: 'ALL',
      reference_id: refId,
    });
  }

  async notifyPaymentVerified(patientName: string, refId?: string): Promise<void> {
    await this.create({
      type: NotificationType.PAYMENT_VERIFIED,
      title: 'التحقق المالي لجلسة التقييم',
      message: `دفعة التقييم للمريض (${patientName}) تم اعتمادها بنجاح من قسم المالية ويمكن بدء الجلسة.`,
      target_role: 'ALL',
      reference_id: refId,
    });
  }
}
