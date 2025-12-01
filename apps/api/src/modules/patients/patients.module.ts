import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, CacheService, AuditService],
  exports: [PatientsService],
})
export class PatientsModule {}
