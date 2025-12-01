import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

@Module({
  controllers: [GamificationController],
  providers: [
    GamificationService,
    CacheService,
    AuditService,
  ],
  exports: [GamificationService],
})
export class GamificationModule {}
