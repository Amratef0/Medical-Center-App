export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIMES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

export type AllowedAttachmentMime = (typeof ALLOWED_ATTACHMENT_MIMES)[number];

export const DOWNLOAD_URL_TTL_SECONDS = 300;

export const UPLOAD_URL_TTL_SECONDS = 900;
