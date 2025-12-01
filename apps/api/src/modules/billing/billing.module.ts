import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    CacheService,
    AuditService,
  ],
  exports: [BillingService],
})
export class BillingModule {}
