import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================
// STORAGE MODULE DTOs
// DTOs completos para gerenciamento de arquivos em cloud storage
// Suporta: AWS S3, Azure Blob Storage, Google Cloud Storage, Local
// ============================================================

// ==================== Enums ====================

export enum StorageProvider {
  AWS_S3 = 'AWS_S3',
  AZURE_BLOB = 'AZURE_BLOB',
  GOOGLE_CLOUD = 'GOOGLE_CLOUD',
  LOCAL = 'LOCAL',
  MINIO = 'MINIO',
}

export enum StorageAccessLevel {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED', // Requires authentication
  RESTRICTED = 'RESTRICTED', // Role-based access
}

export enum FileCategory {
  // Medical Documents
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  PRESCRIPTION = 'PRESCRIPTION',
  LAB_RESULT = 'LAB_RESULT',
  MEDICAL_IMAGE = 'MEDICAL_IMAGE',
  EXAM_REPORT = 'EXAM_REPORT',
  CLINICAL_SUMMARY = 'CLINICAL_SUMMARY',
  REFERRAL_LETTER = 'REFERRAL_LETTER',
  CONSENT_FORM = 'CONSENT_FORM',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',

  // Personal Documents
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  INSURANCE_CARD = 'INSURANCE_CARD',
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  SIGNATURE = 'SIGNATURE',

  // Administrative
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CONTRACT = 'CONTRACT',
  REPORT = 'REPORT',

  // Communication
  ATTACHMENT = 'ATTACHMENT',
  TELEMEDICINE_RECORDING = 'TELEMEDICINE_RECORDING',

  // Other
  OTHER = 'OTHER',
}

export enum FileStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED',
  QUARANTINED = 'QUARANTINED', // Failed virus scan
}

export enum ImageProcessingAction {
  RESIZE = 'RESIZE',
  CROP = 'CROP',
  COMPRESS = 'COMPRESS',
  THUMBNAIL = 'THUMBNAIL',
  WATERMARK = 'WATERMARK',
  CONVERT = 'CONVERT',
  ROTATE = 'ROTATE',
  OPTIMIZE = 'OPTIMIZE',
}

export enum DocumentProcessingAction {
  OCR = 'OCR',
  PDF_TO_IMAGE = 'PDF_TO_IMAGE',
  MERGE_PDF = 'MERGE_PDF',
  SPLIT_PDF = 'SPLIT_PDF',
  COMPRESS_PDF = 'COMPRESS_PDF',
  WATERMARK_PDF = 'WATERMARK_PDF',
  ENCRYPT_PDF = 'ENCRYPT_PDF',
  SIGN_PDF = 'SIGN_PDF',
}

// ==================== Configuration DTOs ====================

export class StorageProviderConfigDto {
  @ApiProperty({ enum: StorageProvider, description: 'Storage provider type' })
  @IsEnum(StorageProvider)
  provider: StorageProvider;

  @ApiPropertyOptional({ description: 'AWS Region (for S3)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Bucket/Container name' })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({ description: 'Access Key ID' })
  @IsOptional()
  @IsString()
  accessKeyId?: string;

  @ApiPropertyOptional({ description: 'Secret Access Key' })
  @IsOptional()
  @IsString()
  secretAccessKey?: string;

  @ApiPropertyOptional({ description: 'Azure Connection String' })
  @IsOptional()
  @IsString()
  connectionString?: string;

