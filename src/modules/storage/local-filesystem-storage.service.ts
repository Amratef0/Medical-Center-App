import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  CreateUploadUrlInput,
  CreateUploadUrlResult,
  SignedDownloadUrlResult,
  StorageService,
} from './storage.interface';
import { DOWNLOAD_URL_TTL_SECONDS, UPLOAD_URL_TTL_SECONDS } from './storage.constants';

@Injectable()
export class LocalFilesystemStorageService implements StorageService {
  private readonly rootDir: string;
  private readonly signingSecret: string;
  private readonly apiPrefix = '/api/v1';

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('STORAGE_LOCAL_DIR') || 'uploads';
    this.rootDir = path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
    this.signingSecret =
      this.config.get<string>('STORAGE_DOWNLOAD_SECRET') ||
      this.config.get<string>('JWT_ACCESS_SECRET') ||
      'local-dev-storage-secret';
  }

  resolveAbsolutePath(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.join(this.rootDir, normalized);
    if (!absolute.startsWith(this.rootDir)) {
      throw new Error('Invalid storage key');
    }
    return absolute;
  }

  async createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult> {
    const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000).toISOString();
    return {
      storageKey: input.storageKey,
      uploadUrl: `${this.apiPrefix}/attachments/local-upload`,
      uploadMethod: 'PUT',
      headers: {
        'X-Storage-Key': input.storageKey,
        'Content-Type': input.mimeType,
      },
      expiresAt,
    };
  }

  async putObject(storageKey: string, body: Buffer, _mimeType: string): Promise<void> {
    const target = this.resolveAbsolutePath(storageKey);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
  }

  async objectExists(storageKey: string): Promise<boolean> {
    try {
      await fs.access(this.resolveAbsolutePath(storageKey));
      return true;
    } catch {
      return false;
    }
  }

  async readObject(storageKey: string): Promise<{ buffer: Buffer; mimeType?: string }> {
    const buffer = await fs.readFile(this.resolveAbsolutePath(storageKey));
    return { buffer };
  }

  async getSignedDownloadUrl(
    storageKey: string,
    options?: { attachmentId?: string; ttlSeconds?: number },
  ): Promise<SignedDownloadUrlResult> {
    const ttl = options?.ttlSeconds ?? DOWNLOAD_URL_TTL_SECONDS;
    const expires = Math.floor(Date.now() / 1000) + ttl;
    const attachmentId = options?.attachmentId ?? storageKey;
    const sig = this.signDownload(attachmentId, expires);
    const downloadUrl = `${this.apiPrefix}/attachments/${attachmentId}/file?expires=${expires}&sig=${sig}`;
    return {
      downloadUrl,
      expiresAt: new Date(expires * 1000).toISOString(),
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.resolveAbsolutePath(storageKey));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  verifyDownloadSignature(attachmentId: string, expires: number, sig: string): boolean {
    if (expires * 1000 < Date.now()) {
      return false;
    }
    const expected = this.signDownload(attachmentId, expires);
    try {
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(sig, 'utf8');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  private signDownload(attachmentId: string, expires: number): string {
    return createHmac('sha256', this.signingSecret)
      .update(`${attachmentId}:${expires}`)
      .digest('hex');
  }
}
