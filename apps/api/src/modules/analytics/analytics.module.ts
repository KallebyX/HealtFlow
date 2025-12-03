import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { AuditService } from '../../common/services/audit.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    PrismaService,
    CacheService,
    AuditService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
