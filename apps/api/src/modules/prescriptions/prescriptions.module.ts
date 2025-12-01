import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    CacheService,
    AuditService,
  ],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
