export interface CreateUploadUrlInput {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreateUploadUrlResult {
  storageKey: string;
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  headers?: Record<string, string>;
  expiresAt: string;
}

export interface SignedDownloadUrlResult {
  downloadUrl: string;
  expiresAt: string;
}

export interface StorageService {
  createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult>;

  putObject(storageKey: string, body: Buffer, mimeType: string): Promise<void>;

  objectExists(storageKey: string): Promise<boolean>;

  readObject(storageKey: string): Promise<{ buffer: Buffer; mimeType?: string }>;

  getSignedDownloadUrl(
    storageKey: string,
    options?: { attachmentId?: string; ttlSeconds?: number },
  ): Promise<SignedDownloadUrlResult>;

  deleteObject(storageKey: string): Promise<void>;

  resolveAbsolutePath(storageKey: string): string;
}