  @ApiPropertyOptional({ description: 'Azure Account Name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ description: 'Azure Account Key' })
  @IsOptional()
  @IsString()
  accountKey?: string;

  @ApiPropertyOptional({ description: 'GCP Project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'GCP Key File Path' })
  @IsOptional()
  @IsString()
  keyFilePath?: string;

  @ApiPropertyOptional({ description: 'Custom endpoint URL (for MinIO/compatible)' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Use SSL for connections' })
  @IsOptional()
  @IsBoolean()
  useSSL?: boolean;

  @ApiPropertyOptional({ description: 'Local storage base path' })
  @IsOptional()
  @IsString()
  basePath?: string;

  @ApiPropertyOptional({ description: 'Base URL for public access' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'CDN URL for file delivery' })
  @IsOptional()
  @IsString()
  cdnUrl?: string;
}

// ==================== Upload DTOs ====================

export class UploadFileDto {
  @ApiProperty({ description: 'Target file path/key in storage' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  path: string;

  @ApiPropertyOptional({ description: 'Original file name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;

  @ApiPropertyOptional({ description: 'MIME type of the file' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ enum: FileCategory, description: 'File category' })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ enum: StorageAccessLevel, description: 'Access level' })
  @IsOptional()
  @IsEnum(StorageAccessLevel)
  accessLevel?: StorageAccessLevel;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Entity type (Patient, Consultation, etc.)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Expiration date for file' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Enable server-side encryption' })
  @IsOptional()
  @IsBoolean()
  encrypt?: boolean;

  @ApiPropertyOptional({ description: 'Tags for the file' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UploadMultipleFilesDto {
  @ApiProperty({ description: 'Base path for all files' })
  @IsString()
  @IsNotEmpty()
  basePath: string;

  @ApiPropertyOptional({ enum: FileCategory })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ enum: StorageAccessLevel })
  @IsOptional()
  @IsEnum(StorageAccessLevel)
  accessLevel?: StorageAccessLevel;

  @ApiPropertyOptional({ description: 'Entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;
}

export class GetPresignedUploadUrlDto {
  @ApiProperty({ description: 'Target file path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: 'Content type' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Content length in bytes' })
  @IsOptional()
  @IsNumber()
  contentLength?: number;

  @ApiPropertyOptional({ description: 'URL expiration in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(604800) // 7 days
  expiresIn?: number;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ enum: StorageAccessLevel })
  @IsOptional()
  @IsEnum(StorageAccessLevel)
  accessLevel?: StorageAccessLevel;
}

export class CompleteMultipartUploadDto {
  @ApiProperty({ description: 'Upload ID' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: 'Array of completed parts' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultipartPartDto)
  parts: MultipartPartDto[];
}

export class MultipartPartDto {
  @ApiProperty({ description: 'Part number' })
  @IsNumber()
  partNumber: number;

  @ApiProperty({ description: 'ETag of the part' })
  @IsString()
  @IsNotEmpty()
  etag: string;
}

// ==================== Download DTOs ====================

export class GetPresignedDownloadUrlDto {
  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: 'URL expiration in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400) // 24 hours
  expiresIn?: number;

  @ApiPropertyOptional({ description: 'Force download with filename' })
  @IsOptional()
  @IsString()
  downloadFilename?: string;

  @ApiPropertyOptional({ description: 'Response content type override' })
  @IsOptional()
  @IsString()
  responseContentType?: string;
}

export class DownloadFileDto {
  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: 'Version ID (for versioned buckets)' })
  @IsOptional()
  @IsString()
  versionId?: string;
}

// ==================== File Operations DTOs ====================

export class CopyFileDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({ description: 'Destination file path' })
  @IsString()
  @IsNotEmpty()
  destinationPath: string;

  @ApiPropertyOptional({ description: 'Source version ID' })
  @IsOptional()
  @IsString()
  sourceVersionId?: string;

  @ApiPropertyOptional({ description: 'Override metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ enum: StorageAccessLevel })
  @IsOptional()
  @IsEnum(StorageAccessLevel)
  accessLevel?: StorageAccessLevel;
}

export class MoveFileDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({ description: 'Destination file path' })
  @IsString()
  @IsNotEmpty()
  destinationPath: string;

  @ApiPropertyOptional({ description: 'Delete source after copy' })
  @IsOptional()
  @IsBoolean()
  deleteSource?: boolean;
}

export class DeleteFileDto {
  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: 'Version ID (for versioned buckets)' })
  @IsOptional()
  @IsString()
  versionId?: string;

  @ApiPropertyOptional({ description: 'Permanently delete (bypass trash)' })
  @IsOptional()
  @IsBoolean()
  permanent?: boolean;
}

export class DeleteMultipleFilesDto {
  @ApiProperty({ description: 'Array of file paths to delete' })
  @IsArray()
  @IsString({ each: true })
  paths: string[];

  @ApiPropertyOptional({ description: 'Permanently delete' })
  @IsOptional()
  @IsBoolean()
  permanent?: boolean;
}

export class UpdateFileMetadataDto {
  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: 'New metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ enum: StorageAccessLevel })
  @IsOptional()
  @IsEnum(StorageAccessLevel)
  accessLevel?: StorageAccessLevel;

  @ApiPropertyOptional({ enum: FileCategory })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ description: 'New tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'New description' })
  @IsOptional()
  @IsString()
  description?: string;
}

// ==================== Query DTOs ====================

export class ListFilesDto {
  @ApiPropertyOptional({ description: 'Path prefix to filter' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ description: 'Delimiter for folder-like listing' })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({ description: 'Maximum number of files to return', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxKeys?: number;

  @ApiPropertyOptional({ description: 'Continuation token for pagination' })
  @IsOptional()
  @IsString()
  continuationToken?: string;

  @ApiPropertyOptional({ description: 'Start after this key' })
  @IsOptional()
  @IsString()
  startAfter?: string;
}

export class SearchFilesDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: FileCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ enum: StorageAccessLevel })
  @IsOptional()
  @IsEnum(StorageAccessLevel)
  accessLevel?: StorageAccessLevel;

  @ApiPropertyOptional({ enum: FileStatus })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filter by clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Filter by uploader user ID' })
  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Filter by tags (any match)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Created after' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Created before' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({ description: 'Minimum file size in bytes' })
  @IsOptional()
  @IsNumber()
  minSize?: number;

  @ApiPropertyOptional({ description: 'Maximum file size in bytes' })
  @IsOptional()
  @IsNumber()
  maxSize?: number;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== Image Processing DTOs ====================

export class ProcessImageDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiPropertyOptional({ description: 'Destination file path (if different from source)' })
  @IsOptional()
  @IsString()
  destinationPath?: string;

  @ApiProperty({ description: 'Processing actions to apply' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageProcessingActionDto)
  actions: ImageProcessingActionDto[];

  @ApiPropertyOptional({ description: 'Output format' })
  @IsOptional()
  @IsString()
  outputFormat?: string;

  @ApiPropertyOptional({ description: 'Output quality (1-100)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;
}

export class ImageProcessingActionDto {
  @ApiProperty({ enum: ImageProcessingAction, description: 'Action type' })
  @IsEnum(ImageProcessingAction)
  action: ImageProcessingAction;

  @ApiPropertyOptional({ description: 'Target width' })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ description: 'Target height' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ description: 'Maintain aspect ratio' })
  @IsOptional()
  @IsBoolean()
  maintainAspectRatio?: boolean;

  @ApiPropertyOptional({ description: 'Crop gravity/position' })
  @IsOptional()
  @IsString()
  gravity?: string;

  @ApiPropertyOptional({ description: 'Crop coordinates' })
  @IsOptional()
  @IsObject()
  cropArea?: { x: number; y: number; width: number; height: number };

  @ApiPropertyOptional({ description: 'Rotation angle in degrees' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  angle?: number;

  @ApiPropertyOptional({ description: 'Watermark text or image path' })
  @IsOptional()
  @IsString()
  watermark?: string;

  @ApiPropertyOptional({ description: 'Watermark position' })
  @IsOptional()
  @IsString()
  watermarkPosition?: string;

  @ApiPropertyOptional({ description: 'Watermark opacity (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  watermarkOpacity?: number;
}

export class GenerateThumbnailDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiPropertyOptional({ description: 'Thumbnail sizes to generate' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThumbnailSizeDto)
  sizes?: ThumbnailSizeDto[];
}

export class ThumbnailSizeDto {
  @ApiProperty({ description: 'Size name (e.g., small, medium, large)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Width' })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiPropertyOptional({ description: 'Height (optional, maintains aspect ratio)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;
}

// ==================== Document Processing DTOs ====================

export class ProcessDocumentDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({ enum: DocumentProcessingAction, description: 'Processing action' })
  @IsEnum(DocumentProcessingAction)
  action: DocumentProcessingAction;

  @ApiPropertyOptional({ description: 'Destination file path' })
  @IsOptional()
  @IsString()
  destinationPath?: string;

  @ApiPropertyOptional({ description: 'Additional action options' })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class OcrDocumentDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiPropertyOptional({ description: 'Language(s) for OCR', default: ['por', 'eng'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Output format (text, json, searchable-pdf)' })
  @IsOptional()
  @IsString()
  outputFormat?: string;

  @ApiPropertyOptional({ description: 'Save extracted text to file' })
  @IsOptional()
  @IsBoolean()
  saveToFile?: boolean;

  @ApiPropertyOptional({ description: 'Enable layout analysis' })
  @IsOptional()
  @IsBoolean()
  analyzeLayout?: boolean;
}

export class MergePdfDto {
  @ApiProperty({ description: 'Array of PDF file paths to merge' })
  @IsArray()
  @IsString({ each: true })
  @MinLength(2, { each: false })
  sourcePaths: string[];

  @ApiProperty({ description: 'Destination file path' })
  @IsString()
  @IsNotEmpty()
  destinationPath: string;
}

export class SplitPdfDto {
  @ApiProperty({ description: 'Source PDF file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({ description: 'Destination folder path' })
  @IsString()
  @IsNotEmpty()
  destinationFolder: string;

  @ApiPropertyOptional({ description: 'Split mode (page, range, size)' })
  @IsOptional()
  @IsString()
  mode?: 'page' | 'range' | 'size';

  @ApiPropertyOptional({ description: 'Page ranges (e.g., ["1-5", "6-10"])' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ranges?: string[];

  @ApiPropertyOptional({ description: 'Specific pages to extract' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  pages?: number[];
}

// ==================== Security DTOs ====================

export class VirusScanResultDto {
  @ApiProperty({ description: 'File path' })
  path: string;

  @ApiProperty({ description: 'Scan completed successfully' })
  scanned: boolean;

  @ApiProperty({ description: 'File is clean (no threats detected)' })
  clean: boolean;

  @ApiPropertyOptional({ description: 'Threat name if detected' })
  threat?: string;

  @ApiPropertyOptional({ description: 'Scan engine used' })
  engine?: string;

  @ApiPropertyOptional({ description: 'Scan timestamp' })
  scannedAt?: string;
}

export class EncryptFileDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiPropertyOptional({ description: 'Destination file path' })
  @IsOptional()
  @IsString()
  destinationPath?: string;

  @ApiPropertyOptional({ description: 'Encryption algorithm' })
  @IsOptional()
  @IsString()
  algorithm?: string;

  @ApiPropertyOptional({ description: 'Encryption key (base64)' })
  @IsOptional()
  @IsString()
  encryptionKey?: string;
}

export class DecryptFileDto {
  @ApiProperty({ description: 'Source file path' })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiPropertyOptional({ description: 'Destination file path' })
  @IsOptional()
  @IsString()
  destinationPath?: string;

  @ApiPropertyOptional({ description: 'Decryption key (base64)' })
  @IsOptional()
  @IsString()
  decryptionKey?: string;
}

// ==================== Versioning DTOs ====================

export class ListFileVersionsDto {
  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: 'Maximum versions to return', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxVersions?: number;
}

export class RestoreFileVersionDto {
  @ApiProperty({ description: 'File path/key' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: 'Version ID to restore' })
  @IsString()
  @IsNotEmpty()
  versionId: string;
}

// ==================== Response DTOs ====================

export class FileMetadataDto {
  @ApiProperty({ description: 'File unique ID' })
  id: string;

  @ApiProperty({ description: 'File path/key in storage' })
  path: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File checksum (MD5 or SHA256)' })
  checksum: string;

  @ApiProperty({ enum: FileCategory })
  category: FileCategory;

  @ApiProperty({ enum: StorageAccessLevel })
  accessLevel: StorageAccessLevel;

  @ApiProperty({ enum: FileStatus })
  status: FileStatus;

  @ApiPropertyOptional({ description: 'Version ID' })
  versionId?: string;

  @ApiPropertyOptional({ description: 'Entity type' })
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Clinic ID' })
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Uploader user ID' })
  uploadedBy?: string;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Tags' })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last modified timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Public URL (if public access)' })
  publicUrl?: string;
}

export class UploadResultDto {
  @ApiProperty({ description: 'Upload successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'File metadata' })
  file?: FileMetadataDto;

  @ApiPropertyOptional({ description: 'Error message' })
  error?: string;

  @ApiPropertyOptional({ description: 'Presigned URL (for direct upload)' })
  presignedUrl?: string;

  @ApiPropertyOptional({ description: 'Upload ID (for multipart upload)' })
  uploadId?: string;

  @ApiPropertyOptional({ description: 'Part URLs (for multipart upload)' })
  partUrls?: string[];
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL' })
  url: string;

  @ApiProperty({ description: 'URL expiration timestamp' })
  expiresAt: string;

  @ApiPropertyOptional({ description: 'HTTP method to use' })
  method?: string;

  @ApiPropertyOptional({ description: 'Required headers' })
  headers?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Form fields (for POST uploads)' })
  fields?: Record<string, string>;
}

export class ListFilesResultDto {
  @ApiProperty({ description: 'Array of file metadata' })
  files: FileMetadataDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiPropertyOptional({ description: 'Common prefixes (folders)' })
  prefixes?: string[];

  @ApiPropertyOptional({ description: 'Continuation token for next page' })
  nextContinuationToken?: string;

  @ApiProperty({ description: 'Result is truncated' })
  isTruncated: boolean;
}

export class FileVersionDto {
  @ApiProperty({ description: 'Version ID' })
  versionId: string;

  @ApiProperty({ description: 'File size' })
  size: number;

  @ApiProperty({ description: 'Last modified' })
  lastModified: string;

  @ApiProperty({ description: 'Is latest version' })
  isLatest: boolean;

  @ApiPropertyOptional({ description: 'Checksum' })
  checksum?: string;
}

// ==================== Statistics DTOs ====================

export class StorageStatisticsDto {
  @ApiProperty({ description: 'Total storage used in bytes' })
  totalSize: number;

  @ApiProperty({ description: 'Total number of files' })
  totalFiles: number;

  @ApiProperty({ description: 'Usage by category' })
  byCategory: Record<FileCategory, { count: number; size: number }>;

  @ApiProperty({ description: 'Usage by entity type' })
  byEntityType: Record<string, { count: number; size: number }>;

  @ApiProperty({ description: 'Usage by access level' })
  byAccessLevel: Record<StorageAccessLevel, { count: number; size: number }>;

  @ApiProperty({ description: 'Files by status' })
  byStatus: Record<FileStatus, number>;

  @ApiPropertyOptional({ description: 'Storage quota' })
  quota?: number;

  @ApiPropertyOptional({ description: 'Percentage of quota used' })
  quotaUsedPercent?: number;

  @ApiProperty({ description: 'Statistics generated at' })
  generatedAt: string;
}

export class StorageUsageQueryDto {
  @ApiPropertyOptional({ description: 'Filter by clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Group by period (day, week, month)' })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';
}

// ==================== Lifecycle DTOs ====================

export class SetLifecycleRuleDto {
  @ApiProperty({ description: 'Rule ID' })
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @ApiProperty({ description: 'Path prefix for the rule' })
  @IsString()
  @IsNotEmpty()
  prefix: string;

  @ApiPropertyOptional({ description: 'Transition to archive storage after days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  transitionToArchiveDays?: number;

  @ApiPropertyOptional({ description: 'Delete after days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expirationDays?: number;

  @ApiPropertyOptional({ description: 'Delete incomplete multipart uploads after days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  abortIncompleteMultipartDays?: number;

  @ApiPropertyOptional({ description: 'Number of versions to keep' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  noncurrentVersionsToKeep?: number;

  @ApiPropertyOptional({ description: 'Rule enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

// ==================== Backup/Restore DTOs ====================

export class BackupFilesDto {
  @ApiProperty({ description: 'Path prefix to backup' })
  @IsString()
  @IsNotEmpty()
  prefix: string;

  @ApiProperty({ description: 'Destination bucket/container' })
  @IsString()
  @IsNotEmpty()
  destinationBucket: string;

  @ApiPropertyOptional({ description: 'Destination path prefix' })
  @IsOptional()
  @IsString()
  destinationPrefix?: string;

  @ApiPropertyOptional({ description: 'Include file versions' })
  @IsOptional()
  @IsBoolean()
  includeVersions?: boolean;
}

export class RestoreFilesDto {
  @ApiProperty({ description: 'Source backup bucket' })
  @IsString()
  @IsNotEmpty()
  sourceBucket: string;

  @ApiProperty({ description: 'Source path prefix' })
  @IsString()
  @IsNotEmpty()
  sourcePrefix: string;

  @ApiPropertyOptional({ description: 'Destination path prefix' })
  @IsOptional()
  @IsString()
  destinationPrefix?: string;

  @ApiPropertyOptional({ description: 'Overwrite existing files' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;
}
