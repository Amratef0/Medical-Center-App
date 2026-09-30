import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  ALLOWED_ATTACHMENT_MIMES,
  MAX_ATTACHMENT_BYTES,
  STORAGE_SERVICE,
} from '../storage/storage.constants';
import type { StorageService } from '../storage/storage.interface';
import { extensionForMime, sniffMime } from '../storage/mime-sniff.util';
import { LocalFilesystemStorageService } from '../storage/local-filesystem-storage.service';
import { Attachment } from './attachment.entity';
import { ConfirmAttachmentDto, PresignAttachmentDto } from './dto/attachment.dto';
import { AttachmentsAccessService } from './attachments-access.service';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepo: Repository<Attachment>,
    @Inject(STORAGE_SERVICE)
    private readonly storage: StorageService,
    private readonly access: AttachmentsAccessService,
    private readonly localStorage: LocalFilesystemStorageService,
  ) {}

  async presign(dto: PresignAttachmentDto, user: User) {
    this.access.assertCanWrite(user);
    this.validateDeclaredMime(dto.mime_type);
    if (dto.size_bytes > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException({
        en: `File exceeds maximum size of ${MAX_ATTACHMENT_BYTES} bytes.`,
        ar: 'حجم الملف يتجاوز الحد المسموح.',
      });
    }

    await this.access.assertOwnerExists(dto.owner_type, dto.owner_id);

    const ext = extensionForMime(dto.mime_type);
    const storageKey = `${dto.owner_type}/${dto.owner_id}/${randomUUID()}.${ext}`;

    const upload = await this.storage.createUploadUrl({
      storageKey,
      mimeType: dto.mime_type,
      sizeBytes: dto.size_bytes,
    });

    return upload;
  }

  async confirm(dto: ConfirmAttachmentDto, user: User) {
    this.access.assertCanWrite(user);
    this.validateDeclaredMime(dto.mime_type);
    await this.access.assertOwnerExists(dto.owner_type, dto.owner_id);

    const exists = await this.storage.objectExists(dto.storage_key);
    if (!exists) {
      throw new BadRequestException({
        en: 'Upload not found. Complete the upload before confirming.',
        ar: 'لم يتم العثور على الملف. أكمل الرفع قبل التأكيد.',
      });
    }

    const { buffer } = await this.storage.readObject(dto.storage_key);
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      await this.storage.deleteObject(dto.storage_key);
      throw new BadRequestException({
        en: 'Uploaded file exceeds the size cap.',
        ar: 'حجم الملف المرفوع يتجاوز الحد المسموح.',
      });
    }

    const sniffed = sniffMime(buffer);
    if (!sniffed || !ALLOWED_ATTACHMENT_MIMES.includes(sniffed as (typeof ALLOWED_ATTACHMENT_MIMES)[number])) {
      await this.storage.deleteObject(dto.storage_key);
      throw new BadRequestException({
        en: 'File content does not match an allowed type (JPEG, PNG, PDF).',
        ar: 'محتوى الملف لا يطابق الأنواع المسموحة (JPEG أو PNG أو PDF).',
      });
    }

    if (sniffed !== dto.mime_type) {
      await this.storage.deleteObject(dto.storage_key);
      throw new BadRequestException({
        en: 'Declared MIME type does not match file content.',
        ar: 'نوع الملف المعلن لا يطابق المحتوى الفعلي.',
      });
    }

    const attachment = this.attachmentsRepo.create({
      owner_type: dto.owner_type,
      owner_id: dto.owner_id,
      kind: dto.kind,
      storage_key: dto.storage_key,
      mime_type: sniffed,
      size_bytes: buffer.length,
      uploaded_by: user.id,
    });

    const saved = await this.attachmentsRepo.save(attachment);
    return { attachment: saved };
  }

  async getDownloadUrl(id: string, user: User) {
    const attachment = await this.findOneOrFail(id);
    await this.access.assertCanReadAttachment(user, attachment);

    const signed = await this.storage.getSignedDownloadUrl(attachment.storage_key, {
      attachmentId: attachment.id,
    });

    return {
      attachment_id: attachment.id,
      download_url: signed.downloadUrl,
      expires_at: signed.expiresAt,
      mime_type: attachment.mime_type,
    };
  }

  async streamFile(
    id: string,
    user: User | undefined,
    query: { expires?: string; sig?: string },
  ) {
    const attachment = await this.findOneOrFail(id);

    const expires = query.expires ? Number(query.expires) : NaN;
    const sigValid =
      query.sig &&
      !Number.isNaN(expires) &&
      this.localStorage.verifyDownloadSignature(id, expires, query.sig);

    if (!sigValid) {
      if (!user) {
        throw new ForbiddenException();
      }
      await this.access.assertCanReadAttachment(user, attachment);
    }

    const { buffer } = await this.storage.readObject(attachment.storage_key);
    return { buffer, mimeType: attachment.mime_type, fileName: pathBasename(attachment.storage_key) };
  }

  async remove(id: string, user: User) {
    this.access.assertCanDelete(user);
    const attachment = await this.findOneOrFail(id);
    await this.storage.deleteObject(attachment.storage_key);
    await this.attachmentsRepo.remove(attachment);
    return { success: true };
  }

  async saveLocalUpload(
    storageKey: string,
    body: Buffer,
    declaredMime: string | undefined,
    user: User,
  ) {
    this.access.assertCanWrite(user);
    if (!storageKey || storageKey.includes('..') || storageKey.startsWith('/')) {
      throw new BadRequestException({
        en: 'Invalid storage key.',
        ar: 'مفتاح التخزين غير صالح.',
      });
    }
    if (body.length > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException({
        en: 'Uploaded file exceeds the size cap.',
        ar: 'حجم الملف يتجاوز الحد المسموح.',
      });
    }

    const sniffed = sniffMime(body);
    if (!sniffed || !ALLOWED_ATTACHMENT_MIMES.includes(sniffed as (typeof ALLOWED_ATTACHMENT_MIMES)[number])) {
      throw new BadRequestException({
        en: 'File content does not match an allowed type (JPEG, PNG, PDF).',
        ar: 'محتوى الملف غير مسموح.',
      });
    }

    if (declaredMime && declaredMime !== sniffed) {
      throw new BadRequestException({
        en: 'Content-Type does not match file content.',
        ar: 'نوع المحتوى لا يطابق الملف.',
      });
    }

    await this.storage.putObject(storageKey, body, sniffed);
    return { storage_key: storageKey, mime_type: sniffed, size_bytes: body.length };
  }

  private validateDeclaredMime(mimeType: string): void {
    if (!ALLOWED_ATTACHMENT_MIMES.includes(mimeType as (typeof ALLOWED_ATTACHMENT_MIMES)[number])) {
      throw new BadRequestException({
        en: 'MIME type must be image/jpeg, image/png, or application/pdf.',
        ar: 'نوع الملف يجب أن يكون JPEG أو PNG أو PDF.',
      });
    }
  }

  private async findOneOrFail(id: string): Promise<Attachment> {
    const attachment = await this.attachmentsRepo.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException({
        en: 'Attachment not found.',
        ar: 'المرفق غير موجود.',
      });
    }
    return attachment;
  }
}

function pathBasename(storageKey: string): string {
  const parts = storageKey.split('/');
  return parts[parts.length - 1] || 'download';
}
