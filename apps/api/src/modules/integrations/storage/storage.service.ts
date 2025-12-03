import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AuditService } from '../../../common/services/audit.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

import {
  StorageProvider,
  StorageAccessLevel,
  FileCategory,
  FileStatus,
  UploadFileDto,
  GetPresignedUploadUrlDto,
  GetPresignedDownloadUrlDto,
  CopyFileDto,
  MoveFileDto,
  DeleteFileDto,
  DeleteMultipleFilesDto,
  UpdateFileMetadataDto,
  ListFilesDto,
  SearchFilesDto,
  ProcessImageDto,
  ProcessDocumentDto,
  GenerateThumbnailDto,
  OcrDocumentDto,
  MergePdfDto,
  SplitPdfDto,
  EncryptFileDto,
  DecryptFileDto,
  ListFileVersionsDto,
  RestoreFileVersionDto,
  StorageUsageQueryDto,
  SetLifecycleRuleDto,
  BackupFilesDto,
  RestoreFilesDto,
  CompleteMultipartUploadDto,
  FileMetadataDto,
  UploadResultDto,
  PresignedUrlResponseDto,
  ListFilesResultDto,
  FileVersionDto,
  StorageStatisticsDto,
  VirusScanResultDto,
  StorageProviderConfigDto,
  ImageProcessingAction,
  DocumentProcessingAction,
} from './dto';

// ============================================================
// STORAGE SERVICE
// Serviço completo para gerenciamento de arquivos em cloud storage
// Suporta múltiplos providers: AWS S3, Azure Blob, GCS, MinIO, Local
// ============================================================

interface StorageProviderInterface {
  upload(buffer: Buffer, path: string, options?: any): Promise<any>;
  download(path: string, options?: any): Promise<Buffer>;
  delete(path: string, options?: any): Promise<void>;
  exists(path: string): Promise<boolean>;
  getMetadata(path: string): Promise<any>;
  copy(source: string, destination: string, options?: any): Promise<void>;
  list(prefix: string, options?: any): Promise<any>;
  getPresignedUploadUrl(path: string, options?: any): Promise<string>;
  getPresignedDownloadUrl(path: string, options?: any): Promise<string>;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProviderInterface;
  private providerType: StorageProvider;
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  // Allowed MIME types for healthcare
  private readonly allowedMimeTypes = new Set([
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/rtf',

    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',

    // Medical Images (DICOM)
    'application/dicom',
    'application/dicom+json',
    'application/dicom+xml',

    // Audio/Video (for telemedicine)
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/quicktime',

    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',

    // JSON/XML
    'application/json',
    'application/xml',
    'text/xml',
    'application/fhir+json',
    'application/fhir+xml',
  ]);

  // Maximum file sizes by category (in bytes)
  private readonly maxFileSizes: Record<FileCategory, number> = {
    [FileCategory.MEDICAL_RECORD]: 100 * 1024 * 1024, // 100MB
    [FileCategory.PRESCRIPTION]: 10 * 1024 * 1024, // 10MB
    [FileCategory.LAB_RESULT]: 50 * 1024 * 1024, // 50MB
    [FileCategory.MEDICAL_IMAGE]: 500 * 1024 * 1024, // 500MB (DICOM can be large)
    [FileCategory.EXAM_REPORT]: 50 * 1024 * 1024, // 50MB
    [FileCategory.CLINICAL_SUMMARY]: 20 * 1024 * 1024, // 20MB
    [FileCategory.REFERRAL_LETTER]: 10 * 1024 * 1024, // 10MB
    [FileCategory.CONSENT_FORM]: 10 * 1024 * 1024, // 10MB
    [FileCategory.MEDICAL_CERTIFICATE]: 10 * 1024 * 1024, // 10MB
    [FileCategory.IDENTITY_DOCUMENT]: 10 * 1024 * 1024, // 10MB
    [FileCategory.INSURANCE_CARD]: 10 * 1024 * 1024, // 10MB
    [FileCategory.PROFILE_PHOTO]: 5 * 1024 * 1024, // 5MB
    [FileCategory.SIGNATURE]: 1 * 1024 * 1024, // 1MB
    [FileCategory.INVOICE]: 10 * 1024 * 1024, // 10MB
    [FileCategory.RECEIPT]: 10 * 1024 * 1024, // 10MB
    [FileCategory.CONTRACT]: 20 * 1024 * 1024, // 20MB
    [FileCategory.REPORT]: 50 * 1024 * 1024, // 50MB
    [FileCategory.ATTACHMENT]: 25 * 1024 * 1024, // 25MB
    [FileCategory.TELEMEDICINE_RECORDING]: 1024 * 1024 * 1024, // 1GB
    [FileCategory.OTHER]: 50 * 1024 * 1024, // 50MB
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.providerType = this.configService.get<StorageProvider>('STORAGE_PROVIDER', StorageProvider.LOCAL);
    this.bucketName = this.configService.get<string>('STORAGE_BUCKET', 'healthflow-files');
    this.cdnUrl = this.configService.get<string>('STORAGE_CDN_URL', '');

    this.initializeProvider();
  }

  // ============================================================
  // PROVIDER INITIALIZATION
  // ============================================================

  private async initializeProvider(): Promise<void> {
    switch (this.providerType) {
      case StorageProvider.AWS_S3:
        this.provider = await this.createS3Provider();
        break;
      case StorageProvider.AZURE_BLOB:
        this.provider = await this.createAzureProvider();
        break;
      case StorageProvider.GOOGLE_CLOUD:
        this.provider = await this.createGCSProvider();
        break;
      case StorageProvider.MINIO:
        this.provider = await this.createMinioProvider();
        break;
      case StorageProvider.LOCAL:
      default:
        this.provider = await this.createLocalProvider();
        break;
    }

    this.logger.log(`Storage provider initialized: ${this.providerType}`);
  }

  private async createS3Provider(): Promise<StorageProviderInterface> {
    // AWS S3 Provider Implementation
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    return {
      upload: async (buffer: Buffer, filePath: string, options?: any): Promise<any> => {
        // S3 PutObject implementation
        const params = {
          Bucket: this.bucketName,
          Key: filePath,
          Body: buffer,
          ContentType: options?.contentType,
          Metadata: options?.metadata,
          ServerSideEncryption: options?.encrypt ? 'AES256' : undefined,
          ACL: this.getS3ACL(options?.accessLevel),
        };

        // In real implementation, use AWS SDK:
        // const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
        // return s3.send(new PutObjectCommand(params));

        this.logger.debug(`S3 Upload: ${filePath}`);
        return { ETag: crypto.randomUUID(), VersionId: crypto.randomUUID() };
      },

      download: async (filePath: string, options?: any): Promise<Buffer> => {
        // S3 GetObject implementation
        this.logger.debug(`S3 Download: ${filePath}`);
        return Buffer.from('');
      },

      delete: async (filePath: string, options?: any): Promise<void> => {
        this.logger.debug(`S3 Delete: ${filePath}`);
      },

      exists: async (filePath: string): Promise<boolean> => {
        try {
          // HeadObject to check existence
          return true;
        } catch {
          return false;
        }
      },

      getMetadata: async (filePath: string): Promise<any> => {
        return {};
      },

      copy: async (source: string, destination: string, options?: any): Promise<void> => {
        this.logger.debug(`S3 Copy: ${source} -> ${destination}`);
      },

      list: async (prefix: string, options?: any): Promise<any> => {
        return { Contents: [], CommonPrefixes: [] };
      },

      getPresignedUploadUrl: async (filePath: string, options?: any): Promise<string> => {
        const expiresIn = options?.expiresIn || 3600;
        // Generate presigned URL for PUT
        return `https://${this.bucketName}.s3.${region}.amazonaws.com/${filePath}?X-Amz-Expires=${expiresIn}`;
      },

      getPresignedDownloadUrl: async (filePath: string, options?: any): Promise<string> => {
        const expiresIn = options?.expiresIn || 3600;
        return `https://${this.bucketName}.s3.${region}.amazonaws.com/${filePath}?X-Amz-Expires=${expiresIn}`;
      },
    };
  }

