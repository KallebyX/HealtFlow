import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import {
  UploadFileDto,
  UploadMultipleFilesDto,
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
  GenerateThumbnailDto,
  ProcessDocumentDto,
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
  FileCategory,
  StorageAccessLevel,
  StorageProvider,
} from './dto';

// ============================================================
// STORAGE CONTROLLER
// Controller completo para gerenciamento de arquivos
// ============================================================

@ApiTags('Storage - File Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // ============================================================
  // UPLOAD OPERATIONS
  // ============================================================

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de arquivo',
    description: 'Faz upload de um arquivo para o storage',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'path'],
      properties: {
        file: { type: 'string', format: 'binary' },
        path: { type: 'string' },
        category: { type: 'string', enum: Object.values(FileCategory) },
        accessLevel: { type: 'string', enum: Object.values(StorageAccessLevel) },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
        clinicId: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        encrypt: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  @ApiResponse({ status: 413, description: 'Arquivo muito grande' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    return this.storageService.uploadFile(file, dto, user.id);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de múltiplos arquivos',
    description: 'Faz upload de até 10 arquivos simultaneamente',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'basePath'],
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        basePath: { type: 'string' },
        category: { type: 'string', enum: Object.values(FileCategory) },
        accessLevel: { type: 'string', enum: Object.values(StorageAccessLevel) },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
        clinicId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivos enviados com sucesso' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadMultipleFilesDto,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const results = await Promise.allSettled(
      files.map((file, index) =>
        this.storageService.uploadFile(
          file,
          {
            path: `${dto.basePath}/${file.originalname}`,
            category: dto.category,
            accessLevel: dto.accessLevel,
            entityType: dto.entityType,
            entityId: dto.entityId,
            clinicId: dto.clinicId,
          },
          user.id,
        ),
      ),
    );

    return {
      total: files.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((r, i) => ({
        filename: files[i].originalname,
        success: r.status === 'fulfilled',
        ...(r.status === 'fulfilled' ? { file: r.value } : { error: (r as any).reason?.message }),
      })),
    };
  }

  @Post('upload/presigned-url')
  @ApiOperation({
    summary: 'Obter URL pré-assinada para upload',
    description: 'Gera uma URL pré-assinada para upload direto ao storage',
  })
  @ApiResponse({ status: 200, description: 'URL gerada com sucesso' })
  async getPresignedUploadUrl(
    @Body() dto: GetPresignedUploadUrlDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.getPresignedUploadUrl(dto, user.id);
  }

  @Post('upload/multipart/initiate')
  @ApiOperation({
    summary: 'Iniciar upload multipart',
    description: 'Inicia um upload multipart para arquivos grandes',
  })
  @ApiResponse({ status: 200, description: 'Upload multipart iniciado' })
  async initiateMultipartUpload(
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.initiateMultipartUpload(dto, user.id);
  }

  @Post('upload/multipart/complete')
  @ApiOperation({
    summary: 'Completar upload multipart',
    description: 'Completa um upload multipart após todas as partes serem enviadas',
  })
  @ApiResponse({ status: 200, description: 'Upload multipart completado' })
  async completeMultipartUpload(
    @Body() dto: CompleteMultipartUploadDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.completeMultipartUpload(dto, user.id);
  }

  // ============================================================
  // DOWNLOAD OPERATIONS
  // ============================================================

  @Get('download/:fileId')
  @ApiOperation({
    summary: 'Download de arquivo',
    description: 'Baixa um arquivo do storage',
  })
  @ApiParam({ name: 'fileId', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo retornado' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async downloadFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const metadata = await this.storageService.getFileMetadata(fileId, user.id);
    const { buffer } = await this.storageService.downloadFile(metadata.path, user.id);

    res.set({
      'Content-Type': metadata.mimeType,
      'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
      'Content-Length': metadata.size,
    });

    return new StreamableFile(buffer);
  }

  @Post('download/presigned-url')
  @ApiOperation({
    summary: 'Obter URL pré-assinada para download',
    description: 'Gera uma URL pré-assinada para download direto do storage',
  })
  @ApiResponse({ status: 200, description: 'URL gerada com sucesso' })
  async getPresignedDownloadUrl(
    @Body() dto: GetPresignedDownloadUrlDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.getPresignedDownloadUrl(dto, user.id);
  }

  // ============================================================
  // FILE MANAGEMENT
  // ============================================================

  @Get('files')
  @ApiOperation({
    summary: 'Listar arquivos',
    description: 'Lista arquivos no storage com filtros opcionais',
  })
  @ApiResponse({ status: 200, description: 'Lista de arquivos' })
  async listFiles(
    @Query() dto: ListFilesDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.listFiles(dto, user.id);
  }

  @Post('files/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar arquivos',
    description: 'Busca arquivos com filtros avançados',
  })
  @ApiResponse({ status: 200, description: 'Resultados da busca' })
  async searchFiles(
    @Body() dto: SearchFilesDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.searchFiles(dto, user.id);
  }

  @Get('files/:fileId')
  @ApiOperation({
    summary: 'Obter metadados do arquivo',
    description: 'Retorna os metadados de um arquivo específico',
  })
  @ApiParam({ name: 'fileId', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Metadados do arquivo' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async getFileMetadata(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: any,
  ) {
    return this.storageService.getFileMetadata(fileId, user.id);
  }

  @Put('files/:fileId/metadata')
  @ApiOperation({
    summary: 'Atualizar metadados do arquivo',
    description: 'Atualiza os metadados de um arquivo',
  })
  @ApiParam({ name: 'fileId', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Metadados atualizados' })
  async updateFileMetadata(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() dto: UpdateFileMetadataDto,
    @CurrentUser() user: any,
  ) {
    const metadata = await this.storageService.getFileMetadata(fileId, user.id);
    return this.storageService.updateFileMetadata({ ...dto, path: metadata.path }, user.id);
  }

  @Post('files/copy')
  @ApiOperation({
    summary: 'Copiar arquivo',
    description: 'Copia um arquivo para outro caminho',
  })
  @ApiResponse({ status: 201, description: 'Arquivo copiado' })
  async copyFile(
    @Body() dto: CopyFileDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.copyFile(dto, user.id);
  }

  @Post('files/move')
  @ApiOperation({
    summary: 'Mover arquivo',
    description: 'Move um arquivo para outro caminho',
  })
  @ApiResponse({ status: 200, description: 'Arquivo movido' })
  async moveFile(
    @Body() dto: MoveFileDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.moveFile(dto, user.id);
  }

  @Delete('files/:fileId')
  @ApiOperation({
    summary: 'Deletar arquivo',
    description: 'Remove um arquivo do storage (soft delete por padrão)',
  })
  @ApiParam({ name: 'fileId', description: 'ID do arquivo' })
  @ApiQuery({ name: 'permanent', required: false, type: 'boolean' })
  @ApiResponse({ status: 204, description: 'Arquivo deletado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query('permanent') permanent: boolean,
    @CurrentUser() user: any,
  ) {
    const metadata = await this.storageService.getFileMetadata(fileId, user.id);
    await this.storageService.deleteFile({ path: metadata.path, permanent }, user.id);
  }

  @Post('files/delete-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deletar múltiplos arquivos',
    description: 'Remove vários arquivos do storage',
  })
  @ApiResponse({ status: 200, description: 'Resultado da operação' })
  async deleteMultipleFiles(
    @Body() dto: DeleteMultipleFilesDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.deleteMultipleFiles(dto, user.id);
  }

  // ============================================================
  // IMAGE PROCESSING
  // ============================================================

  @Post('images/process')
  @ApiOperation({
    summary: 'Processar imagem',
    description: 'Aplica transformações em uma imagem (resize, crop, compress, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Imagem processada' })
  async processImage(
    @Body() dto: ProcessImageDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.processImage(dto, user.id);
  }

  @Post('images/thumbnails')
  @ApiOperation({
    summary: 'Gerar thumbnails',
    description: 'Gera thumbnails em diferentes tamanhos para uma imagem',
  })
  @ApiResponse({ status: 201, description: 'Thumbnails gerados' })
  async generateThumbnails(
    @Body() dto: GenerateThumbnailDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.generateThumbnails(dto, user.id);
  }

  // ============================================================
  // DOCUMENT PROCESSING
  // ============================================================

  @Post('documents/process')
  @ApiOperation({
    summary: 'Processar documento',
    description: 'Aplica processamento em um documento (OCR, compress PDF, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Documento processado' })
  async processDocument(
    @Body() dto: ProcessDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.processDocument(dto, user.id);
  }

  @Post('documents/ocr')
  @ApiOperation({
    summary: 'Extrair texto (OCR)',
    description: 'Extrai texto de uma imagem ou PDF usando OCR',
  })
  @ApiResponse({ status: 200, description: 'Texto extraído' })
  async performOCR(
    @Body() dto: OcrDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.performOCR(dto, user.id);
  }

  @Post('documents/pdf/merge')
  @ApiOperation({
    summary: 'Mesclar PDFs',
    description: 'Combina múltiplos arquivos PDF em um único documento',
  })
  @ApiResponse({ status: 201, description: 'PDFs mesclados' })
  async mergePdfs(
    @Body() dto: MergePdfDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.mergePdfs(dto, user.id);
  }

  @Post('documents/pdf/split')
  @ApiOperation({
    summary: 'Dividir PDF',
    description: 'Divide um PDF em múltiplos documentos',
  })
  @ApiResponse({ status: 201, description: 'PDF dividido' })
  async splitPdf(
    @Body() dto: SplitPdfDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.splitPdf(dto, user.id);
  }

  // ============================================================
  // SECURITY
  // ============================================================

  @Post('security/encrypt')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Criptografar arquivo',
    description: 'Criptografa um arquivo usando AES-256',
  })
  @ApiResponse({ status: 200, description: 'Arquivo criptografado' })
  async encryptFile(
    @Body() dto: EncryptFileDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.encryptFile(dto, user.id);
  }

  @Post('security/decrypt')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Descriptografar arquivo',
    description: 'Descriptografa um arquivo criptografado',
  })
  @ApiResponse({ status: 200, description: 'Arquivo descriptografado' })
  async decryptFile(
    @Body() dto: DecryptFileDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.decryptFile(dto, user.id);
  }

  @Post('security/scan')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Escanear arquivo por vírus',
    description: 'Executa varredura de vírus em um arquivo',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Resultado da varredura' })
  async scanFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    return this.storageService.scanFile(file.buffer, file.originalname);
  }

  // ============================================================
  // VERSIONING
  // ============================================================

  @Get('versions/:fileId')
  @ApiOperation({
    summary: 'Listar versões do arquivo',
    description: 'Lista todas as versões de um arquivo',
  })
  @ApiParam({ name: 'fileId', description: 'ID do arquivo' })
  @ApiResponse({ status: 200, description: 'Lista de versões' })
  async listFileVersions(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query('maxVersions') maxVersions: number,
    @CurrentUser() user: any,
  ) {
    const metadata = await this.storageService.getFileMetadata(fileId, user.id);
    return this.storageService.listFileVersions(
      { path: metadata.path, maxVersions },
      user.id,
    );
  }

  @Post('versions/restore')
  @ApiOperation({
    summary: 'Restaurar versão do arquivo',
    description: 'Restaura uma versão específica de um arquivo',
  })
  @ApiResponse({ status: 200, description: 'Versão restaurada' })
  async restoreFileVersion(
    @Body() dto: RestoreFileVersionDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.restoreFileVersion(dto, user.id);
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de armazenamento',
    description: 'Retorna estatísticas de uso do storage',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas de armazenamento' })
  async getStorageStatistics(
    @Query() dto: StorageUsageQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.getStorageStatistics(dto, user.id);
  }

  // ============================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================

  @Post('lifecycle/rules')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Configurar regra de lifecycle',
    description: 'Define regras de arquivamento/expiração automática',
  })
  @ApiResponse({ status: 201, description: 'Regra configurada' })
  async setLifecycleRule(
    @Body() dto: SetLifecycleRuleDto,
    @CurrentUser() user: any,
  ) {
    await this.storageService.setLifecycleRule(dto, user.id);
    return { success: true, ruleId: dto.ruleId };
  }

  // ============================================================
  // BACKUP AND RESTORE
  // ============================================================

  @Post('backup')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Backup de arquivos',
    description: 'Copia arquivos para bucket de backup',
  })
  @ApiResponse({ status: 200, description: 'Backup realizado' })
  async backupFiles(
    @Body() dto: BackupFilesDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.backupFiles(dto, user.id);
  }

  @Post('restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Restaurar arquivos',
    description: 'Restaura arquivos de um backup',
  })
  @ApiResponse({ status: 200, description: 'Arquivos restaurados' })
  async restoreFiles(
    @Body() dto: RestoreFilesDto,
    @CurrentUser() user: any,
  ) {
    return this.storageService.restoreFiles(dto, user.id);
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  @Get('health')
  @ApiOperation({
    summary: 'Verificar saúde do storage',
    description: 'Verifica a conectividade com o provider de storage',
  })
  @ApiResponse({ status: 200, description: 'Status de saúde' })
  async healthCheck() {
    return this.storageService.healthCheck();
  }

  @Get('capabilities')
  @ApiOperation({
    summary: 'Listar capacidades',
    description: 'Retorna as capacidades e configurações do módulo de storage',
  })
  @ApiResponse({ status: 200, description: 'Capacidades do storage' })
  async getCapabilities() {
    return {
      version: '1.0.0',
      supportedProviders: Object.values(StorageProvider),
      fileCategories: Object.values(FileCategory),
      accessLevels: Object.values(StorageAccessLevel),
      features: {
        upload: {
          maxFileSize: '1GB',
          multipartUpload: true,
          presignedUrls: true,
          chunkSize: '10MB',
        },
        download: {
          presignedUrls: true,
          streaming: true,
        },
        imageProcessing: {
          resize: true,
          crop: true,
          compress: true,
          thumbnails: true,
          watermark: true,
          formats: ['jpeg', 'png', 'webp', 'gif', 'tiff'],
        },
        documentProcessing: {
          ocr: true,
          pdfMerge: true,
          pdfSplit: true,
          pdfCompress: true,
          languages: ['por', 'eng', 'spa'],
        },
        security: {
          encryption: true,
          virusScan: true,
          accessControl: true,
        },
        versioning: {
          enabled: true,
          maxVersions: 100,
        },
        lifecycle: {
          archiving: true,
          expiration: true,
        },
      },
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/dicom',
        'video/mp4',
        'audio/mpeg',
        'application/json',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.*',
      ],
    };
  }
}
