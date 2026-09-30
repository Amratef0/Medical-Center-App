import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateUploadUrlInput,
  CreateUploadUrlResult,
  SignedDownloadUrlResult,
  StorageService,
} from './storage.interface';

/**
 * Placeholder for Cloudflare R2 / S3-compatible storage.
 * Wire @aws-sdk/client-s3 when deploying with STORAGE_DRIVER=s3.
 */
@Injectable()
export class S3StorageService implements StorageService {
  constructor(private readonly config: ConfigService) {}

  private notConfigured(): never {
    const bucket = this.config.get<string>('S3_BUCKET');
    throw new ServiceUnavailableException({
      en: 'Object storage (S3/R2) is not fully configured in this build. Use STORAGE_DRIVER=local for development.',
      ar: 'تخزين الملفات السحابي غير مُعد بالكامل. استخدم STORAGE_DRIVER=local للتطوير المحلي.',
      hint: bucket ? 'S3_BUCKET is set but the S3 client stub is not implemented yet.' : 'Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.',
    });
  }

  createUploadUrl(_input: CreateUploadUrlInput): Promise<CreateUploadUrlResult> {
    this.notConfigured();
  }

  putObject(_storageKey: string, _body: Buffer, _mimeType: string): Promise<void> {
    this.notConfigured();
  }

  objectExists(_storageKey: string): Promise<boolean> {
    this.notConfigured();
  }

  readObject(_storageKey: string): Promise<{ buffer: Buffer; mimeType?: string }> {
    this.notConfigured();
  }

  getSignedDownloadUrl(
    _storageKey: string,
    _options?: { attachmentId?: string; ttlSeconds?: number },
  ): Promise<SignedDownloadUrlResult> {
    this.notConfigured();
  }

  deleteObject(_storageKey: string): Promise<void> {
    this.notConfigured();
  }

  resolveAbsolutePath(_storageKey: string): string {
    this.notConfigured();
  }
}
