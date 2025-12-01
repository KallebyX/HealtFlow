import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, CacheService, AuditService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
