import { Module } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { LaboratoryController } from './laboratory.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [LaboratoryController],
  providers: [
    LaboratoryService,
    CacheService,
    AuditService,
  ],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
