import { UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse extends TokenPayload {
  user: UserInfo;
  message?: string;
  requires2FA?: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  patient?: PatientInfo;
  doctor?: DoctorInfo;
  employee?: EmployeeInfo;
}

export interface PatientInfo {
  id: string;
  fullName: string;
  socialName?: string;
  avatarUrl?: string;
  level?: number;
  levelName?: string;
  totalPoints?: number;
}

export interface DoctorInfo {
  id: string;
  fullName: string;
  crm: string;
  crmState: string;
  specialties?: string[];
  profilePhotoUrl?: string;
  telemedicineEnabled?: boolean;
}

export interface EmployeeInfo {
  id: string;
  fullName: string;
  position: string;
  department?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  message: string;
  backupCodes?: string[];
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  patient?: {
    id: string;
    fullName: string;
  };
  doctor?: {
    id: string;
    fullName: string;
    crm: string;
    crmState: string;
  };
  employee?: {
    id: string;
    fullName: string;
    position: string;
  };
}

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  reason?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: DeviceInfo;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface DeviceInfo {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  deviceType?: string;
  isMobile?: boolean;
}

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  performedBy?: string;
  description?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface RateLimitConfig {
  ttl: number;
  limit: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  maxAge?: number;
  preventReuse?: number;
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  name: string;
  verificationToken: string;
  type: 'patient' | 'doctor' | 'employee';
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
  resetToken: string;
}
