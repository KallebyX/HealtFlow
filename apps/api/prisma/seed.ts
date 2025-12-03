// ═══════════════════════════════════════════════════════════════════════════
// HEALTHFLOW - Database Seed
// Seeds the database with initial data for development and testing
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient, UserRole, UserStatus, Gender, BloodType, MaritalStatus, AppointmentType, AppointmentStatus, ControlLevel, PrescriptionType, PrescriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generateCPF(): string {
  const random = () => Math.floor(Math.random() * 10);
  const cpf = Array(9).fill(0).map(random);

  // Calculate first check digit
  let sum = cpf.reduce((acc, digit, i) => acc + digit * (10 - i), 0);
  cpf.push((sum * 10) % 11 % 10);

  // Calculate second check digit
  sum = cpf.reduce((acc, digit, i) => acc + digit * (11 - i), 0);
  cpf.push((sum * 10) % 11 % 10);

  return cpf.join('');
}

function generateCNS(): string {
  const random = () => Math.floor(Math.random() * 10);
  return Array(15).fill(0).map(random).join('');
}

function generateCRM(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateCNPJ(): string {
  const random = () => Math.floor(Math.random() * 10);
  return Array(14).fill(0).map(random).join('');
}

function generateCNES(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

function generatePhone(): string {
  const ddd = ['11', '21', '31', '41', '51'][Math.floor(Math.random() * 5)];
  const number = Math.floor(900000000 + Math.random() * 99999999).toString();
  return `${ddd}${number}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const SPECIALTIES = [
  'Clínica Geral',
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Urologia',
];

const BADGE_DATA = [
  // Onboarding
  { code: 'FIRST_STEPS', name: 'Primeiros Passos', description: 'Complete seu cadastro', category: 'onboarding', bonusPoints: 50 },
  { code: 'PROFILE_COMPLETE', name: 'Perfil Completo', description: 'Preencha todas as informações do perfil', category: 'onboarding', bonusPoints: 100 },

  // Appointments
  { code: 'FIRST_APPOINTMENT', name: 'Primeira Consulta', description: 'Realize sua primeira consulta', category: 'appointments', bonusPoints: 100 },
  { code: 'REGULAR_PATIENT', name: 'Paciente Regular', description: 'Complete 5 consultas', category: 'appointments', requiredPoints: 500, bonusPoints: 200 },
  { code: 'DEDICATED_PATIENT', name: 'Paciente Dedicado', description: 'Complete 20 consultas', category: 'appointments', requiredPoints: 2000, bonusPoints: 500 },
  { code: 'PUNCTUAL', name: 'Sempre Pontual', description: 'Chegue no horário em 10 consultas consecutivas', category: 'appointments', bonusPoints: 300 },

  // Health
  { code: 'HEALTH_TRACKER', name: 'Rastreador de Saúde', description: 'Conecte um dispositivo wearable', category: 'health', bonusPoints: 150 },
  { code: 'VITAL_WATCHER', name: 'Vigilante dos Sinais Vitais', description: 'Registre sinais vitais por 7 dias consecutivos', category: 'health', requiredStreak: 7, bonusPoints: 200 },
  { code: 'MEDICATION_MASTER', name: 'Mestre dos Medicamentos', description: 'Complete 30 dias tomando medicamentos no horário', category: 'health', requiredStreak: 30, bonusPoints: 400 },

  // Telemedicine
  { code: 'DIGITAL_HEALTH', name: 'Saúde Digital', description: 'Complete sua primeira teleconsulta', category: 'telemedicine', bonusPoints: 150 },
  { code: 'TELEMEDICINE_PRO', name: 'Profissional em Telemedicina', description: 'Complete 10 teleconsultas', category: 'telemedicine', bonusPoints: 300 },

  // Engagement
  { code: 'EARLY_BIRD', name: 'Madrugador', description: 'Agende consultas antes das 8h', category: 'engagement', bonusPoints: 100 },
  { code: 'FEEDBACK_GIVER', name: 'Avaliador', description: 'Avalie 5 consultas', category: 'engagement', bonusPoints: 100 },
  { code: 'PREVENTIVE_CARE', name: 'Cuidado Preventivo', description: 'Faça um check-up anual', category: 'engagement', bonusPoints: 250 },

  // Streaks
  { code: 'STREAK_7', name: 'Sequência de 7 Dias', description: 'Mantenha uma sequência de 7 dias', category: 'streak', requiredStreak: 7, bonusPoints: 100 },
  { code: 'STREAK_30', name: 'Sequência de 30 Dias', description: 'Mantenha uma sequência de 30 dias', category: 'streak', requiredStreak: 30, bonusPoints: 500 },
  { code: 'STREAK_100', name: 'Sequência de 100 Dias', description: 'Mantenha uma sequência de 100 dias', category: 'streak', requiredStreak: 100, bonusPoints: 1000 },

  // Levels
  { code: 'LEVEL_5', name: 'Nível 5', description: 'Alcance o nível 5', category: 'level', requiredLevel: 5, bonusPoints: 200 },
  { code: 'LEVEL_10', name: 'Nível 10', description: 'Alcance o nível 10', category: 'level', requiredLevel: 10, bonusPoints: 500 },
  { code: 'LEVEL_25', name: 'Nível 25', description: 'Alcance o nível 25', category: 'level', requiredLevel: 25, bonusPoints: 1000 },

  // Secret
  { code: 'SECRET_EXPLORER', name: 'Explorador Secreto', description: '???', category: 'secret', isSecret: true, bonusPoints: 500 },
];

const REWARD_DATA = [
  // Discounts
  { code: 'DISCOUNT_10', name: '10% de Desconto', description: 'Desconto de 10% na próxima consulta', type: 'DISCOUNT', discountPercent: 10, pointsCost: 500, requiredLevel: 1 },
  { code: 'DISCOUNT_15', name: '15% de Desconto', description: 'Desconto de 15% na próxima consulta', type: 'DISCOUNT', discountPercent: 15, pointsCost: 800, requiredLevel: 3 },
  { code: 'DISCOUNT_20', name: '20% de Desconto', description: 'Desconto de 20% na próxima consulta', type: 'DISCOUNT', discountPercent: 20, pointsCost: 1200, requiredLevel: 5 },
  { code: 'DISCOUNT_25', name: '25% de Desconto', description: 'Desconto de 25% na próxima consulta', type: 'DISCOUNT', discountPercent: 25, pointsCost: 1800, requiredLevel: 8 },

  // Free services
  { code: 'FREE_EXAM', name: 'Exame Gratuito', description: 'Um exame de sangue básico gratuito', type: 'FREE_SERVICE', pointsCost: 1500, requiredLevel: 5 },
  { code: 'FREE_TELEMEDICINE', name: 'Teleconsulta Gratuita', description: 'Uma teleconsulta gratuita', type: 'FREE_SERVICE', pointsCost: 2000, requiredLevel: 7 },

  // Priority
  { code: 'PRIORITY_SCHEDULING', name: 'Agendamento Prioritário', description: 'Prioridade no agendamento por 1 mês', type: 'PRIORITY', pointsCost: 1000, requiredLevel: 3 },
  { code: 'VIP_QUEUE', name: 'Fila VIP', description: 'Acesso à fila VIP por 1 mês', type: 'PRIORITY', pointsCost: 2500, requiredLevel: 10 },

  // Gift cards
  { code: 'GIFT_50', name: 'Crédito R$50', description: 'R$50 em créditos para usar na clínica', type: 'GIFT_CARD', value: 50, pointsCost: 3000, requiredLevel: 8 },
  { code: 'GIFT_100', name: 'Crédito R$100', description: 'R$100 em créditos para usar na clínica', type: 'GIFT_CARD', value: 100, pointsCost: 5500, requiredLevel: 12 },

  // Merchandise
  { code: 'TSHIRT', name: 'Camiseta HealthFlow', description: 'Camiseta exclusiva HealthFlow', type: 'MERCHANDISE', pointsCost: 2000, requiredLevel: 5, quantity: 100 },
  { code: 'KIT_WELLNESS', name: 'Kit Bem-Estar', description: 'Kit com garrafa d\'água, toalha e necessaire', type: 'MERCHANDISE', pointsCost: 4000, requiredLevel: 10, quantity: 50 },
];

const HEALTH_INSURANCES = [
  { name: 'Unimed', ansCode: '302147' },
  { name: 'Bradesco Saúde', ansCode: '005711' },
  { name: 'SulAmérica', ansCode: '006246' },
  { name: 'Amil', ansCode: '326305' },
  { name: 'Porto Seguro Saúde', ansCode: '005681' },
  { name: 'NotreDame Intermédica', ansCode: '359017' },
  { name: 'Hapvida', ansCode: '368253' },
  { name: 'São Francisco Saúde', ansCode: '339679' },
  { name: 'Golden Cross', ansCode: '403911' },
  { name: 'Cassi', ansCode: '346659' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ─────────────────────────────────────────────────────────────────────────
  // Health Insurances
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📋 Creating health insurances...');
  const healthInsurances = await Promise.all(
    HEALTH_INSURANCES.map(async (insurance) => {
      return prisma.healthInsurance.upsert({
        where: { ansCode: insurance.ansCode },
        update: {},
        create: {
          name: insurance.name,
          ansCode: insurance.ansCode,
          phone: generatePhone(),
          email: `contato@${insurance.name.toLowerCase().replace(/\s/g, '')}.com.br`,
          website: `https://www.${insurance.name.toLowerCase().replace(/\s/g, '')}.com.br`,
          active: true,
        },
      });
    })
  );
  console.log(`✅ Created ${healthInsurances.length} health insurances\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Badges
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🏆 Creating badges...');
  const badges = await Promise.all(
    BADGE_DATA.map(async (badge) => {
      return prisma.badge.upsert({
        where: { code: badge.code },
        update: {},
        create: badge,
      });
    })
  );
  console.log(`✅ Created ${badges.length} badges\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Rewards
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🎁 Creating rewards...');
  const rewards = await Promise.all(
    REWARD_DATA.map(async (reward) => {
      return prisma.reward.upsert({
        where: { code: reward.code },
        update: {},
        create: {
          ...reward,
          active: true,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
      });
    })
  );
  console.log(`✅ Created ${rewards.length} rewards\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Super Admin User
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👑 Creating super admin...');
  const adminPassword = await hashPassword('admin123');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@healthflow.com.br' },
    update: {},
    create: {
      email: 'admin@healthflow.com.br',
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    },
  });
  console.log(`✅ Super admin created: ${superAdmin.email}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Clinics
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🏥 Creating clinics...');
  const clinicsData = [
    {
      legalName: 'HealthFlow Clínica Médica LTDA',
      tradeName: 'HealthFlow Centro',
      cnpj: generateCNPJ(),
      cnes: generateCNES(),
      phone: '1130001000',
      email: 'contato@healthflow.com.br',
      website: 'https://www.healthflow.com.br',
      address: {
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Sala 1001',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        country: 'Brasil',
      },
      settings: {
        allowOnlineBooking: true,
        allowTelemedicine: true,
        minBookingNotice: 24,
        maxBookingAdvance: 90,
        cancellationPolicy: 24,
      },
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '08:00', end: '12:00' },
      },
    },
    {
      legalName: 'HealthFlow Clínica Norte LTDA',
      tradeName: 'HealthFlow Norte',
      cnpj: generateCNPJ(),
      cnes: generateCNES(),
      phone: '1140001000',
      email: 'norte@healthflow.com.br',
      website: 'https://norte.healthflow.com.br',
      address: {
        street: 'Rua Voluntários da Pátria',
        number: '500',
        neighborhood: 'Santana',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02011-000',
        country: 'Brasil',
      },
      settings: {
        allowOnlineBooking: true,
        allowTelemedicine: true,
        minBookingNotice: 24,
        maxBookingAdvance: 60,
        cancellationPolicy: 24,
      },
      workingHours: {
        monday: { start: '07:00', end: '19:00' },
        tuesday: { start: '07:00', end: '19:00' },
        wednesday: { start: '07:00', end: '19:00' },
        thursday: { start: '07:00', end: '19:00' },
        friday: { start: '07:00', end: '19:00' },
      },
    },
  ];

  const clinics = await Promise.all(
    clinicsData.map(async (clinicData) => {
      return prisma.clinic.upsert({
        where: { cnpj: clinicData.cnpj },
        update: {},
        create: clinicData,
      });
    })
  );
  console.log(`✅ Created ${clinics.length} clinics\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Rooms for Clinics
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🚪 Creating rooms...');
  const roomsData = [
    // Clinic 1
    { name: 'Consultório 1', type: 'CONSULTATION', floor: '10', clinicIndex: 0 },
    { name: 'Consultório 2', type: 'CONSULTATION', floor: '10', clinicIndex: 0 },
    { name: 'Consultório 3', type: 'CONSULTATION', floor: '10', clinicIndex: 0 },
    { name: 'Sala de Exames', type: 'EXAM', floor: '10', clinicIndex: 0 },
    { name: 'Sala de Procedimentos', type: 'PROCEDURE', floor: '10', clinicIndex: 0, equipment: ['Eletrocardiógrafo', 'Ultrassom'] },
    // Clinic 2
    { name: 'Consultório A', type: 'CONSULTATION', floor: '1', clinicIndex: 1 },
    { name: 'Consultório B', type: 'CONSULTATION', floor: '1', clinicIndex: 1 },
    { name: 'Sala de Coleta', type: 'COLLECTION', floor: '1', clinicIndex: 1 },
  ];

  let roomCount = 0;
  for (const roomData of roomsData) {
    const clinic = clinics[roomData.clinicIndex];
    await prisma.room.upsert({
      where: { clinicId_name: { clinicId: clinic.id, name: roomData.name } },
      update: {},
      create: {
        clinicId: clinic.id,
        name: roomData.name,
        type: roomData.type,
        floor: roomData.floor,
        equipment: roomData.equipment || [],
        active: true,
      },
    });
    roomCount++;
  }
  console.log(`✅ Created ${roomCount} rooms\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Doctors
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👨‍⚕️ Creating doctors...');
  const doctorsData = [
    { fullName: 'Dr. Carlos Eduardo Silva', specialty: 'Cardiologia', crmState: 'SP' },
    { fullName: 'Dra. Ana Paula Santos', specialty: 'Pediatria', crmState: 'SP' },
    { fullName: 'Dr. Roberto Oliveira', specialty: 'Clínica Geral', crmState: 'SP' },
    { fullName: 'Dra. Fernanda Lima', specialty: 'Dermatologia', crmState: 'SP' },
    { fullName: 'Dr. Marcos Pereira', specialty: 'Ortopedia', crmState: 'SP' },
    { fullName: 'Dra. Juliana Costa', specialty: 'Ginecologia', crmState: 'SP' },
    { fullName: 'Dr. Ricardo Mendes', specialty: 'Neurologia', crmState: 'SP' },
    { fullName: 'Dra. Patricia Alves', specialty: 'Endocrinologia', crmState: 'SP' },
  ];

  const doctorPassword = await hashPassword('doctor123');
  const doctors = [];

  for (let i = 0; i < doctorsData.length; i++) {
    const doctorData = doctorsData[i];
    const email = `${doctorData.fullName.toLowerCase().replace(/\s/g, '.').replace(/[^a-z.]/g, '')}@healthflow.com.br`;
    const cpf = generateCPF();

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: doctorPassword,
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: doctorData.fullName,
        cpf,
        birthDate: randomDate(new Date(1960, 0, 1), new Date(1990, 0, 1)),
        gender: doctorData.fullName.startsWith('Dra') ? Gender.FEMALE : Gender.MALE,
        phone: generatePhone(),
        crm: generateCRM(),
        crmState: doctorData.crmState,
        specialties: [doctorData.specialty],
        cns: generateCNS(),
        bio: `Especialista em ${doctorData.specialty} com mais de 10 anos de experiência.`,
        telemedicineEnabled: true,
        appointmentDuration: 30,
        workingHours: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' },
          wednesday: { start: '08:00', end: '17:00' },
          thursday: { start: '08:00', end: '17:00' },
          friday: { start: '08:00', end: '16:00' },
        },
      },
    });

    // Associate with clinic
    const clinicIndex = i % clinics.length;
    await prisma.clinicDoctor.upsert({
      where: { clinicId_doctorId: { clinicId: clinics[clinicIndex].id, doctorId: doctor.id } },
      update: {},
      create: {
        clinicId: clinics[clinicIndex].id,
        doctorId: doctor.id,
        isActive: true,
      },
    });

    doctors.push(doctor);
  }
  console.log(`✅ Created ${doctors.length} doctors\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Patients
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🧑‍🤝‍🧑 Creating patients...');
  const patientsData = [
    { fullName: 'Maria Aparecida Souza', gender: Gender.FEMALE },
    { fullName: 'José Carlos Santos', gender: Gender.MALE },
    { fullName: 'Ana Clara Oliveira', gender: Gender.FEMALE },
    { fullName: 'Pedro Henrique Lima', gender: Gender.MALE },
    { fullName: 'Luciana Ferreira Costa', gender: Gender.FEMALE },
    { fullName: 'Fernando Rodrigues Silva', gender: Gender.MALE },
    { fullName: 'Beatriz Almeida Pereira', gender: Gender.FEMALE },
    { fullName: 'Rafael Nascimento Gomes', gender: Gender.MALE },
    { fullName: 'Camila Martins Ribeiro', gender: Gender.FEMALE },
    { fullName: 'Gabriel Carvalho Dias', gender: Gender.MALE },
    { fullName: 'Juliana Barbosa Moreira', gender: Gender.FEMALE },
    { fullName: 'Lucas Fernandes Araújo', gender: Gender.MALE },
    { fullName: 'Mariana Teixeira Rocha', gender: Gender.FEMALE },
    { fullName: 'Thiago Correia Vieira', gender: Gender.MALE },
    { fullName: 'Carolina Reis Castro', gender: Gender.FEMALE },
  ];

  const patientPassword = await hashPassword('patient123');
  const patients = [];

  for (let i = 0; i < patientsData.length; i++) {
    const patientData = patientsData[i];
    const email = `${patientData.fullName.toLowerCase().replace(/\s/g, '.').replace(/[^a-z.]/g, '')}@email.com`;
    const cpf = generateCPF();

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: patientPassword,
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const bloodTypes = Object.values(BloodType);
    const maritalStatuses = Object.values(MaritalStatus);

    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: patientData.fullName,
        cpf,
        birthDate: randomDate(new Date(1950, 0, 1), new Date(2005, 0, 1)),
        gender: patientData.gender,
        maritalStatus: randomElement(maritalStatuses),
        phone: generatePhone(),
        email: email,
        cns: generateCNS(),
        bloodType: randomElement(bloodTypes),
        healthInsuranceId: randomElement(healthInsurances).id,
        insuranceNumber: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
        insuranceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        address: {
          street: 'Rua das Flores',
          number: String(Math.floor(Math.random() * 1000)),
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-000',
          country: 'Brasil',
        },
        emergencyContact: {
          name: 'Contato de Emergência',
          phone: generatePhone(),
          relationship: 'Familiar',
        },
        totalPoints: Math.floor(Math.random() * 2000),
        level: Math.floor(Math.random() * 10) + 1,
        currentStreak: Math.floor(Math.random() * 30),
        longestStreak: Math.floor(Math.random() * 60),
      },
    });

    // Associate with clinic
    const clinicIndex = i % clinics.length;
    await prisma.clinicPatient.upsert({
      where: { clinicId_patientId: { clinicId: clinics[clinicIndex].id, patientId: patient.id } },
      update: {},
      create: {
        clinicId: clinics[clinicIndex].id,
        patientId: patient.id,
        medicalRecord: `MED${String(i + 1).padStart(6, '0')}`,
        isActive: true,
      },
    });

    patients.push(patient);
  }
  console.log(`✅ Created ${patients.length} patients\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Sample Appointments
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📅 Creating sample appointments...');
  const appointmentTypes = Object.values(AppointmentType);
  const appointments = [];

  for (let i = 0; i < 20; i++) {
    const patient = randomElement(patients);
    const doctor = randomElement(doctors);
    const clinic = clinics[i % clinics.length];
    const scheduledDate = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const appointmentType = randomElement(appointmentTypes);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        scheduledDate,
        scheduledTime: scheduledDate,
        duration: 30,
        status: AppointmentStatus.SCHEDULED,
        type: appointmentType,
        isTelemedicine: appointmentType === AppointmentType.TELEMEDICINE,
        reason: 'Consulta de rotina',
      },
    });
    appointments.push(appointment);
  }
  console.log(`✅ Created ${appointments.length} appointments\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Sample Laboratory
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🔬 Creating laboratory...');
  const laboratory = await prisma.laboratory.upsert({
    where: { id: 'default-lab' },
    update: {},
    create: {
      id: 'default-lab',
      name: 'Laboratório HealthFlow',
      cnes: generateCNES(),
      cnpj: generateCNPJ(),
      phone: generatePhone(),
      email: 'laboratorio@healthflow.com.br',
      address: {
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Térreo',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
      active: true,
    },
  });
  console.log(`✅ Laboratory created: ${laboratory.name}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Assign Badges to Patients
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🏅 Assigning badges to patients...');
  let badgeCount = 0;
  for (const patient of patients) {
    // Assign 2-5 random badges
    const numBadges = Math.floor(Math.random() * 4) + 2;
    const selectedBadges = badges.sort(() => Math.random() - 0.5).slice(0, numBadges);

    for (const badge of selectedBadges) {
      try {
        await prisma.patientBadge.create({
          data: {
            patientId: patient.id,
            badgeId: badge.id,
          },
        });
        badgeCount++;
      } catch {
        // Skip if already exists
      }
    }
  }
  console.log(`✅ Assigned ${badgeCount} badges to patients\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Point Transactions
  // ─────────────────────────────────────────────────────────────────────────
  console.log('💰 Creating point transactions...');
  const actions = ['APPOINTMENT_COMPLETED', 'BADGE_EARNED', 'DAILY_LOGIN', 'PROFILE_UPDATE', 'FEEDBACK_GIVEN'];
  let transactionCount = 0;

  for (const patient of patients) {
    const numTransactions = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < numTransactions; i++) {
      await prisma.pointTransaction.create({
        data: {
          patientId: patient.id,
          points: Math.floor(Math.random() * 100) + 10,
          action: randomElement(actions),
          description: 'Pontos ganhos por atividade',
          createdAt: randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()),
        },
      });
      transactionCount++;
    }
  }
  console.log(`✅ Created ${transactionCount} point transactions\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 Database seed completed successfully!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📊 Summary:');
  console.log(`   • Health Insurances: ${healthInsurances.length}`);
  console.log(`   • Badges: ${badges.length}`);
  console.log(`   • Rewards: ${rewards.length}`);
  console.log(`   • Clinics: ${clinics.length}`);
  console.log(`   • Rooms: ${roomCount}`);
  console.log(`   • Doctors: ${doctors.length}`);
  console.log(`   • Patients: ${patients.length}`);
  console.log(`   • Appointments: ${appointments.length}`);
  console.log(`   • Laboratories: 1`);
  console.log(`   • Patient Badges: ${badgeCount}`);
  console.log(`   • Point Transactions: ${transactionCount}`);
  console.log('\n🔑 Default credentials:');
  console.log('   Admin:   admin@healthflow.com.br / admin123');
  console.log('   Doctor:  dr.carlos.eduardo.silva@healthflow.com.br / doctor123');
  console.log('   Patient: maria.aparecida.souza@email.com / patient123');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
