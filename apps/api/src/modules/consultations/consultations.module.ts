import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [ConsultationsController],
  providers: [
    ConsultationsService,
    CacheService,
    AuditService,
  ],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
