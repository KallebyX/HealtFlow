import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { RndsController } from './rnds.controller';
import { RndsService } from './rnds.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AuditService } from '../../../common/services/audit.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/fhir+json',
      },
    }),
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'rnds-sync',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
  ],
  controllers: [RndsController],
  providers: [
    RndsService,
    PrismaService,
    CacheService,
    AuditService,
  ],
  exports: [RndsService],
})
export class RndsModule {}