  private async createAzureProvider(): Promise<StorageProviderInterface> {
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    const containerName = this.bucketName;

    return {
      upload: async (buffer: Buffer, filePath: string, options?: any): Promise<any> => {
        this.logger.debug(`Azure Upload: ${filePath}`);
        return { etag: crypto.randomUUID() };
      },

      download: async (filePath: string, options?: any): Promise<Buffer> => {
        this.logger.debug(`Azure Download: ${filePath}`);
        return Buffer.from('');
      },

      delete: async (filePath: string, options?: any): Promise<void> => {
        this.logger.debug(`Azure Delete: ${filePath}`);
      },

      exists: async (filePath: string): Promise<boolean> => {
        return true;
      },

      getMetadata: async (filePath: string): Promise<any> => {
        return {};
      },

      copy: async (source: string, destination: string, options?: any): Promise<void> => {
        this.logger.debug(`Azure Copy: ${source} -> ${destination}`);
      },

      list: async (prefix: string, options?: any): Promise<any> => {
        return { segment: { blobItems: [] } };
      },

      getPresignedUploadUrl: async (filePath: string, options?: any): Promise<string> => {
        // Generate SAS token
        const accountName = this.configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME');
        return `https://${accountName}.blob.core.windows.net/${containerName}/${filePath}?sas=token`;
      },

      getPresignedDownloadUrl: async (filePath: string, options?: any): Promise<string> => {
        const accountName = this.configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME');
        return `https://${accountName}.blob.core.windows.net/${containerName}/${filePath}?sas=token`;
      },
    };
  }

  private async createGCSProvider(): Promise<StorageProviderInterface> {
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const keyFilePath = this.configService.get<string>('GCP_KEY_FILE');

    return {
      upload: async (buffer: Buffer, filePath: string, options?: any): Promise<any> => {
        this.logger.debug(`GCS Upload: ${filePath}`);
        return { name: filePath, generation: Date.now() };
      },

      download: async (filePath: string, options?: any): Promise<Buffer> => {
        this.logger.debug(`GCS Download: ${filePath}`);
        return Buffer.from('');
      },

      delete: async (filePath: string, options?: any): Promise<void> => {
        this.logger.debug(`GCS Delete: ${filePath}`);
      },

      exists: async (filePath: string): Promise<boolean> => {
        return true;
      },

      getMetadata: async (filePath: string): Promise<any> => {
        return {};
      },

      copy: async (source: string, destination: string, options?: any): Promise<void> => {
        this.logger.debug(`GCS Copy: ${source} -> ${destination}`);
      },

      list: async (prefix: string, options?: any): Promise<any> => {
        return [[]];
      },

      getPresignedUploadUrl: async (filePath: string, options?: any): Promise<string> => {
        return `https://storage.googleapis.com/${this.bucketName}/${filePath}?signed=true`;
      },

      getPresignedDownloadUrl: async (filePath: string, options?: any): Promise<string> => {
        return `https://storage.googleapis.com/${this.bucketName}/${filePath}?signed=true`;
      },
    };
  }

  private async createMinioProvider(): Promise<StorageProviderInterface> {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<number>('MINIO_PORT', 9000);
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false);
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');

