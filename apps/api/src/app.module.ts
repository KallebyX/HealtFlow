import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

// Database
import { PrismaModule } from './database/prisma.module';

// Common
// import { CacheModule } from './common/cache/cache.module';
// import { AuditModule } from './common/audit/audit.module';

// Feature Modules (will be uncommented as implemented)
// import { AuthModule } from './modules/auth/auth.module';
// import { PatientsModule } from './modules/patients/patients.module';
// import { DoctorsModule } from './modules/doctors/doctors.module';
// import { ClinicsModule } from './modules/clinics/clinics.module';
// import { AppointmentsModule } from './modules/appointments/appointments.module';
// import { ConsultationsModule } from './modules/consultations/consultations.module';
// import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
// import { LaboratoryModule } from './modules/laboratory/laboratory.module';
// import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';
// import { GamificationModule } from './modules/gamification/gamification.module';
// import { BillingModule } from './modules/billing/billing.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';

// Integration Modules
// import { FhirModule } from './modules/integrations/fhir/fhir.module';
// import { RndsModule } from './modules/integrations/rnds/rnds.module';
// import { StorageModule } from './modules/integrations/storage/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('THROTTLE_TTL', 60) * 1000,
            limit: configService.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // Queue (Bull)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
    }),

    // Database
    PrismaModule,

    // Common modules (to be added)
    // CacheModule,
    // AuditModule,

    // Feature modules (to be added)
    // AuthModule,
    // PatientsModule,
    // DoctorsModule,
    // ClinicsModule,
    // AppointmentsModule,
    // ConsultationsModule,
    // PrescriptionsModule,
    // LaboratoryModule,
    // TelemedicineModule,
    // GamificationModule,
    // BillingModule,
    // NotificationsModule,
    // AnalyticsModule,

    // Integration modules (to be added)
    // FhirModule,
    // RndsModule,
    // StorageModule,
  ],
})
export class AppModule {}
