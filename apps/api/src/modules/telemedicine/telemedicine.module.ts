import { Module } from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service';
import { TelemedicineController } from './telemedicine.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [TelemedicineController],
  providers: [
    TelemedicineService,
    CacheService,
    AuditService,
  ],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
