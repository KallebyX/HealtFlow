import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    CacheService,
    AuditService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
