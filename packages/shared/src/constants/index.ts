// Gamification Constants
export const GAMIFICATION = {
  LEVELS: [
    { level: 1, name: 'Iniciante', minPoints: 0 },
    { level: 2, name: 'Aprendiz', minPoints: 100 },
    { level: 3, name: 'Praticante', minPoints: 300 },
    { level: 4, name: 'Dedicado', minPoints: 600 },
    { level: 5, name: 'Comprometido', minPoints: 1000 },
    { level: 6, name: 'Exemplar', minPoints: 1500 },
    { level: 7, name: 'Mestre', minPoints: 2100 },
    { level: 8, name: 'Expert', minPoints: 2800 },
    { level: 9, name: 'Guru', minPoints: 3600 },
    { level: 10, name: 'Lenda', minPoints: 4500 },
  ],
  POINTS: {
    COMPLETE_PROFILE: 50,
    APPOINTMENT_COMPLETED: 20,
    MEDICATION_TAKEN: 5,
    VITAL_SIGNS_RECORDED: 10,
    STREAK_BONUS: 15,
    FIRST_TELEMEDICINE: 30,
    HEALTH_GOAL_COMPLETED: 25,
  },
} as const;

// Appointment Constants
export const APPOINTMENT = {
  DEFAULT_DURATION: 30, // minutes
  MIN_DURATION: 15,
  MAX_DURATION: 120,
  REMINDER_INTERVALS: [7 * 24 * 60, 24 * 60, 2 * 60], // 7d, 24h, 2h in minutes
} as const;

// Prescription Constants
export const PRESCRIPTION = {
  VALIDITY_DAYS: {
    SIMPLE: 60,
    CONTROLLED: 30,
    ANTIMICROBIAL: 10,
  },
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT: { ttl: 60, limit: 100 },
  AUTH: { ttl: 300, limit: 5 },
  UPLOAD: { ttl: 60, limit: 10 },
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// Regex Patterns
export const REGEX = {
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  CEP: /^\d{5}-?\d{3}$/,
  CRM: /^\d{4,6}$/,
  CNS: /^\d{15}$/,
} as const;

// Triage Colors
export const TRIAGE_COLORS = {
  RED: { name: 'Emergência', color: '#EF4444', priority: 1 },
  YELLOW: { name: 'Urgência', color: '#F59E0B', priority: 2 },
  GREEN: { name: 'Pouco Urgente', color: '#10B981', priority: 3 },
  BLUE: { name: 'Não Urgente', color: '#3B82F6', priority: 4 },
} as const;

// Brazilian States
export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
] as const;
