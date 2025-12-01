import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodType, MaritalStatus, UserStatus, TriageLevel } from '@prisma/client';

export class UserInfoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  twoFactorEnabled: boolean;
}

export class ClinicInfoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tradeName: string;

  @ApiPropertyOptional()
  logoUrl?: string;
}

export class BadgeInfoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  iconUrl: string;

  @ApiProperty()
  earnedAt: Date;
}

export class VitalSignSummaryDto {
  @ApiPropertyOptional()
  systolicBp?: number;

  @ApiPropertyOptional()
  diastolicBp?: number;

  @ApiPropertyOptional()
  heartRate?: number;

  @ApiPropertyOptional()
  temperature?: number;

  @ApiPropertyOptional()
  oxygenSaturation?: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional({ enum: TriageLevel })
  triageLevel?: TriageLevel;

  @ApiProperty()
  measuredAt: Date;
}

export class PatientCountsDto {
  @ApiProperty()
  appointments: number;

  @ApiProperty()
  consultations: number;

  @ApiProperty()
  prescriptions: number;

  @ApiProperty()
  tasks: number;

  @ApiProperty()
  documents: number;
}

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  // Personal Info
  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  socialName?: string;

  @ApiProperty()
  cpf: string;

  @ApiPropertyOptional()
  rg?: string;

  @ApiPropertyOptional()
  rgIssuer?: string;

  @ApiProperty()
  birthDate: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiPropertyOptional({ enum: MaritalStatus })
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional()
  nationality?: string;

  @ApiPropertyOptional()
  birthPlace?: string;

  @ApiPropertyOptional()
  motherName?: string;

  @ApiPropertyOptional()
  fatherName?: string;

  @ApiPropertyOptional()
  occupation?: string;

  // Contact
  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  secondaryPhone?: string;

  @ApiPropertyOptional()
  email?: string;

  // Address
  @ApiPropertyOptional()
  address?: any;

  // Healthcare
  @ApiPropertyOptional()
  cns?: string;

  @ApiPropertyOptional({ enum: BloodType })
  bloodType?: BloodType;

  @ApiPropertyOptional()
  allergies?: string[];

  @ApiPropertyOptional()
  chronicConditions?: string[];

  @ApiPropertyOptional()
  currentMedications?: any[];

  @ApiPropertyOptional()
  familyHistory?: any[];

  @ApiPropertyOptional()
  surgicalHistory?: any[];

  // Health Insurance
  @ApiPropertyOptional()
  healthInsuranceId?: string;

  @ApiPropertyOptional()
  insuranceNumber?: string;

  @ApiPropertyOptional()
  insuranceValidUntil?: Date;

  // Biometrics
  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  weight?: number;

  // Lifestyle
  @ApiPropertyOptional()
  smokingStatus?: string;

  @ApiPropertyOptional()
  alcoholConsumption?: string;

  @ApiPropertyOptional()
  physicalActivity?: string;

  // Emergency Contact
  @ApiPropertyOptional()
  emergencyContact?: any;

  // Avatar
  @ApiPropertyOptional()
  avatarConfig?: any;

  // Gamification
  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelName: string;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  longestStreak: number;

  @ApiPropertyOptional()
  lastActivityDate?: Date;

  // Preferences
  @ApiProperty()
  preferredLanguage: string;

  @ApiProperty()
  preferredTimezone: string;

  // Timestamps
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  // Relations
  @ApiPropertyOptional({ type: UserInfoResponseDto })
  user?: UserInfoResponseDto;

  @ApiPropertyOptional({ type: [VitalSignSummaryDto] })
  vitalSigns?: VitalSignSummaryDto[];

  @ApiPropertyOptional({ type: [BadgeInfoResponseDto] })
  badges?: BadgeInfoResponseDto[];

  @ApiPropertyOptional({ type: [ClinicInfoResponseDto] })
  clinics?: ClinicInfoResponseDto[];

  @ApiPropertyOptional({ type: PatientCountsDto })
  _count?: PatientCountsDto;
}

export class PatientListResponseDto {
  @ApiProperty({ type: [PatientResponseDto] })
  data: PatientResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PatientDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AvatarConfigResponseDto {
  @ApiProperty()
  bodyType: string;

  @ApiProperty()
  height: number;

  @ApiProperty()
  weight: number;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiPropertyOptional()
  skinTone?: string;

  @ApiPropertyOptional()
  hairColor?: string;

  @ApiPropertyOptional()
  hairStyle?: string;

  @ApiPropertyOptional()
  eyeColor?: string;

  @ApiPropertyOptional()
  accessories?: string[];

  @ApiProperty()
  indicators: {
    hasAbnormalVitals: boolean;
    triageLevel?: TriageLevel;
  };

  @ApiPropertyOptional()
  evolution?: {
    date: Date;
    weight: number;
  }[];
}

export class WearableConnectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  active: boolean;

  @ApiPropertyOptional()
  lastSyncAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
