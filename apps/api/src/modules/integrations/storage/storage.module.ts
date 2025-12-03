import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AuditService } from '../../../common/services/audit.service';
import * as multer from 'multer';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: configService.get<number>('STORAGE_MAX_FILE_SIZE', 100 * 1024 * 1024), // 100MB default
          files: 10,
        },
        fileFilter: (req: any, file: any, cb: any) => {
          // Allow all file types by default - validation happens in service
          cb(null, true);
        },
      }),
    }),
  ],
  controllers: [StorageController],
  providers: [
    StorageService,
    PrismaService,
    CacheService,
    AuditService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
