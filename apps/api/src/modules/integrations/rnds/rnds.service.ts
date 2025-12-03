import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AuditService } from '../../../common/services/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as https from 'https';
import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  RNDSEnvironment,
  RNDSDocumentType,
  RNDSCredentialsDto,
  RNDSTokenResponseDto,
  LabResultRNDSDto,
  ImmunizationRNDSDto,
  ClinicalEncounterRNDSDto,
  DischargeSummaryRNDSDto,
  CovidCertificateRNDSDto,
  RNDSSubmissionResponseDto,
  RNDSQueryDto,
  RNDSConfigDto,
  RNDSSyncStatusDto,
  SearchPatientDto,
  ValidateCNSDto,
  ValidateCPFDto,
} from './dto/rnds.dto';

@Injectable()
export class RndsService implements OnModuleInit {
  private readonly logger = new Logger(RndsService.name);
  private readonly environment: RNDSEnvironment;
  private readonly baseUrls: Record<RNDSEnvironment, string>;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private httpsAgent: https.Agent | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.environment = this.configService.get<RNDSEnvironment>(
      'RNDS_ENVIRONMENT',
      RNDSEnvironment.HOMOLOGATION,
    );

    this.baseUrls = {
      [RNDSEnvironment.HOMOLOGATION]: 'https://ehr-auth-hmg.saude.gov.br',
      [RNDSEnvironment.PRODUCTION]: 'https://ehr-auth.saude.gov.br',
    };
  }

  async onModuleInit() {
    // Inicializar configurações RNDS
    await this.initializeRndsConfig();
  }

  private async initializeRndsConfig() {
    const certificatePath = this.configService.get<string>('RNDS_CERTIFICATE_PATH');
    const certificatePassword = this.configService.get<string>('RNDS_CERTIFICATE_PASSWORD');

    if (certificatePath && fs.existsSync(certificatePath)) {
      try {
        const pfx = fs.readFileSync(certificatePath);
        this.httpsAgent = new https.Agent({
          pfx,
          passphrase: certificatePassword,
          rejectUnauthorized: true,
        });
        this.logger.log('RNDS certificate loaded successfully');
      } catch (error) {
        this.logger.error('Failed to load RNDS certificate:', error);
      }
    } else {
      this.logger.warn('RNDS certificate not configured');
    }
  }

  // ==================== Authentication ====================

  async authenticate(credentials: RNDSCredentialsDto): Promise<RNDSTokenResponseDto> {
    const cacheKey = `rnds:token:${credentials.cnes}`;
    const cached = await this.cacheService.get<RNDSTokenResponseDto>(cacheKey);

    if (cached && this.isTokenValid()) {
      return {
        accessToken: this.accessToken!,
        tokenType: 'Bearer',
        expiresIn: Math.floor((this.tokenExpiresAt!.getTime() - Date.now()) / 1000),
        scope: 'openid',
      };
    }

    try {
      // Montar requisição de autenticação OAuth 2.0
      const authUrl = `${this.baseUrls[this.environment]}/api/token`;

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'openid',
      });

      // Em produção, usaria o certificado digital para autenticação
      const response = await this.makeRequest('POST', authUrl, params.toString(), {
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      const tokenData = JSON.parse(response);

      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      const result: RNDSTokenResponseDto = {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope || 'openid',
      };

      // Cache por 55 minutos (token expira em 60)
      await this.cacheService.set(cacheKey, result, 3300);

      await this.auditService.log({
        action: 'RNDS_AUTHENTICATE',
        entityType: 'RNDS',
        details: { cnes: credentials.cnes, environment: this.environment },
      });

      return result;
    } catch (error) {
      this.logger.error('RNDS authentication failed:', error);
      throw new UnauthorizedException('Falha na autenticação com a RNDS');
    }
  }

  private isTokenValid(): boolean {
    return !!(this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date());
  }

  private async ensureAuthenticated(cnes: string, cnsProfissional: string): Promise<void> {
    if (!this.isTokenValid()) {
      await this.authenticate({ cnes, cnsProfissional });
    }
  }

  // ==================== Patient Search ====================

  async searchPatient(query: SearchPatientDto): Promise<any> {
    const cacheKey = `rnds:patient:${query.cpf || query.cns}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      await this.ensureAuthenticated(
        this.configService.get('RNDS_CNES', ''),
        this.configService.get('RNDS_CNS_PROFISSIONAL', ''),
      );

      let url: string;
      const baseUrl = this.baseUrls[this.environment].replace('ehr-auth', 'ehr-services');

      if (query.cpf) {
        url = `${baseUrl}/api/fhir/r4/Patient?identifier=http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf|${query.cpf}`;
      } else if (query.cns) {
        url = `${baseUrl}/api/fhir/r4/Patient?identifier=http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns|${query.cns}`;
      } else {
        throw new BadRequestException('CPF ou CNS é obrigatório');
      }

      const response = await this.makeAuthenticatedRequest('GET', url);
      const bundle = JSON.parse(response);

      if (bundle.total === 0) {
        return null;
      }

      const result = bundle.entry?.[0]?.resource;
      await this.cacheService.set(cacheKey, result, 300); // 5 min cache

      return result;
    } catch (error) {
      this.logger.error('Error searching patient in RNDS:', error);
      throw error;
    }
  }

  // ==================== CNS/CPF Validation ====================

  validateCNS(cns: string): boolean {
    if (!cns || cns.length !== 15) return false;

    // CNS pode começar com 1, 2, 7, 8 ou 9
    const firstDigit = cns[0];
    if (!['1', '2', '7', '8', '9'].includes(firstDigit)) return false;

    // Algoritmo de validação CNS
    if (['1', '2'].includes(firstDigit)) {
      // CNS definitivo
      return this.validateDefinitiveCNS(cns);
    } else {
      // CNS provisório
      return this.validateProvisionalCNS(cns);
    }
  }

  private validateDefinitiveCNS(cns: string): boolean {
    const pis = cns.substring(0, 11);
    let soma = 0;

    for (let i = 0; i < 11; i++) {
      soma += parseInt(pis[i]) * (15 - i);
    }

    const resto = soma % 11;
    let dv = 11 - resto;

    if (dv === 11) dv = 0;

    if (dv === 10) {
      soma = 0;
      for (let i = 0; i < 11; i++) {
        soma += parseInt(pis[i]) * (15 - i);
      }
      soma += 2;
      const resto2 = soma % 11;
      dv = 11 - resto2;
      if (dv === 11) dv = 0;

      return cns.substring(11) === `001${dv}`;
    }

    return cns.substring(11) === `000${dv}`;
  }

  private validateProvisionalCNS(cns: string): boolean {
    let soma = 0;
    for (let i = 0; i < 15; i++) {
      soma += parseInt(cns[i]) * (15 - i);
    }
    return soma % 11 === 0;
  }

  validateCPF(cpf: string): boolean {
    if (!cpf || cpf.length !== 11) return false;

    // Elimina CPFs conhecidos como inválidos
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Valida 1º dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    // Valida 2º dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[10])) return false;

    return true;
  }

  // ==================== Lab Result Submission ====================

  async submitLabResult(data: LabResultRNDSDto, userId: string): Promise<RNDSSubmissionResponseDto> {
    try {
      // Validar dados
      if (!this.validateCPF(data.patientCpf)) {
        throw new BadRequestException('CPF do paciente inválido');
      }

      // Construir Bundle FHIR
      const bundle = this.buildLabResultBundle(data);

      // Submeter ao RNDS
      const response = await this.submitBundle(bundle, RNDSDocumentType.RESULTADO_EXAME_LABORATORIAL);

      // Salvar status de sincronização
      await this.saveSyncStatus({
        localId: data.resultId,
        documentType: RNDSDocumentType.RESULTADO_EXAME_LABORATORIAL,
        rndsId: response.rndsId,
        protocol: response.protocol,
        syncStatus: response.success ? 'SYNCED' : 'ERROR',
        errorMessage: response.errorMessage,
      });

      await this.auditService.log({
        action: 'RNDS_SUBMIT_LAB_RESULT',
        entityType: 'LabResult',
        entityId: data.resultId,
        userId,
        details: { rndsId: response.rndsId, success: response.success },
      });

      return response;
    } catch (error) {
      this.logger.error('Error submitting lab result to RNDS:', error);

      await this.saveSyncStatus({
        localId: data.resultId,
        documentType: RNDSDocumentType.RESULTADO_EXAME_LABORATORIAL,
        syncStatus: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private buildLabResultBundle(data: LabResultRNDSDto): any {
    const bundleId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    return {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        lastUpdated: timestamp,
        profile: ['http://www.saude.gov.br/fhir/r4/StructureDefinition/BRResultadoExameLaboratorial-1.0'],
      },
      identifier: {
        system: 'http://www.saude.gov.br/fhir/r4/NamingSystem/BRRNDS-',
        value: bundleId,
      },
      type: 'document',
      timestamp,
      entry: [
        // Composition
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoDocumento',
                  code: 'REL',
                  display: 'Resultado de Exame Laboratorial',
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            date: timestamp,
            author: [
              {
                identifier: {
                  system: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnes',
                  value: data.performerCnes,
                },
              },
            ],
            title: 'Resultado de Exame Laboratorial',
          },
        },
        // Patient
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Patient',
            identifier: [
              {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
              ...(data.patientCns
                ? [
                    {
                      system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                      value: data.patientCns,
                    },
                  ]
                : []),
            ],
            name: [{ text: data.patientName }],
            gender: data.patientGender === 'M' ? 'male' : 'female',
            birthDate: data.patientBirthDate,
          },
        },
        // ServiceRequest (Solicitação)
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'ServiceRequest',
            status: 'completed',
            intent: 'order',
            code: {
              coding: data.tests.map((t) => ({
                system: 'http://loinc.org',
                code: t.loincCode,
                display: t.testName,
              })),
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            requester: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: data.requesterProfessionalCns,
              },
            },
            performer: [
              {
                identifier: {
                  system: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnes',
                  value: data.performerCnes,
                },
              },
            ],
          },
        },
        // Observations (Resultados)
        ...data.tests.map((test) => ({
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Observation',
            status: 'final',
            category: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: 'laboratory',
                  },
                ],
              },
            ],
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: test.loincCode,
                  display: test.testName,
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            effectiveDateTime: data.collectionDate,
            issued: data.resultDate,
            performer: [
              {
                identifier: {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                  value: data.performerProfessionalCns,
                },
              },
            ],
            valueString: test.value,
            ...(test.unit && {
              valueQuantity: {
                value: parseFloat(test.value) || 0,
                unit: test.unit,
                system: 'http://unitsofmeasure.org',
              },
            }),
            ...(test.referenceRange && {
              referenceRange: [{ text: test.referenceRange }],
            }),
            ...(test.interpretation && {
              interpretation: [
                {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                      code: test.interpretation,
                    },
                  ],
                },
              ],
            }),
            ...(test.method && {
              method: { text: test.method },
            }),
          },
        })),
      ],
    };
  }

  // ==================== Immunization Submission ====================

  async submitImmunization(data: ImmunizationRNDSDto, userId: string): Promise<RNDSSubmissionResponseDto> {
    try {
      if (!this.validateCPF(data.patientCpf)) {
        throw new BadRequestException('CPF do paciente inválido');
      }

      const bundle = this.buildImmunizationBundle(data);
      const response = await this.submitBundle(bundle, RNDSDocumentType.REGISTRO_IMUNOBIOLOGICO);

      await this.saveSyncStatus({
        localId: data.immunizationId,
        documentType: RNDSDocumentType.REGISTRO_IMUNOBIOLOGICO,
        rndsId: response.rndsId,
        protocol: response.protocol,
        syncStatus: response.success ? 'SYNCED' : 'ERROR',
        errorMessage: response.errorMessage,
      });

      await this.auditService.log({
        action: 'RNDS_SUBMIT_IMMUNIZATION',
        entityType: 'Immunization',
        entityId: data.immunizationId,
        userId,
        details: { rndsId: response.rndsId, success: response.success },
      });

      return response;
    } catch (error) {
      this.logger.error('Error submitting immunization to RNDS:', error);
      throw error;
    }
  }

  private buildImmunizationBundle(data: ImmunizationRNDSDto): any {
    const bundleId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    return {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        lastUpdated: timestamp,
        profile: ['http://www.saude.gov.br/fhir/r4/StructureDefinition/BRRegistroImunobiologicoAdministrado-1.0'],
      },
      type: 'document',
      timestamp,
      entry: [
        // Composition
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoDocumento',
                  code: 'RIA',
                  display: 'Registro de Imunobiológico Administrado',
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            date: timestamp,
            author: [
              {
                identifier: {
                  system: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnes',
                  value: data.performerCnes,
                },
              },
            ],
          },
        },
        // Patient
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Patient',
            identifier: [
              {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            ],
            name: [{ text: data.patientName }],
            gender: data.patientGender === 'M' ? 'male' : 'female',
            birthDate: data.patientBirthDate,
          },
        },
        // Immunization
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Immunization',
            status: data.status,
            vaccineCode: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRImunobiologico',
                  code: data.vaccineCode,
                  display: data.vaccineName,
                },
              ],
            },
            patient: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            occurrenceDateTime: data.occurrenceDate,
            lotNumber: data.lotNumber,
            expirationDate: data.expirationDate,
            manufacturer: {
              display: data.manufacturer,
            },
            site: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRLocalAplicacao',
                  code: data.site,
                },
              ],
            },
            route: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRViaAdministracao',
                  code: data.route,
                },
              ],
            },
            doseQuantity: {
              value: data.doseQuantity,
              unit: data.doseUnit,
            },
            performer: [
              {
                function: {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/v2-0443',
                      code: 'AP',
                      display: 'Administering Provider',
                    },
                  ],
                },
                actor: {
                  identifier: {
                    system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                    value: data.performerProfessionalCns,
                  },
                },
              },
            ],
            protocolApplied: [
              {
                ...(data.doseNumber && { doseNumberPositiveInt: data.doseNumber }),
                targetDisease: [
                  {
                    coding: [
                      {
                        system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRDoencaAlvo',
                        code: data.vaccineCode,
                      },
                    ],
                  },
                ],
              },
            ],
            reasonCode: [
              {
                coding: [
                  {
                    system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRMotivoImunobiologico',
                    code: data.reason,
                  },
                ],
              },
            ],
          },
        },
      ],
    };
  }

  // ==================== Clinical Encounter Submission ====================

  async submitClinicalEncounter(data: ClinicalEncounterRNDSDto, userId: string): Promise<RNDSSubmissionResponseDto> {
    try {
      if (!this.validateCPF(data.patientCpf)) {
        throw new BadRequestException('CPF do paciente inválido');
      }

      const bundle = this.buildClinicalEncounterBundle(data);
      const response = await this.submitBundle(bundle, RNDSDocumentType.REGISTRO_ATENDIMENTO);

      await this.saveSyncStatus({
        localId: data.encounterId,
        documentType: RNDSDocumentType.REGISTRO_ATENDIMENTO,
        rndsId: response.rndsId,
        protocol: response.protocol,
        syncStatus: response.success ? 'SYNCED' : 'ERROR',
        errorMessage: response.errorMessage,
      });

      await this.auditService.log({
        action: 'RNDS_SUBMIT_ENCOUNTER',
        entityType: 'Encounter',
        entityId: data.encounterId,
        userId,
        details: { rndsId: response.rndsId, success: response.success },
      });

      return response;
    } catch (error) {
      this.logger.error('Error submitting clinical encounter to RNDS:', error);
      throw error;
    }
  }

  private buildClinicalEncounterBundle(data: ClinicalEncounterRNDSDto): any {
    const bundleId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const entries: any[] = [
      // Composition
      {
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: 'Composition',
          status: 'final',
          type: {
            coding: [
              {
                system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoDocumento',
                code: 'RAC',
                display: 'Registro de Atendimento Clínico',
              },
            ],
          },
          subject: {
            identifier: {
              system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
              value: data.patientCpf,
            },
          },
          date: timestamp,
          author: [
            {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: data.practitionerCns,
              },
            },
          ],
        },
      },
      // Patient
      {
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: 'Patient',
          identifier: [
            {
              system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
              value: data.patientCpf,
            },
          ],
          name: [{ text: data.patientName }],
          gender: data.patientGender === 'M' ? 'male' : 'female',
          birthDate: data.patientBirthDate,
        },
      },
      // Encounter
      {
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: 'Encounter',
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: data.encounterClass,
          },
          type: [
            {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoAtendimento',
                  code: data.encounterType,
                },
              ],
            },
          ],
          subject: {
            identifier: {
              system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
              value: data.patientCpf,
            },
          },
          period: {
            start: data.periodStart,
            ...(data.periodEnd && { end: data.periodEnd }),
          },
          serviceProvider: {
            identifier: {
              system: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnes',
              value: data.serviceCnes,
            },
          },
          participant: [
            {
              individual: {
                identifier: {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                  value: data.practitionerCns,
                },
              },
            },
          ],
          ...(data.chiefComplaint && {
            reasonCode: [{ text: data.chiefComplaint }],
          }),
        },
      },
    ];

    // Add Conditions (Diagnoses)
    if (data.diagnoses?.length) {
      for (const diagnosis of data.diagnoses) {
        entries.push({
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Condition',
            clinicalStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active',
                },
              ],
            },
            code: {
              coding: [
                {
                  system: 'http://hl7.org/fhir/sid/icd-10',
                  code: diagnosis.icdCode,
                  display: diagnosis.description,
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
          },
        });
      }
    }

    // Add Procedures
    if (data.procedures?.length) {
      for (const procedure of data.procedures) {
        entries.push({
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Procedure',
            status: 'completed',
            code: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRProcedimento',
                  code: procedure.sigtapCode,
                  display: procedure.name,
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            ...(procedure.performedDate && {
              performedDateTime: procedure.performedDate,
            }),
          },
        });
      }
    }

    return {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        lastUpdated: timestamp,
        profile: ['http://www.saude.gov.br/fhir/r4/StructureDefinition/BRRegistroAtendimentoClinico-1.0'],
      },
      type: 'document',
      timestamp,
      entry: entries,
    };
  }

  // ==================== Discharge Summary Submission ====================

  async submitDischargeSummary(data: DischargeSummaryRNDSDto, userId: string): Promise<RNDSSubmissionResponseDto> {
    try {
      if (!this.validateCPF(data.patientCpf)) {
        throw new BadRequestException('CPF do paciente inválido');
      }

      const bundle = this.buildDischargeSummaryBundle(data);
      const response = await this.submitBundle(bundle, RNDSDocumentType.SUMARIO_ALTA);

      await this.saveSyncStatus({
        localId: data.summaryId,
        documentType: RNDSDocumentType.SUMARIO_ALTA,
        rndsId: response.rndsId,
        protocol: response.protocol,
        syncStatus: response.success ? 'SYNCED' : 'ERROR',
        errorMessage: response.errorMessage,
      });

      await this.auditService.log({
        action: 'RNDS_SUBMIT_DISCHARGE_SUMMARY',
        entityType: 'DischargeSummary',
        entityId: data.summaryId,
        userId,
        details: { rndsId: response.rndsId, success: response.success },
      });

      return response;
    } catch (error) {
      this.logger.error('Error submitting discharge summary to RNDS:', error);
      throw error;
    }
  }

  private buildDischargeSummaryBundle(data: DischargeSummaryRNDSDto): any {
    // Similar structure to clinical encounter with discharge-specific fields
    const bundleId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    return {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        lastUpdated: timestamp,
        profile: ['http://www.saude.gov.br/fhir/r4/StructureDefinition/BRSumarioAlta-1.0'],
      },
      type: 'document',
      timestamp,
      entry: [
        // Composition with discharge summary specific sections
        {
          fullUrl: `urn:uuid:${crypto.randomUUID()}`,
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: {
              coding: [
                {
                  system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRTipoDocumento',
                  code: 'SA',
                  display: 'Sumário de Alta',
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: data.patientCpf,
              },
            },
            date: timestamp,
            author: [
              {
                identifier: {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                  value: data.practitionerCns,
                },
              },
            ],
            section: [
              {
                title: 'Resumo da Internação',
                text: {
                  status: 'generated',
                  div: `<div>${data.summary}</div>`,
                },
              },
              ...(data.followUpInstructions
                ? [
                    {
                      title: 'Orientações Pós-Alta',
                      text: {
                        status: 'generated',
                        div: `<div>${data.followUpInstructions}</div>`,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // Patient, Encounter, Conditions, etc.
      ],
    };
  }

  // ==================== Bundle Submission ====================

  private async submitBundle(bundle: any, documentType: RNDSDocumentType): Promise<RNDSSubmissionResponseDto> {
    try {
      await this.ensureAuthenticated(
        this.configService.get('RNDS_CNES', ''),
        this.configService.get('RNDS_CNS_PROFISSIONAL', ''),
      );

      const baseUrl = this.baseUrls[this.environment].replace('ehr-auth', 'ehr-services');
      const url = `${baseUrl}/api/fhir/r4/Bundle`;

      const response = await this.makeAuthenticatedRequest('POST', url, JSON.stringify(bundle), {
        'Content-Type': 'application/fhir+json',
      });

      const result = JSON.parse(response);

      if (result.id) {
        return {
          success: true,
          rndsId: result.id,
          protocol: result.meta?.versionId,
          submittedAt: new Date().toISOString(),
        };
      }

      // Check for OperationOutcome errors
      if (result.resourceType === 'OperationOutcome') {
        const issues = result.issue || [];
        const errorMessages = issues
          .filter((i: any) => i.severity === 'error')
          .map((i: any) => i.diagnostics || i.details?.text)
          .join('; ');

        return {
          success: false,
          errorMessage: errorMessages || 'Unknown error from RNDS',
          errorDetails: result,
        };
      }

      return {
        success: true,
        rndsId: result.id,
        submittedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error submitting bundle to RNDS:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Query Documents ====================

  async queryDocuments(query: RNDSQueryDto): Promise<any> {
    try {
      await this.ensureAuthenticated(
        query.cnes || this.configService.get('RNDS_CNES', ''),
        this.configService.get('RNDS_CNS_PROFISSIONAL', ''),
      );

      const baseUrl = this.baseUrls[this.environment].replace('ehr-auth', 'ehr-services');

      const params = new URLSearchParams();

      if (query.cpf) {
        params.append('subject:identifier', `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf|${query.cpf}`);
      }

      if (query.documentType) {
        params.append('type', query.documentType);
      }

      if (query.startDate) {
        params.append('date', `ge${query.startDate}`);
      }

      if (query.endDate) {
        params.append('date', `le${query.endDate}`);
      }

      params.append('_count', String(query.limit || 20));
      params.append('_offset', String((query.page || 1) - 1) * (query.limit || 20));

      const url = `${baseUrl}/api/fhir/r4/Bundle?${params.toString()}`;
      const response = await this.makeAuthenticatedRequest('GET', url);

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Error querying RNDS documents:', error);
      throw error;
    }
  }

  // ==================== Sync Status Management ====================

  async getSyncStatus(localId: string): Promise<RNDSSyncStatusDto | null> {
    const status = await this.prisma.rndsSyncStatus.findFirst({
      where: { localId },
      orderBy: { createdAt: 'desc' },
    });

    if (!status) return null;

    return {
      localId: status.localId,
      documentType: status.documentType as RNDSDocumentType,
      syncStatus: status.syncStatus as any,
      rndsId: status.rndsId || undefined,
      protocol: status.protocol || undefined,
      lastAttempt: status.lastAttempt?.toISOString(),
      attemptCount: status.attemptCount,
      errorMessage: status.errorMessage || undefined,
      createdAt: status.createdAt.toISOString(),
      updatedAt: status.updatedAt.toISOString(),
    };
  }

  private async saveSyncStatus(data: Partial<RNDSSyncStatusDto>): Promise<void> {
    await this.prisma.rndsSyncStatus.upsert({
      where: {
        localId_documentType: {
          localId: data.localId!,
          documentType: data.documentType!,
        },
      },
      create: {
        localId: data.localId!,
        documentType: data.documentType!,
        syncStatus: data.syncStatus || 'PENDING',
        rndsId: data.rndsId,
        protocol: data.protocol,
        errorMessage: data.errorMessage,
        lastAttempt: new Date(),
        attemptCount: 1,
      },
      update: {
        syncStatus: data.syncStatus,
        rndsId: data.rndsId,
        protocol: data.protocol,
        errorMessage: data.errorMessage,
        lastAttempt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
  }

  async getPendingSyncs(): Promise<RNDSSyncStatusDto[]> {
    const pending = await this.prisma.rndsSyncStatus.findMany({
      where: {
        syncStatus: { in: ['PENDING', 'ERROR', 'RETRY'] },
        attemptCount: { lt: 5 }, // Max 5 tentativas
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return pending.map((p) => ({
      localId: p.localId,
      documentType: p.documentType as RNDSDocumentType,
      syncStatus: p.syncStatus as any,
      rndsId: p.rndsId || undefined,
      protocol: p.protocol || undefined,
      lastAttempt: p.lastAttempt?.toISOString(),
      attemptCount: p.attemptCount,
      errorMessage: p.errorMessage || undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  // ==================== Retry Failed Syncs ====================

  @Cron(CronExpression.EVERY_30_MINUTES)
  async retryFailedSyncs() {
    const pendingSyncs = await this.getPendingSyncs();

    for (const sync of pendingSyncs) {
      try {
        await this.saveSyncStatus({
          localId: sync.localId,
          documentType: sync.documentType,
          syncStatus: 'RETRY',
        });

        // Re-fetch and re-submit based on document type
        // This would need to be implemented based on the local data model
        this.logger.log(`Retrying sync for ${sync.documentType}: ${sync.localId}`);

        // Emitir evento para processamento
        this.eventEmitter.emit('rnds.sync.retry', sync);
      } catch (error) {
        this.logger.error(`Failed to retry sync for ${sync.localId}:`, error);
      }
    }
  }

  // ==================== HTTP Request Helpers ====================

  private async makeRequest(
    method: string,
    url: string,
    body?: string,
    headers: Record<string, string> = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'User-Agent': 'HealthFlow/1.0',
          ...headers,
        },
        ...(this.httpsAgent && { agent: this.httpsAgent }),
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  private async makeAuthenticatedRequest(
    method: string,
    url: string,
    body?: string,
    headers: Record<string, string> = {},
  ): Promise<string> {
    if (!this.accessToken) {
      throw new UnauthorizedException('Not authenticated with RNDS');
    }

    return this.makeRequest(method, url, body, {
      Authorization: `Bearer ${this.accessToken}`,
      ...headers,
    });
  }
}
