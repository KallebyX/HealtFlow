import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    CacheService,
    AuditService,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
