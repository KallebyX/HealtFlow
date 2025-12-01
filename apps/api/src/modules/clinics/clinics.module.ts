import { Module } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [ClinicsController],
  providers: [
    ClinicsService,
    CacheService,
    AuditService,
  ],
  exports: [ClinicsService],
})
export class ClinicsModule {}
