import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE } from './storage.constants';
import { LocalFilesystemStorageService } from './local-filesystem-storage.service';
import { S3StorageService } from './s3-storage.service';
import { StorageService } from './storage.interface';

@Global()
@Module({
  providers: [
    LocalFilesystemStorageService,
    S3StorageService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (
        config: ConfigService,
        local: LocalFilesystemStorageService,
        s3: S3StorageService,
      ): StorageService => {
        const driver = (config.get<string>('STORAGE_DRIVER') || 'local').toLowerCase();
        return driver === 's3' ? s3 : local;
      },
      inject: [ConfigService, LocalFilesystemStorageService, S3StorageService],
    },
  ],
  exports: [STORAGE_SERVICE, LocalFilesystemStorageService],
})
export class StorageModule {}
