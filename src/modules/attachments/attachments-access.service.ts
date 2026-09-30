import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Patient } from '../patients/patient.entity';
import { Attachment, AttachmentOwnerType } from './attachment.entity';

const PATIENT_READ_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.OPERATIONS_MANAGER,
  UserRole.RECEPTIONIST,
  UserRole.DOCTOR,
];

const ATTACHMENT_WRITE_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.OPERATIONS_MANAGER,
  UserRole.RECEPTIONIST,
  UserRole.DOCTOR,
];

const ATTACHMENT_DELETE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OPERATIONS_MANAGER];

@Injectable()
export class AttachmentsAccessService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepo: Repository<Patient>,
  ) {}

  assertCanWrite(user: User): void {
    if (!ATTACHMENT_WRITE_ROLES.includes(user.role)) {
      throw new ForbiddenException({
        en: 'You do not have permission to upload attachments.',
        ar: 'ليس لديك صلاحية رفع المرفقات.',
      });
    }
  }

  assertCanDelete(user: User): void {
    if (!ATTACHMENT_DELETE_ROLES.includes(user.role)) {
      throw new ForbiddenException({
        en: 'Only administrators can delete attachments.',
        ar: 'حذف المرفقات متاح للمسؤولين فقط.',
      });
    }
  }

  async assertCanReadAttachment(user: User, attachment: Attachment): Promise<void> {
    if (attachment.owner_type === AttachmentOwnerType.PATIENT) {
      if (!PATIENT_READ_ROLES.includes(user.role)) {
        throw new ForbiddenException({
          en: 'You do not have permission to view this attachment.',
          ar: 'ليس لديك صلاحية عرض هذا المرفق.',
        });
      }
      await this.assertPatientExists(attachment.owner_id);
      return;
    }

    if (!ATTACHMENT_WRITE_ROLES.includes(user.role)) {
      throw new ForbiddenException({
        en: 'You do not have permission to view this attachment.',
        ar: 'ليس لديك صلاحية عرض هذا المرفق.',
      });
    }
  }

  async assertOwnerExists(ownerType: AttachmentOwnerType, ownerId: string): Promise<void> {
    if (ownerType === AttachmentOwnerType.PATIENT) {
      await this.assertPatientExists(ownerId);
    }
  }

  private async assertPatientExists(patientId: string): Promise<void> {
    const exists = await this.patientsRepo.exist({ where: { id: patientId } });
    if (!exists) {
      throw new NotFoundException({
        en: 'Patient not found.',
        ar: 'المريض غير موجود.',
      });
    }
  }
}