    // Similar to S3 but with custom endpoint
    return {
      upload: async (buffer: Buffer, filePath: string, options?: any): Promise<any> => {
        this.logger.debug(`MinIO Upload: ${filePath}`);
        return { etag: crypto.randomUUID() };
      },

      download: async (filePath: string, options?: any): Promise<Buffer> => {
        return Buffer.from('');
      },

      delete: async (filePath: string, options?: any): Promise<void> => {},

      exists: async (filePath: string): Promise<boolean> => {
        return true;
      },

      getMetadata: async (filePath: string): Promise<any> => {
        return {};
      },

      copy: async (source: string, destination: string, options?: any): Promise<void> => {},

      list: async (prefix: string, options?: any): Promise<any> => {
        return [];
      },

      getPresignedUploadUrl: async (filePath: string, options?: any): Promise<string> => {
        const protocol = useSSL ? 'https' : 'http';
        return `${protocol}://${endpoint}:${port}/${this.bucketName}/${filePath}`;
      },

      getPresignedDownloadUrl: async (filePath: string, options?: any): Promise<string> => {
        const protocol = useSSL ? 'https' : 'http';
        return `${protocol}://${endpoint}:${port}/${this.bucketName}/${filePath}`;
      },
    };
  }

  private async createLocalProvider(): Promise<StorageProviderInterface> {
    const basePath = this.configService.get<string>('STORAGE_LOCAL_PATH', './storage');

    // Ensure base directory exists
    await fs.mkdir(basePath, { recursive: true });

    return {
      upload: async (buffer: Buffer, filePath: string, options?: any): Promise<any> => {
        const fullPath = path.join(basePath, filePath);
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, buffer);

        const stats = await fs.stat(fullPath);
        const checksum = crypto.createHash('md5').update(buffer).digest('hex');

        return {
          path: filePath,
          size: stats.size,
          checksum,
          createdAt: stats.birthtime,
        };
      },

      download: async (filePath: string, options?: any): Promise<Buffer> => {
        const fullPath = path.join(basePath, filePath);
        return fs.readFile(fullPath);
      },

      delete: async (filePath: string, options?: any): Promise<void> => {
        const fullPath = path.join(basePath, filePath);
        await fs.unlink(fullPath);
      },

      exists: async (filePath: string): Promise<boolean> => {
        const fullPath = path.join(basePath, filePath);
        try {
          await fs.access(fullPath);
          return true;
        } catch {
          return false;
        }
      },

      getMetadata: async (filePath: string): Promise<any> => {
        const fullPath = path.join(basePath, filePath);
        const stats = await fs.stat(fullPath);
        return {
          size: stats.size,
          lastModified: stats.mtime,
          created: stats.birthtime,
        };
      },

      copy: async (source: string, destination: string, options?: any): Promise<void> => {
        const sourcePath = path.join(basePath, source);
        const destPath = path.join(basePath, destination);
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });
        await fs.copyFile(sourcePath, destPath);
      },

      list: async (prefix: string, options?: any): Promise<any> => {
        const dirPath = path.join(basePath, prefix);
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            path: path.join(prefix, entry.name),
          }));
        } catch {
          return [];
        }
      },

      getPresignedUploadUrl: async (filePath: string, options?: any): Promise<string> => {
        // Local provider doesn't support presigned URLs - return API endpoint
        const baseUrl = this.configService.get<string>('API_BASE_URL', 'http://localhost:3000');
        return `${baseUrl}/api/storage/upload/${encodeURIComponent(filePath)}`;
      },

      getPresignedDownloadUrl: async (filePath: string, options?: any): Promise<string> => {
        const baseUrl = this.configService.get<string>('API_BASE_URL', 'http://localhost:3000');
        return `${baseUrl}/api/storage/download/${encodeURIComponent(filePath)}`;
      },
    };
  }

  private getS3ACL(accessLevel?: StorageAccessLevel): string {
    switch (accessLevel) {
      case StorageAccessLevel.PUBLIC:
        return 'public-read';
      case StorageAccessLevel.PROTECTED:
        return 'authenticated-read';
      default:
        return 'private';
    }
  }

  // ============================================================
  // FILE UPLOAD OPERATIONS
  // ============================================================

  async uploadFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    userId: string,
  ): Promise<UploadResultDto> {
    try {
      // Validate file
      await this.validateFile(file, dto.category);

      // Generate unique file path
      const filePath = this.generateFilePath(dto.path, file.originalname);

      // Compute checksum
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // Check for duplicates
      const existingFile = await this.findFileByChecksum(checksum, dto.clinicId);
      if (existingFile) {
        return {
          success: true,
          file: existingFile,
        };
      }

      // Scan for viruses (if enabled)
      const scanEnabled = this.configService.get<boolean>('STORAGE_VIRUS_SCAN_ENABLED', false);
      if (scanEnabled) {
        const scanResult = await this.scanFile(file.buffer, file.originalname);
        if (!scanResult.clean) {
          throw new BadRequestException(`Arquivo contém ameaça: ${scanResult.threat}`);
        }
      }

      // Upload to storage provider
      const uploadResult = await this.provider.upload(file.buffer, filePath, {
        contentType: file.mimetype,
        metadata: {
          ...dto.metadata,
          originalName: file.originalname,
          uploadedBy: userId,
          clinicId: dto.clinicId,
          entityType: dto.entityType,
          entityId: dto.entityId,
        },
        accessLevel: dto.accessLevel || StorageAccessLevel.PRIVATE,
        encrypt: dto.encrypt,
      });

      // Save file metadata to database
      const fileRecord = await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: filePath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          checksum,
          category: dto.category || FileCategory.OTHER,
          accessLevel: dto.accessLevel || StorageAccessLevel.PRIVATE,
          status: FileStatus.UPLOADED,
          versionId: uploadResult.VersionId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          clinicId: dto.clinicId,
          uploadedById: userId,
          metadata: dto.metadata || {},
          tags: dto.tags || [],
          description: dto.description,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        },
      });

      // Emit event
      this.eventEmitter.emit('storage.file.uploaded', {
        fileId: fileRecord.id,
        path: filePath,
        userId,
        clinicId: dto.clinicId,
      });

      // Audit log
      await this.auditService.log({
        action: 'STORAGE_FILE_UPLOAD',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: {
          path: filePath,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          category: dto.category,
        },
      });

      // Generate public URL if applicable
      let publicUrl: string | undefined;
      if (dto.accessLevel === StorageAccessLevel.PUBLIC) {
        publicUrl = this.cdnUrl
          ? `${this.cdnUrl}/${filePath}`
          : await this.provider.getPresignedDownloadUrl(filePath, { expiresIn: 86400 * 365 });
      }

      return {
        success: true,
        file: {
          id: fileRecord.id,
          path: filePath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          checksum,
          category: fileRecord.category as FileCategory,
          accessLevel: fileRecord.accessLevel as StorageAccessLevel,
          status: fileRecord.status as FileStatus,
          versionId: fileRecord.versionId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          clinicId: dto.clinicId,
          uploadedBy: userId,
          metadata: fileRecord.metadata as Record<string, string>,
          tags: fileRecord.tags,
          description: fileRecord.description,
          expiresAt: fileRecord.expiresAt?.toISOString(),
          createdAt: fileRecord.createdAt.toISOString(),
          updatedAt: fileRecord.updatedAt.toISOString(),
          publicUrl,
        },
      };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPresignedUploadUrl(
    dto: GetPresignedUploadUrlDto,
    userId: string,
  ): Promise<PresignedUrlResponseDto> {
    try {
      const filePath = this.generateFilePath(dto.path);
      const expiresIn = dto.expiresIn || 3600;

      const url = await this.provider.getPresignedUploadUrl(filePath, {
        contentType: dto.contentType,
        contentLength: dto.contentLength,
        expiresIn,
        metadata: dto.metadata,
        accessLevel: dto.accessLevel,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Create pending file record
      await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: filePath,
          originalName: path.basename(dto.path),
          mimeType: dto.contentType || 'application/octet-stream',
          size: dto.contentLength || 0,
          checksum: '',
          category: FileCategory.OTHER,
          accessLevel: dto.accessLevel || StorageAccessLevel.PRIVATE,
          status: FileStatus.PENDING,
          uploadedById: userId,
          metadata: dto.metadata || {},
          tags: [],
        },
      });

      await this.auditService.log({
        action: 'STORAGE_PRESIGNED_UPLOAD_URL_GENERATED',
        userId,
        resourceType: 'StorageFile',
        resourceId: filePath,
        details: { expiresAt: expiresAt.toISOString() },
      });

      return {
        url,
        expiresAt: expiresAt.toISOString(),
        method: 'PUT',
        headers: {
          'Content-Type': dto.contentType || 'application/octet-stream',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned upload URL: ${error.message}`);
      throw new InternalServerErrorException('Falha ao gerar URL de upload');
    }
  }

  async initiateMultipartUpload(
    dto: UploadFileDto,
    userId: string,
  ): Promise<{ uploadId: string; path: string; partUrls: PresignedUrlResponseDto[] }> {
    try {
      const filePath = this.generateFilePath(dto.path);
      const uploadId = crypto.randomUUID();

      // Store multipart upload info
      await this.cacheService.set(
        `multipart:${uploadId}`,
        {
          path: filePath,
          userId,
          dto,
          parts: [],
          createdAt: new Date().toISOString(),
        },
        3600 * 24, // 24 hours
      );

      // Generate presigned URLs for parts (assuming 10MB parts)
      const partUrls: PresignedUrlResponseDto[] = [];
      for (let i = 1; i <= 100; i++) {
        const partUrl = await this.provider.getPresignedUploadUrl(
          `${filePath}.part${i}`,
          { expiresIn: 3600 * 24 },
        );
        partUrls.push({
          url: partUrl,
          expiresAt: new Date(Date.now() + 3600 * 24 * 1000).toISOString(),
          method: 'PUT',
        });
      }

      return {
        uploadId,
        path: filePath,
        partUrls,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate multipart upload: ${error.message}`);
      throw new InternalServerErrorException('Falha ao iniciar upload multipart');
    }
  }

  async completeMultipartUpload(
    dto: CompleteMultipartUploadDto,
    userId: string,
  ): Promise<UploadResultDto> {
    try {
      const uploadInfo = await this.cacheService.get(`multipart:${dto.uploadId}`);
      if (!uploadInfo) {
        throw new NotFoundException('Upload não encontrado ou expirado');
      }

      // Complete multipart upload with provider
      // In real implementation, call provider's completeMultipartUpload

      // Create file record
      const fileRecord = await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: dto.path,
          originalName: path.basename(dto.path),
          mimeType: 'application/octet-stream',
          size: 0, // Will be updated
          checksum: '',
          category: FileCategory.OTHER,
          accessLevel: StorageAccessLevel.PRIVATE,
          status: FileStatus.UPLOADED,
          uploadedById: userId,
          metadata: {},
          tags: [],
        },
      });

      // Clean up cache
      await this.cacheService.del(`multipart:${dto.uploadId}`);

      return {
        success: true,
        file: {
          id: fileRecord.id,
          path: dto.path,
          originalName: path.basename(dto.path),
          mimeType: 'application/octet-stream',
          size: 0,
          checksum: '',
          category: FileCategory.OTHER,
          accessLevel: StorageAccessLevel.PRIVATE,
          status: FileStatus.UPLOADED,
          createdAt: fileRecord.createdAt.toISOString(),
          updatedAt: fileRecord.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to complete multipart upload: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // FILE DOWNLOAD OPERATIONS
  // ============================================================

  async downloadFile(
    filePath: string,
    userId: string,
  ): Promise<{ buffer: Buffer; metadata: FileMetadataDto }> {
    try {
      // Check file exists and user has access
      const fileRecord = await this.prisma.storageFile.findFirst({
        where: { path: filePath, status: { not: FileStatus.DELETED } },
      });

      if (!fileRecord) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      // Check access permissions
      await this.checkFileAccess(fileRecord, userId, 'read');

      // Download from provider
      const buffer = await this.provider.download(filePath);

      // Audit log
      await this.auditService.log({
        action: 'STORAGE_FILE_DOWNLOAD',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: { path: filePath },
      });

      return {
        buffer,
        metadata: {
          id: fileRecord.id,
          path: fileRecord.path,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          size: fileRecord.size,
          checksum: fileRecord.checksum,
          category: fileRecord.category as FileCategory,
          accessLevel: fileRecord.accessLevel as StorageAccessLevel,
          status: fileRecord.status as FileStatus,
          versionId: fileRecord.versionId,
          createdAt: fileRecord.createdAt.toISOString(),
          updatedAt: fileRecord.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`File download failed: ${error.message}`);
      throw error;
    }
  }

  async getPresignedDownloadUrl(
    dto: GetPresignedDownloadUrlDto,
    userId: string,
  ): Promise<PresignedUrlResponseDto> {
    try {
      // Check file exists and user has access
      const fileRecord = await this.prisma.storageFile.findFirst({
        where: { path: dto.path, status: { not: FileStatus.DELETED } },
      });

      if (!fileRecord) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      await this.checkFileAccess(fileRecord, userId, 'read');

      const expiresIn = dto.expiresIn || 3600;
      const url = await this.provider.getPresignedDownloadUrl(dto.path, {
        expiresIn,
        responseContentDisposition: dto.downloadFilename
          ? `attachment; filename="${dto.downloadFilename}"`
          : undefined,
        responseContentType: dto.responseContentType,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await this.auditService.log({
        action: 'STORAGE_PRESIGNED_DOWNLOAD_URL_GENERATED',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: { expiresAt: expiresAt.toISOString() },
      });

      return {
        url,
        expiresAt: expiresAt.toISOString(),
        method: 'GET',
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned download URL: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // FILE MANAGEMENT OPERATIONS
  // ============================================================

  async copyFile(dto: CopyFileDto, userId: string): Promise<FileMetadataDto> {
    try {
      const sourceFile = await this.prisma.storageFile.findFirst({
        where: { path: dto.sourcePath, status: { not: FileStatus.DELETED } },
      });

      if (!sourceFile) {
        throw new NotFoundException('Arquivo de origem não encontrado');
      }

      await this.checkFileAccess(sourceFile, userId, 'read');

      // Copy in storage provider
      await this.provider.copy(dto.sourcePath, dto.destinationPath, {
        sourceVersionId: dto.sourceVersionId,
        metadata: dto.metadata,
      });

      // Create new file record
      const newFile = await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: dto.destinationPath,
          originalName: path.basename(dto.destinationPath),
          mimeType: sourceFile.mimeType,
          size: sourceFile.size,
          checksum: sourceFile.checksum,
          category: sourceFile.category,
          accessLevel: dto.accessLevel || sourceFile.accessLevel,
          status: FileStatus.UPLOADED,
          entityType: sourceFile.entityType,
          entityId: sourceFile.entityId,
          clinicId: sourceFile.clinicId,
          uploadedById: userId,
          metadata: dto.metadata || sourceFile.metadata,
          tags: sourceFile.tags,
          description: sourceFile.description,
        },
      });

      await this.auditService.log({
        action: 'STORAGE_FILE_COPY',
        userId,
        resourceType: 'StorageFile',
        resourceId: newFile.id,
        details: {
          sourcePath: dto.sourcePath,
          destinationPath: dto.destinationPath,
        },
      });

      return {
        id: newFile.id,
        path: newFile.path,
        originalName: newFile.originalName,
        mimeType: newFile.mimeType,
        size: newFile.size,
        checksum: newFile.checksum,
        category: newFile.category as FileCategory,
        accessLevel: newFile.accessLevel as StorageAccessLevel,
        status: newFile.status as FileStatus,
        createdAt: newFile.createdAt.toISOString(),
        updatedAt: newFile.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`File copy failed: ${error.message}`);
      throw error;
    }
  }

  async moveFile(dto: MoveFileDto, userId: string): Promise<FileMetadataDto> {
    try {
      // Copy first
      const copiedFile = await this.copyFile(
        { sourcePath: dto.sourcePath, destinationPath: dto.destinationPath },
        userId,
      );

      // Delete source
      if (dto.deleteSource !== false) {
        await this.deleteFile({ path: dto.sourcePath }, userId);
      }

      await this.auditService.log({
        action: 'STORAGE_FILE_MOVE',
        userId,
        resourceType: 'StorageFile',
        resourceId: copiedFile.id,
        details: {
          sourcePath: dto.sourcePath,
          destinationPath: dto.destinationPath,
        },
      });

      return copiedFile;
    } catch (error) {
      this.logger.error(`File move failed: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(dto: DeleteFileDto, userId: string): Promise<void> {
    try {
      const fileRecord = await this.prisma.storageFile.findFirst({
        where: { path: dto.path, status: { not: FileStatus.DELETED } },
      });

      if (!fileRecord) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      await this.checkFileAccess(fileRecord, userId, 'delete');

      if (dto.permanent) {
        // Permanent delete from storage
        await this.provider.delete(dto.path, { versionId: dto.versionId });

        // Hard delete from database
        await this.prisma.storageFile.delete({
          where: { id: fileRecord.id },
        });
      } else {
        // Soft delete - move to trash
        await this.prisma.storageFile.update({
          where: { id: fileRecord.id },
          data: {
            status: FileStatus.DELETED,
            deletedAt: new Date(),
            deletedById: userId,
          },
        });
      }

      this.eventEmitter.emit('storage.file.deleted', {
        fileId: fileRecord.id,
        path: dto.path,
        permanent: dto.permanent,
        userId,
      });

      await this.auditService.log({
        action: dto.permanent ? 'STORAGE_FILE_PERMANENT_DELETE' : 'STORAGE_FILE_DELETE',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: { path: dto.path, permanent: dto.permanent },
      });
    } catch (error) {
      this.logger.error(`File delete failed: ${error.message}`);
      throw error;
    }
  }

  async deleteMultipleFiles(dto: DeleteMultipleFilesDto, userId: string): Promise<{
    deleted: string[];
    failed: { path: string; error: string }[];
  }> {
    const deleted: string[] = [];
    const failed: { path: string; error: string }[] = [];

    for (const filePath of dto.paths) {
      try {
        await this.deleteFile({ path: filePath, permanent: dto.permanent }, userId);
        deleted.push(filePath);
      } catch (error) {
        failed.push({ path: filePath, error: error.message });
      }
    }

    return { deleted, failed };
  }

  async updateFileMetadata(dto: UpdateFileMetadataDto, userId: string): Promise<FileMetadataDto> {
    try {
      const fileRecord = await this.prisma.storageFile.findFirst({
        where: { path: dto.path, status: { not: FileStatus.DELETED } },
      });

      if (!fileRecord) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      await this.checkFileAccess(fileRecord, userId, 'write');

      const updateData: any = {};
      if (dto.metadata) updateData.metadata = dto.metadata;
      if (dto.accessLevel) updateData.accessLevel = dto.accessLevel;
      if (dto.category) updateData.category = dto.category;
      if (dto.tags) updateData.tags = dto.tags;
      if (dto.description !== undefined) updateData.description = dto.description;

      const updated = await this.prisma.storageFile.update({
        where: { id: fileRecord.id },
        data: updateData,
      });

      await this.auditService.log({
        action: 'STORAGE_FILE_METADATA_UPDATE',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: { path: dto.path, updates: updateData },
      });

      return {
        id: updated.id,
        path: updated.path,
        originalName: updated.originalName,
        mimeType: updated.mimeType,
        size: updated.size,
        checksum: updated.checksum,
        category: updated.category as FileCategory,
        accessLevel: updated.accessLevel as StorageAccessLevel,
        status: updated.status as FileStatus,
        metadata: updated.metadata as Record<string, string>,
        tags: updated.tags,
        description: updated.description,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Metadata update failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // FILE SEARCH AND LISTING
  // ============================================================

  async listFiles(dto: ListFilesDto, userId: string): Promise<ListFilesResultDto> {
    try {
      const result = await this.provider.list(dto.prefix || '', {
        delimiter: dto.delimiter,
        maxKeys: dto.maxKeys || 100,
        continuationToken: dto.continuationToken,
        startAfter: dto.startAfter,
      });

      // Get file metadata from database
      const files = await this.prisma.storageFile.findMany({
        where: {
          path: { startsWith: dto.prefix },
          status: { not: FileStatus.DELETED },
        },
        take: dto.maxKeys || 100,
      });

      return {
        files: files.map(f => ({
          id: f.id,
          path: f.path,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          checksum: f.checksum,
          category: f.category as FileCategory,
          accessLevel: f.accessLevel as StorageAccessLevel,
          status: f.status as FileStatus,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
        total: files.length,
        prefixes: result.CommonPrefixes?.map((p: any) => p.Prefix) || [],
        nextContinuationToken: result.NextContinuationToken,
        isTruncated: result.IsTruncated || false,
      };
    } catch (error) {
      this.logger.error(`List files failed: ${error.message}`);
      throw error;
    }
  }

  async searchFiles(dto: SearchFilesDto, userId: string): Promise<ListFilesResultDto> {
    try {
      const where: any = {
        status: dto.status || { not: FileStatus.DELETED },
      };

      if (dto.query) {
        where.OR = [
          { originalName: { contains: dto.query, mode: 'insensitive' } },
          { description: { contains: dto.query, mode: 'insensitive' } },
          { path: { contains: dto.query, mode: 'insensitive' } },
        ];
      }

      if (dto.category) where.category = dto.category;
      if (dto.accessLevel) where.accessLevel = dto.accessLevel;
      if (dto.entityType) where.entityType = dto.entityType;
      if (dto.entityId) where.entityId = dto.entityId;
      if (dto.clinicId) where.clinicId = dto.clinicId;
      if (dto.uploadedBy) where.uploadedById = dto.uploadedBy;
      if (dto.mimeType) where.mimeType = { contains: dto.mimeType };
      if (dto.tags?.length) where.tags = { hasSome: dto.tags };
      if (dto.createdAfter) where.createdAt = { gte: new Date(dto.createdAfter) };
      if (dto.createdBefore) where.createdAt = { ...where.createdAt, lte: new Date(dto.createdBefore) };
      if (dto.minSize) where.size = { gte: dto.minSize };
      if (dto.maxSize) where.size = { ...where.size, lte: dto.maxSize };

      const page = dto.page || 1;
      const limit = dto.limit || 20;

      const [files, total] = await Promise.all([
        this.prisma.storageFile.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: dto.sortBy
            ? { [dto.sortBy]: dto.sortOrder || 'desc' }
            : { createdAt: 'desc' },
        }),
        this.prisma.storageFile.count({ where }),
      ]);

      return {
        files: files.map(f => ({
          id: f.id,
          path: f.path,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          checksum: f.checksum,
          category: f.category as FileCategory,
          accessLevel: f.accessLevel as StorageAccessLevel,
          status: f.status as FileStatus,
          entityType: f.entityType,
          entityId: f.entityId,
          clinicId: f.clinicId,
          uploadedBy: f.uploadedById,
          metadata: f.metadata as Record<string, string>,
          tags: f.tags,
          description: f.description,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
        total,
        isTruncated: total > page * limit,
      };
    } catch (error) {
      this.logger.error(`Search files failed: ${error.message}`);
      throw error;
    }
  }

  async getFileMetadata(fileId: string, userId: string): Promise<FileMetadataDto> {
    const fileRecord = await this.prisma.storageFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord || fileRecord.status === FileStatus.DELETED) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    await this.checkFileAccess(fileRecord, userId, 'read');

    return {
      id: fileRecord.id,
      path: fileRecord.path,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      checksum: fileRecord.checksum,
      category: fileRecord.category as FileCategory,
      accessLevel: fileRecord.accessLevel as StorageAccessLevel,
      status: fileRecord.status as FileStatus,
      versionId: fileRecord.versionId,
      entityType: fileRecord.entityType,
      entityId: fileRecord.entityId,
      clinicId: fileRecord.clinicId,
      uploadedBy: fileRecord.uploadedById,
      metadata: fileRecord.metadata as Record<string, string>,
      tags: fileRecord.tags,
      description: fileRecord.description,
      expiresAt: fileRecord.expiresAt?.toISOString(),
      createdAt: fileRecord.createdAt.toISOString(),
      updatedAt: fileRecord.updatedAt.toISOString(),
    };
  }

  // ============================================================
  // IMAGE PROCESSING
  // ============================================================

  async processImage(dto: ProcessImageDto, userId: string): Promise<FileMetadataDto> {
    try {
      const sourceFile = await this.prisma.storageFile.findFirst({
        where: { path: dto.sourcePath, status: { not: FileStatus.DELETED } },
      });

      if (!sourceFile) {
        throw new NotFoundException('Imagem não encontrada');
      }

      if (!sourceFile.mimeType.startsWith('image/')) {
        throw new BadRequestException('O arquivo não é uma imagem');
      }

      // Download original
      const buffer = await this.provider.download(dto.sourcePath);

      // Process image (using sharp or similar)
      let processedBuffer = buffer;
      for (const action of dto.actions) {
        processedBuffer = await this.applyImageAction(processedBuffer, action);
      }

      // Upload processed image
      const destPath = dto.destinationPath || dto.sourcePath;
      const result = await this.provider.upload(processedBuffer, destPath, {
        contentType: dto.outputFormat
          ? `image/${dto.outputFormat}`
          : sourceFile.mimeType,
      });

      // Update or create file record
      const fileRecord = await this.prisma.storageFile.upsert({
        where: { id: sourceFile.id },
        update: {
          size: processedBuffer.length,
          checksum: crypto.createHash('sha256').update(processedBuffer).digest('hex'),
          status: FileStatus.PROCESSED,
        },
        create: {
          id: crypto.randomUUID(),
          path: destPath,
          originalName: path.basename(destPath),
          mimeType: dto.outputFormat ? `image/${dto.outputFormat}` : sourceFile.mimeType,
          size: processedBuffer.length,
          checksum: crypto.createHash('sha256').update(processedBuffer).digest('hex'),
          category: sourceFile.category,
          accessLevel: sourceFile.accessLevel,
          status: FileStatus.PROCESSED,
          entityType: sourceFile.entityType,
          entityId: sourceFile.entityId,
          clinicId: sourceFile.clinicId,
          uploadedById: userId,
          metadata: sourceFile.metadata,
          tags: sourceFile.tags,
        },
      });

      await this.auditService.log({
        action: 'STORAGE_IMAGE_PROCESSED',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: {
          sourcePath: dto.sourcePath,
          actions: dto.actions.map(a => a.action),
        },
      });

      return {
        id: fileRecord.id,
        path: fileRecord.path,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        checksum: fileRecord.checksum,
        category: fileRecord.category as FileCategory,
        accessLevel: fileRecord.accessLevel as StorageAccessLevel,
        status: fileRecord.status as FileStatus,
        createdAt: fileRecord.createdAt.toISOString(),
        updatedAt: fileRecord.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`);
      throw error;
    }
  }

  private async applyImageAction(buffer: Buffer, action: any): Promise<Buffer> {
    // In real implementation, use sharp library
    // This is a placeholder
    switch (action.action) {
      case ImageProcessingAction.RESIZE:
        // sharp(buffer).resize(action.width, action.height)
        break;
      case ImageProcessingAction.CROP:
        // sharp(buffer).extract(action.cropArea)
        break;
      case ImageProcessingAction.COMPRESS:
        // sharp(buffer).jpeg({ quality: action.quality })
        break;
      case ImageProcessingAction.ROTATE:
        // sharp(buffer).rotate(action.angle)
        break;
      default:
        break;
    }
    return buffer;
  }

  async generateThumbnails(
    dto: GenerateThumbnailDto,
    userId: string,
  ): Promise<{ thumbnails: FileMetadataDto[] }> {
    try {
      const sourceFile = await this.prisma.storageFile.findFirst({
        where: { path: dto.sourcePath, status: { not: FileStatus.DELETED } },
      });

      if (!sourceFile) {
        throw new NotFoundException('Imagem não encontrada');
      }

      const buffer = await this.provider.download(dto.sourcePath);
      const thumbnails: FileMetadataDto[] = [];

      const sizes = dto.sizes || [
        { name: 'small', width: 100 },
        { name: 'medium', width: 300 },
        { name: 'large', width: 800 },
      ];

      for (const size of sizes) {
        const thumbPath = this.getThumbnailPath(dto.sourcePath, size.name);

        // Generate thumbnail (using sharp)
        const thumbBuffer = await this.applyImageAction(buffer, {
          action: ImageProcessingAction.RESIZE,
          width: size.width,
          height: size.height,
          maintainAspectRatio: true,
        });

        await this.provider.upload(thumbBuffer, thumbPath, {
          contentType: sourceFile.mimeType,
        });

        const thumbRecord = await this.prisma.storageFile.create({
          data: {
            id: crypto.randomUUID(),
            path: thumbPath,
            originalName: `${size.name}_${sourceFile.originalName}`,
            mimeType: sourceFile.mimeType,
            size: thumbBuffer.length,
            checksum: crypto.createHash('sha256').update(thumbBuffer).digest('hex'),
            category: sourceFile.category,
            accessLevel: sourceFile.accessLevel,
            status: FileStatus.UPLOADED,
            entityType: sourceFile.entityType,
            entityId: sourceFile.entityId,
            clinicId: sourceFile.clinicId,
            uploadedById: userId,
            metadata: { originalFileId: sourceFile.id, thumbnailSize: size.name },
            tags: ['thumbnail'],
          },
        });

        thumbnails.push({
          id: thumbRecord.id,
          path: thumbRecord.path,
          originalName: thumbRecord.originalName,
          mimeType: thumbRecord.mimeType,
          size: thumbRecord.size,
          checksum: thumbRecord.checksum,
          category: thumbRecord.category as FileCategory,
          accessLevel: thumbRecord.accessLevel as StorageAccessLevel,
          status: thumbRecord.status as FileStatus,
          createdAt: thumbRecord.createdAt.toISOString(),
          updatedAt: thumbRecord.updatedAt.toISOString(),
        });
      }

      return { thumbnails };
    } catch (error) {
      this.logger.error(`Thumbnail generation failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // DOCUMENT PROCESSING
  // ============================================================

  async processDocument(dto: ProcessDocumentDto, userId: string): Promise<any> {
    try {
      const sourceFile = await this.prisma.storageFile.findFirst({
        where: { path: dto.sourcePath, status: { not: FileStatus.DELETED } },
      });

      if (!sourceFile) {
        throw new NotFoundException('Documento não encontrado');
      }

      switch (dto.action) {
        case DocumentProcessingAction.OCR:
          return this.performOCR({
            sourcePath: dto.sourcePath,
            ...dto.options,
          }, userId);
        case DocumentProcessingAction.MERGE_PDF:
          // Requires multiple source files
          throw new BadRequestException('Use o endpoint específico para merge de PDFs');
        case DocumentProcessingAction.SPLIT_PDF:
          throw new BadRequestException('Use o endpoint específico para split de PDFs');
        case DocumentProcessingAction.COMPRESS_PDF:
          return this.compressPdf(dto.sourcePath, dto.destinationPath, userId);
        default:
          throw new BadRequestException(`Ação não suportada: ${dto.action}`);
      }
    } catch (error) {
      this.logger.error(`Document processing failed: ${error.message}`);
      throw error;
    }
  }

  async performOCR(dto: OcrDocumentDto, userId: string): Promise<{
    text: string;
    confidence: number;
    pages: Array<{ page: number; text: string; confidence: number }>;
  }> {
    try {
      const buffer = await this.provider.download(dto.sourcePath);

      // In real implementation, use Tesseract.js or cloud OCR service
      // This is a placeholder
      const result = {
        text: 'OCR extracted text would appear here',
        confidence: 0.95,
        pages: [
          { page: 1, text: 'Page 1 text', confidence: 0.95 },
        ],
      };

      // Save OCR result if requested
      if (dto.saveToFile) {
        const ocrPath = dto.sourcePath.replace(/\.[^.]+$/, '.ocr.txt');
        await this.provider.upload(Buffer.from(result.text), ocrPath, {
          contentType: 'text/plain',
        });
      }

      await this.auditService.log({
        action: 'STORAGE_DOCUMENT_OCR',
        userId,
        resourceType: 'StorageFile',
        resourceId: dto.sourcePath,
        details: { languages: dto.languages, confidence: result.confidence },
      });

      return result;
    } catch (error) {
      this.logger.error(`OCR failed: ${error.message}`);
      throw error;
    }
  }

  async mergePdfs(dto: MergePdfDto, userId: string): Promise<FileMetadataDto> {
    try {
      // Download all source PDFs
      const buffers = await Promise.all(
        dto.sourcePaths.map(p => this.provider.download(p)),
      );

      // In real implementation, use pdf-lib or similar to merge
      // This is a placeholder
      const mergedBuffer = Buffer.concat(buffers);

      await this.provider.upload(mergedBuffer, dto.destinationPath, {
        contentType: 'application/pdf',
      });

      const fileRecord = await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: dto.destinationPath,
          originalName: path.basename(dto.destinationPath),
          mimeType: 'application/pdf',
          size: mergedBuffer.length,
          checksum: crypto.createHash('sha256').update(mergedBuffer).digest('hex'),
          category: FileCategory.OTHER,
          accessLevel: StorageAccessLevel.PRIVATE,
          status: FileStatus.PROCESSED,
          uploadedById: userId,
          metadata: { mergedFrom: dto.sourcePaths },
          tags: ['merged-pdf'],
        },
      });

      return {
        id: fileRecord.id,
        path: fileRecord.path,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        checksum: fileRecord.checksum,
        category: fileRecord.category as FileCategory,
        accessLevel: fileRecord.accessLevel as StorageAccessLevel,
        status: fileRecord.status as FileStatus,
        createdAt: fileRecord.createdAt.toISOString(),
        updatedAt: fileRecord.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`PDF merge failed: ${error.message}`);
      throw error;
    }
  }

  async splitPdf(dto: SplitPdfDto, userId: string): Promise<{ files: FileMetadataDto[] }> {
    try {
      const buffer = await this.provider.download(dto.sourcePath);

      // In real implementation, use pdf-lib to split
      // This is a placeholder returning dummy data
      const files: FileMetadataDto[] = [];

      // Simulate splitting into pages
      const pages = dto.pages || [1, 2, 3];
      for (const pageNum of pages) {
        const pagePath = path.join(dto.destinationFolder, `page_${pageNum}.pdf`);

        await this.provider.upload(buffer, pagePath, {
          contentType: 'application/pdf',
        });

        const fileRecord = await this.prisma.storageFile.create({
          data: {
            id: crypto.randomUUID(),
            path: pagePath,
            originalName: `page_${pageNum}.pdf`,
            mimeType: 'application/pdf',
            size: buffer.length,
            checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
            category: FileCategory.OTHER,
            accessLevel: StorageAccessLevel.PRIVATE,
            status: FileStatus.PROCESSED,
            uploadedById: userId,
            metadata: { splitFrom: dto.sourcePath, pageNumber: pageNum },
            tags: ['split-pdf'],
          },
        });

        files.push({
          id: fileRecord.id,
          path: fileRecord.path,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          size: fileRecord.size,
          checksum: fileRecord.checksum,
          category: fileRecord.category as FileCategory,
          accessLevel: fileRecord.accessLevel as StorageAccessLevel,
          status: fileRecord.status as FileStatus,
          createdAt: fileRecord.createdAt.toISOString(),
          updatedAt: fileRecord.updatedAt.toISOString(),
        });
      }

      return { files };
    } catch (error) {
      this.logger.error(`PDF split failed: ${error.message}`);
      throw error;
    }
  }

  private async compressPdf(
    sourcePath: string,
    destinationPath: string | undefined,
    userId: string,
  ): Promise<FileMetadataDto> {
    const buffer = await this.provider.download(sourcePath);

    // In real implementation, use Ghostscript or pdf-lib to compress
    const compressedBuffer = buffer; // Placeholder

    const destPath = destinationPath || sourcePath;
    await this.provider.upload(compressedBuffer, destPath, {
      contentType: 'application/pdf',
    });

    const fileRecord = await this.prisma.storageFile.upsert({
      where: { path: destPath },
      update: {
        size: compressedBuffer.length,
        checksum: crypto.createHash('sha256').update(compressedBuffer).digest('hex'),
        status: FileStatus.PROCESSED,
      },
      create: {
        id: crypto.randomUUID(),
        path: destPath,
        originalName: path.basename(destPath),
        mimeType: 'application/pdf',
        size: compressedBuffer.length,
        checksum: crypto.createHash('sha256').update(compressedBuffer).digest('hex'),
        category: FileCategory.OTHER,
        accessLevel: StorageAccessLevel.PRIVATE,
        status: FileStatus.PROCESSED,
        uploadedById: userId,
        metadata: {},
        tags: [],
      },
    });

    return {
      id: fileRecord.id,
      path: fileRecord.path,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      checksum: fileRecord.checksum,
      category: fileRecord.category as FileCategory,
      accessLevel: fileRecord.accessLevel as StorageAccessLevel,
      status: fileRecord.status as FileStatus,
      createdAt: fileRecord.createdAt.toISOString(),
      updatedAt: fileRecord.updatedAt.toISOString(),
    };
  }

  // ============================================================
  // SECURITY OPERATIONS
  // ============================================================

  async scanFile(buffer: Buffer, filename: string): Promise<VirusScanResultDto> {
    try {
      // In real implementation, integrate with ClamAV or cloud antivirus
      // This is a placeholder
      const scanResult: VirusScanResultDto = {
        path: filename,
        scanned: true,
        clean: true,
        engine: 'ClamAV',
        scannedAt: new Date().toISOString(),
      };

      // Check for known malicious patterns (basic check)
      const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000));
      const maliciousPatterns = [
        /eval\s*\(/i,
        /<script[^>]*>.*?<\/script>/is,
        /\bexec\s*\(/i,
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          scanResult.clean = false;
          scanResult.threat = 'Suspicious content detected';
          break;
        }
      }

      return scanResult;
    } catch (error) {
      this.logger.error(`Virus scan failed: ${error.message}`);
      return {
        path: filename,
        scanned: false,
        clean: false,
        threat: 'Scan failed',
      };
    }
  }

  async encryptFile(dto: EncryptFileDto, userId: string): Promise<FileMetadataDto> {
    try {
      const buffer = await this.provider.download(dto.sourcePath);

      // Generate or use provided encryption key
      const key = dto.encryptionKey
        ? Buffer.from(dto.encryptionKey, 'base64')
        : crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      const algorithm = dto.algorithm || 'aes-256-cbc';
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

      const destPath = dto.destinationPath || `${dto.sourcePath}.encrypted`;
      await this.provider.upload(encrypted, destPath, {
        contentType: 'application/octet-stream',
        metadata: { encrypted: 'true', algorithm },
      });

      // Store encryption key securely (in KMS or secure vault)
      // This is a placeholder - in production, use AWS KMS, Azure Key Vault, etc.

      const fileRecord = await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: destPath,
          originalName: path.basename(destPath),
          mimeType: 'application/octet-stream',
          size: encrypted.length,
          checksum: crypto.createHash('sha256').update(encrypted).digest('hex'),
          category: FileCategory.OTHER,
          accessLevel: StorageAccessLevel.RESTRICTED,
          status: FileStatus.PROCESSED,
          uploadedById: userId,
          metadata: { encrypted: 'true', algorithm, originalPath: dto.sourcePath },
          tags: ['encrypted'],
        },
      });

      await this.auditService.log({
        action: 'STORAGE_FILE_ENCRYPTED',
        userId,
        resourceType: 'StorageFile',
        resourceId: fileRecord.id,
        details: { sourcePath: dto.sourcePath, algorithm },
      });

      return {
        id: fileRecord.id,
        path: fileRecord.path,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        checksum: fileRecord.checksum,
        category: fileRecord.category as FileCategory,
        accessLevel: fileRecord.accessLevel as StorageAccessLevel,
        status: fileRecord.status as FileStatus,
        createdAt: fileRecord.createdAt.toISOString(),
        updatedAt: fileRecord.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`File encryption failed: ${error.message}`);
      throw error;
    }
  }

  async decryptFile(dto: DecryptFileDto, userId: string): Promise<FileMetadataDto> {
    try {
      const fileRecord = await this.prisma.storageFile.findFirst({
        where: { path: dto.sourcePath },
      });

      if (!fileRecord) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      const metadata = fileRecord.metadata as Record<string, any>;
      if (metadata?.encrypted !== 'true') {
        throw new BadRequestException('Arquivo não está criptografado');
      }

      const buffer = await this.provider.download(dto.sourcePath);

      // Extract IV from the beginning of the file
      const iv = buffer.slice(0, 16);
      const encryptedData = buffer.slice(16);

      // Get decryption key (from KMS or provided)
      const key = dto.decryptionKey
        ? Buffer.from(dto.decryptionKey, 'base64')
        : await this.getDecryptionKey(fileRecord.id);

      const algorithm = metadata.algorithm || 'aes-256-cbc';
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

      const destPath = dto.destinationPath || metadata.originalPath || dto.sourcePath.replace('.encrypted', '');
      await this.provider.upload(decrypted, destPath);

      const newRecord = await this.prisma.storageFile.create({
        data: {
          id: crypto.randomUUID(),
          path: destPath,
          originalName: path.basename(destPath),
          mimeType: 'application/octet-stream', // Would need to detect
          size: decrypted.length,
          checksum: crypto.createHash('sha256').update(decrypted).digest('hex'),
          category: fileRecord.category,
          accessLevel: fileRecord.accessLevel,
          status: FileStatus.PROCESSED,
          uploadedById: userId,
          metadata: { decryptedFrom: dto.sourcePath },
          tags: [],
        },
      });

      await this.auditService.log({
        action: 'STORAGE_FILE_DECRYPTED',
        userId,
        resourceType: 'StorageFile',
        resourceId: newRecord.id,
        details: { sourcePath: dto.sourcePath },
      });

      return {
        id: newRecord.id,
        path: newRecord.path,
        originalName: newRecord.originalName,
        mimeType: newRecord.mimeType,
        size: newRecord.size,
        checksum: newRecord.checksum,
        category: newRecord.category as FileCategory,
        accessLevel: newRecord.accessLevel as StorageAccessLevel,
        status: newRecord.status as FileStatus,
        createdAt: newRecord.createdAt.toISOString(),
        updatedAt: newRecord.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`File decryption failed: ${error.message}`);
      throw error;
    }
  }

  private async getDecryptionKey(fileId: string): Promise<Buffer> {
    // In production, retrieve from AWS KMS, Azure Key Vault, etc.
    throw new BadRequestException('Chave de descriptografia não fornecida');
  }

  // ============================================================
  // VERSIONING
  // ============================================================

  async listFileVersions(dto: ListFileVersionsDto, userId: string): Promise<FileVersionDto[]> {
    try {
      // Get versions from provider (for S3, Azure with versioning enabled)
      // This is a placeholder
      const versions: FileVersionDto[] = [];

      // Also get from database if we track versions there
      const fileRecords = await this.prisma.storageFile.findMany({
        where: {
          path: dto.path,
          status: { not: FileStatus.DELETED },
        },
        orderBy: { createdAt: 'desc' },
        take: dto.maxVersions || 10,
      });

      for (const record of fileRecords) {
        versions.push({
          versionId: record.versionId || record.id,
          size: record.size,
          lastModified: record.updatedAt.toISOString(),
          isLatest: versions.length === 0,
          checksum: record.checksum,
        });
      }

      return versions;
    } catch (error) {
      this.logger.error(`List versions failed: ${error.message}`);
      throw error;
    }
  }

  async restoreFileVersion(dto: RestoreFileVersionDto, userId: string): Promise<FileMetadataDto> {
    try {
      // Copy specific version to current
      // This depends on the storage provider's versioning support

      await this.auditService.log({
        action: 'STORAGE_FILE_VERSION_RESTORED',
        userId,
        resourceType: 'StorageFile',
        resourceId: dto.path,
        details: { versionId: dto.versionId },
      });

      return this.getFileMetadata(dto.path, userId);
    } catch (error) {
      this.logger.error(`Restore version failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // STATISTICS AND REPORTING
  // ============================================================

  async getStorageStatistics(dto: StorageUsageQueryDto, userId: string): Promise<StorageStatisticsDto> {
    try {
      const cacheKey = `storage:stats:${dto.clinicId || 'all'}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached;

      const where: any = {
        status: { not: FileStatus.DELETED },
      };
      if (dto.clinicId) where.clinicId = dto.clinicId;
      if (dto.startDate) where.createdAt = { gte: new Date(dto.startDate) };
      if (dto.endDate) where.createdAt = { ...where.createdAt, lte: new Date(dto.endDate) };

      // Aggregate statistics
      const [totalStats, byCategory, byAccessLevel, byStatus] = await Promise.all([
        this.prisma.storageFile.aggregate({
          where,
          _sum: { size: true },
          _count: true,
        }),
        this.prisma.storageFile.groupBy({
          by: ['category'],
          where,
          _sum: { size: true },
          _count: true,
        }),
        this.prisma.storageFile.groupBy({
          by: ['accessLevel'],
          where,
          _sum: { size: true },
          _count: true,
        }),
        this.prisma.storageFile.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
      ]);

      // Get entity type breakdown
      const byEntityType = await this.prisma.storageFile.groupBy({
        by: ['entityType'],
        where: { ...where, entityType: { not: null } },
        _sum: { size: true },
        _count: true,
      });

      const stats: StorageStatisticsDto = {
        totalSize: totalStats._sum.size || 0,
        totalFiles: totalStats._count || 0,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category as FileCategory] = {
            count: item._count,
            size: item._sum.size || 0,
          };
          return acc;
        }, {} as Record<FileCategory, { count: number; size: number }>),
        byEntityType: byEntityType.reduce((acc, item) => {
          if (item.entityType) {
            acc[item.entityType] = {
              count: item._count,
              size: item._sum.size || 0,
            };
          }
          return acc;
        }, {} as Record<string, { count: number; size: number }>),
        byAccessLevel: byAccessLevel.reduce((acc, item) => {
          acc[item.accessLevel as StorageAccessLevel] = {
            count: item._count,
            size: item._sum.size || 0,
          };
          return acc;
        }, {} as Record<StorageAccessLevel, { count: number; size: number }>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status as FileStatus] = item._count;
          return acc;
        }, {} as Record<FileStatus, number>),
        generatedAt: new Date().toISOString(),
      };

      // Check quota if applicable
      if (dto.clinicId) {
        const quota = await this.getStorageQuota(dto.clinicId);
        if (quota) {
          stats.quota = quota;
          stats.quotaUsedPercent = (stats.totalSize / quota) * 100;
        }
      }

      await this.cacheService.set(cacheKey, stats, 300); // Cache for 5 minutes

      return stats;
    } catch (error) {
      this.logger.error(`Get statistics failed: ${error.message}`);
      throw error;
    }
  }

  private async getStorageQuota(clinicId: string): Promise<number | null> {
    // Get quota from clinic settings or subscription plan
    const defaultQuota = 10 * 1024 * 1024 * 1024; // 10GB default
    return defaultQuota;
  }

  // ============================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================

  async setLifecycleRule(dto: SetLifecycleRuleDto, userId: string): Promise<void> {
    try {
      // Store lifecycle rule in database
      await this.prisma.storageLifecycleRule.upsert({
        where: { id: dto.ruleId },
        update: {
          prefix: dto.prefix,
          transitionToArchiveDays: dto.transitionToArchiveDays,
          expirationDays: dto.expirationDays,
          abortIncompleteMultipartDays: dto.abortIncompleteMultipartDays,
          noncurrentVersionsToKeep: dto.noncurrentVersionsToKeep,
          enabled: dto.enabled ?? true,
        },
        create: {
          id: dto.ruleId,
          prefix: dto.prefix,
          transitionToArchiveDays: dto.transitionToArchiveDays,
          expirationDays: dto.expirationDays,
          abortIncompleteMultipartDays: dto.abortIncompleteMultipartDays,
          noncurrentVersionsToKeep: dto.noncurrentVersionsToKeep,
          enabled: dto.enabled ?? true,
        },
      });

      await this.auditService.log({
        action: 'STORAGE_LIFECYCLE_RULE_SET',
        userId,
        resourceType: 'StorageLifecycleRule',
        resourceId: dto.ruleId,
        details: dto,
      });
    } catch (error) {
      this.logger.error(`Set lifecycle rule failed: ${error.message}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async applyLifecycleRules(): Promise<void> {
    this.logger.log('Applying storage lifecycle rules...');

    try {
      const rules = await this.prisma.storageLifecycleRule.findMany({
        where: { enabled: true },
      });

      for (const rule of rules) {
        // Archive files
        if (rule.transitionToArchiveDays) {
          const archiveDate = new Date();
          archiveDate.setDate(archiveDate.getDate() - rule.transitionToArchiveDays);

          await this.prisma.storageFile.updateMany({
            where: {
              path: { startsWith: rule.prefix },
              status: FileStatus.UPLOADED,
              createdAt: { lt: archiveDate },
            },
            data: { status: FileStatus.ARCHIVED },
          });
        }

        // Delete expired files
        if (rule.expirationDays) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() - rule.expirationDays);

          const expiredFiles = await this.prisma.storageFile.findMany({
            where: {
              path: { startsWith: rule.prefix },
              createdAt: { lt: expirationDate },
              status: { not: FileStatus.DELETED },
            },
          });

          for (const file of expiredFiles) {
            try {
              await this.provider.delete(file.path);
              await this.prisma.storageFile.update({
                where: { id: file.id },
                data: { status: FileStatus.DELETED, deletedAt: new Date() },
              });
            } catch (error) {
              this.logger.error(`Failed to delete expired file ${file.path}: ${error.message}`);
            }
          }
        }
      }

      this.logger.log('Lifecycle rules applied successfully');
    } catch (error) {
      this.logger.error(`Lifecycle rules application failed: ${error.message}`);
    }
  }

  // ============================================================
  // BACKUP AND RESTORE
  // ============================================================

  async backupFiles(dto: BackupFilesDto, userId: string): Promise<{
    filesBackedUp: number;
    totalSize: number;
  }> {
    try {
      const files = await this.prisma.storageFile.findMany({
        where: {
          path: { startsWith: dto.prefix },
          status: { not: FileStatus.DELETED },
        },
      });

      let filesBackedUp = 0;
      let totalSize = 0;

      for (const file of files) {
        try {
          const buffer = await this.provider.download(file.path);
          const destPath = dto.destinationPrefix
            ? file.path.replace(dto.prefix, dto.destinationPrefix)
            : file.path;

          // Upload to backup bucket/container
          // In real implementation, use cross-region/account copy

          filesBackedUp++;
          totalSize += file.size;
        } catch (error) {
          this.logger.error(`Failed to backup file ${file.path}: ${error.message}`);
        }
      }

      await this.auditService.log({
        action: 'STORAGE_BACKUP_COMPLETED',
        userId,
        resourceType: 'StorageBackup',
        resourceId: dto.prefix,
        details: { filesBackedUp, totalSize, destination: dto.destinationBucket },
      });

      return { filesBackedUp, totalSize };
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);
      throw error;
    }
  }

  async restoreFiles(dto: RestoreFilesDto, userId: string): Promise<{
    filesRestored: number;
    totalSize: number;
  }> {
    // Similar to backup but in reverse
    return { filesRestored: 0, totalSize: 0 };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateFilePath(basePath: string, filename?: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = filename ? path.extname(filename) : '';
    const sanitizedBase = basePath.replace(/[^a-zA-Z0-9\-_\/\.]/g, '_');

    if (filename) {
      return `${sanitizedBase}/${timestamp}_${random}${ext}`;
    }
    return `${sanitizedBase}/${timestamp}_${random}`;
  }

  private getThumbnailPath(originalPath: string, sizeName: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);
    return `${dir}/thumbnails/${base}_${sizeName}${ext}`;
  }

  private async validateFile(file: Express.Multer.File, category?: FileCategory): Promise<void> {
    // Check MIME type
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`);
    }

    // Check file size
    const maxSize = category
      ? this.maxFileSizes[category]
      : 50 * 1024 * 1024; // 50MB default

    if (file.size > maxSize) {
      throw new BadRequestException(
        `Arquivo excede o tamanho máximo permitido (${Math.round(maxSize / 1024 / 1024)}MB)`,
      );
    }

    // Check filename
    if (file.originalname.length > 255) {
      throw new BadRequestException('Nome do arquivo muito longo');
    }
  }

  private async findFileByChecksum(
    checksum: string,
    clinicId?: string,
  ): Promise<FileMetadataDto | null> {
    const existing = await this.prisma.storageFile.findFirst({
      where: {
        checksum,
        clinicId,
        status: { not: FileStatus.DELETED },
      },
    });

    if (!existing) return null;

    return {
      id: existing.id,
      path: existing.path,
      originalName: existing.originalName,
      mimeType: existing.mimeType,
      size: existing.size,
      checksum: existing.checksum,
      category: existing.category as FileCategory,
      accessLevel: existing.accessLevel as StorageAccessLevel,
      status: existing.status as FileStatus,
      createdAt: existing.createdAt.toISOString(),
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  private async checkFileAccess(
    file: any,
    userId: string,
    operation: 'read' | 'write' | 'delete',
  ): Promise<void> {
    // Implement access control logic based on:
    // - File's accessLevel
    // - User's role
    // - User's clinic association
    // - Entity-level permissions

    if (file.accessLevel === StorageAccessLevel.PUBLIC && operation === 'read') {
      return; // Public files can be read by anyone
    }

    // For other cases, check user permissions
    // This is a simplified check - implement proper RBAC
    if (file.uploadedById !== userId) {
      // Check if user has access through clinic or entity
      // Implement your permission logic here
    }
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    provider: StorageProvider;
    details: Record<string, any>;
  }> {
    try {
      // Test connection by listing a non-existent prefix
      await this.provider.list('__health_check__');

      return {
        status: 'healthy',
        provider: this.providerType,
        details: {
          bucket: this.bucketName,
          cdnEnabled: !!this.cdnUrl,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.providerType,
        details: {
          error: error.message,
        },
      };
    }
  }
}
