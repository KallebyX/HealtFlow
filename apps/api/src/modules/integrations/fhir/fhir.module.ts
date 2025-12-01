import { Module } from '@nestjs/common';
import { FhirController } from './fhir.controller';
import { FhirService } from './fhir.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AuditService } from '../../../common/services/audit.service';

@Module({
  controllers: [FhirController],
  providers: [
    FhirService,
    PrismaService,
    CacheService,
    AuditService,
  ],
  exports: [FhirService],
})
export class FhirModule {}
