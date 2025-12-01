# HEALTHFLOW - ULTRA AGENT SYSTEM - PARTE 6
## Frontend Web, Mobile App, Infraestrutura DevOps, Testes E2E e Deploy Production

---

## FASE 11: FRONTEND WEB [Dias 176-210]

### 11.1 ESTRUTURA DO PROJETO REACT

#### PROMPT 11.1.1: Setup do Projeto Frontend
```typescript
CRIAR ESTRUTURA: /healthflow/apps/web/

// Estrutura de pastas
apps/web/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/            # Grupo de rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/       # Grupo de rotas autenticadas
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── consultations/
│   │   │   ├── prescriptions/
│   │   │   ├── telemedicine/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/               # API Routes
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # Componentes base (shadcn/ui)
│   │   ├── forms/             # Formulários
│   │   ├── tables/            # Tabelas de dados
│   │   ├── charts/            # Gráficos
│   │   ├── modals/            # Modais
│   │   ├── layouts/           # Layouts
│   │   └── features/          # Componentes de feature
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilitários
│   │   ├── api.ts             # Cliente API
│   │   ├── auth.ts            # Autenticação
│   │   └── utils.ts           # Helpers
│   ├── providers/             # Context providers
│   ├── stores/                # Zustand stores
│   ├── types/                 # TypeScript types
│   └── styles/                # Estilos globais
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

```json
CRIAR ARQUIVO: /healthflow/apps/web/package.json

{
  "name": "@healthflow/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@tanstack/react-query": "^5.28.0",
    "@tanstack/react-table": "^8.15.0",
    "zustand": "^4.5.2",
    "axios": "^1.6.8",
    "date-fns": "^3.6.0",
    "dayjs": "^1.11.10",
    "zod": "^3.22.4",
    "react-hook-form": "^7.51.2",
    "@hookform/resolvers": "^3.3.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.2",
    "lucide-react": "^0.365.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "recharts": "^2.12.4",
    "react-big-calendar": "^1.11.5",
    "react-dropzone": "^14.2.3",
    "sonner": "^1.4.41",
    "cmdk": "^1.0.0",
    "next-themes": "^0.3.0",
    "nuqs": "^1.17.1",
    "socket.io-client": "^4.7.5",
    "@livekit/components-react": "^2.1.1",
    "livekit-client": "^2.1.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/react-big-calendar": "^1.8.9",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "14.2.0"
  }
}
```

---

### 11.2 CLIENTE API E AUTENTICAÇÃO

#### PROMPT 11.2.1: Cliente API com Interceptors
```typescript
CRIAR ARQUIVO: /healthflow/apps/web/src/lib/api.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Criar instância do Axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request - adicionar token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = await getSession();
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - tratar erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Token expirado - tentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const session = await getSession();
        
        if (session?.refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: session.refreshToken,
          });

          const { accessToken, refreshToken } = response.data;
          
          // Atualizar tokens na sessão
          await updateSession({ accessToken, refreshToken });

          // Repetir request original
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh falhou - fazer logout
        await signOut();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Tratar outros erros
    if (error.response?.status === 403) {
      // Sem permissão
      console.error('Acesso negado');
    }

    if (error.response?.status === 500) {
      // Erro do servidor
      console.error('Erro interno do servidor');
    }

    return Promise.reject(error);
  }
);

// Helpers para requests
export const apiGet = <T>(url: string, params?: object) =>
  api.get<T>(url, { params }).then((res) => res.data);

export const apiPost = <T>(url: string, data?: object) =>
  api.post<T>(url, data).then((res) => res.data);

export const apiPut = <T>(url: string, data?: object) =>
  api.put<T>(url, data).then((res) => res.data);

export const apiPatch = <T>(url: string, data?: object) =>
  api.patch<T>(url, data).then((res) => res.data);

export const apiDelete = <T>(url: string) =>
  api.delete<T>(url).then((res) => res.data);

export default api;
```

---

### 11.3 STORES ZUSTAND

#### PROMPT 11.3.1: Stores de Estado Global
```typescript
CRIAR ARQUIVO: /healthflow/apps/web/src/stores/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  
  // Getters
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken, isAuthenticated: true }),
      
      clearAuth: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
      
      setLoading: (isLoading) => set({ isLoading }),

      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        // TODO: Implementar sistema de permissões
        return true;
      },
    }),
    {
      name: 'healthflow-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

```typescript
CRIAR ARQUIVO: /healthflow/apps/web/src/stores/appointment.store.ts

import { create } from 'zustand';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { apiGet, apiPost, apiPut } from '@/lib/api';

interface AppointmentFilters {
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  isTelemedicine?: boolean;
}

interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  filters: AppointmentFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  createAppointment: (data: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string, reason: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string, reason: string) => Promise<void>;
  checkIn: (id: string, data: any) => Promise<void>;
  setFilters: (filters: AppointmentFilters) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  clearError: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  selectedAppointment: null,
  filters: {},
  isLoading: false,
  error: null,

  fetchAppointments: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = filters || get().filters;
      const response = await apiGet<{ data: Appointment[]; total: number }>('/appointments', params);
      set({ appointments: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const appointment = await apiGet<Appointment>(`/appointments/${id}`);
      set({ selectedAppointment: appointment, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createAppointment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const appointment = await apiPost<Appointment>('/appointments', data);
      set((state) => ({
        appointments: [...state.appointments, appointment],
        isLoading: false,
      }));
      return appointment;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateAppointment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiPut<Appointment>(`/appointments/${id}`, data);
      set((state) => ({
        appointments: state.appointments.map((a) => (a.id === id ? updated : a)),
        selectedAppointment: state.selectedAppointment?.id === id ? updated : state.selectedAppointment,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelAppointment: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await apiPost(`/appointments/${id}/cancel`, { reason });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, status: 'CANCELLED' as AppointmentStatus } : a
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rescheduleAppointment: async (id, newDate, newTime, reason) => {
    set({ isLoading: true, error: null });
    try {
      const rescheduled = await apiPost<Appointment>(`/appointments/${id}/reschedule`, {
        newDate,
        newTime,
        reason,
      });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, status: 'RESCHEDULED' as AppointmentStatus } : a
        ).concat(rescheduled),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  checkIn: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiPost<Appointment>(`/appointments/${id}/check-in`, data);
      set((state) => ({
        appointments: state.appointments.map((a) => (a.id === id ? updated : a)),
        selectedAppointment: state.selectedAppointment?.id === id ? updated : state.selectedAppointment,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setFilters: (filters) => set({ filters }),
  setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),
  clearError: () => set({ error: null }),
}));
```

---

### 11.4 COMPONENTES DE DASHBOARD

#### PROMPT 11.4.1: Dashboard Principal
```typescript
CRIAR ARQUIVO: /healthflow/apps/web/src/app/(dashboard)/dashboard/page.tsx

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  AlertCircle,
  Video,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/features/dashboard/stats-card';
import { AppointmentsList } from '@/components/features/dashboard/appointments-list';
import { RecentPatients } from '@/components/features/dashboard/recent-patients';
import { AnalyticsChart } from '@/components/features/dashboard/analytics-chart';
import { WaitingRoom } from '@/components/features/dashboard/waiting-room';
import { useAuthStore } from '@/stores/auth.store';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface DashboardMetrics {
  appointments: {
    today: number;
    week: number;
    month: number;
    pendingConfirmation: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    activeToday: number;
  };
  consultations: {
    completedToday: number;
    avgDuration: number;
  };
  revenue: {
    today: number;
    month: number;
    growth: number;
  };
  waitingRoom: Array<{
    id: string;
    patientName: string;
    waitingTime: number;
    triageLevel: string;
  }>;
  todayAppointments: any[];
  recentPatients: any[];
  chartData: any[];
}

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiGet<DashboardMetrics>('/analytics/dashboard'),
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isDoctor = hasRole(['DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN']);
  const isReceptionist = hasRole(['RECEPTIONIST']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.patient?.socialName || user?.doctor?.fullName?.split(' ')[0]}!
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Consultas Hoje"
          value={metrics?.appointments.today || 0}
          description={`${metrics?.consultations.completedToday || 0} concluídas`}
          icon={Calendar}
          trend={metrics?.appointments.today > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="Pacientes Ativos"
          value={metrics?.patients.activeToday || 0}
          description={`${metrics?.patients.newThisMonth || 0} novos este mês`}
          icon={Users}
          trend="up"
        />
        {isDoctor && (
          <StatsCard
            title="Faturamento Mês"
            value={formatCurrency(metrics?.revenue.month || 0)}
            description={`${metrics?.revenue.growth > 0 ? '+' : ''}${metrics?.revenue.growth.toFixed(1)}% vs mês anterior`}
            icon={TrendingUp}
            trend={metrics?.revenue.growth > 0 ? 'up' : 'down'}
          />
        )}
        <StatsCard
          title="Tempo Médio"
          value={`${metrics?.consultations.avgDuration || 0} min`}
          description="Duração das consultas"
          icon={Activity}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Consultas de Hoje */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consultas de Hoje
            </CardTitle>
            <CardDescription>
              Sua agenda para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentsList 
              appointments={metrics?.todayAppointments || []} 
              showActions={isDoctor || isReceptionist}
            />
          </CardContent>
        </Card>

        {/* Sala de Espera */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sala de Espera
              {metrics?.waitingRoom?.length > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {metrics.waitingRoom.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Pacientes aguardando atendimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WaitingRoom patients={metrics?.waitingRoom || []} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Consultas */}
        <Card>
          <CardHeader>
            <CardTitle>Consultas por Semana</CardTitle>
            <CardDescription>
              Evolução das últimas 4 semanas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={metrics?.chartData || []} />
          </CardContent>
        </Card>

        {/* Pacientes Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pacientes Recentes</CardTitle>
            <CardDescription>
              Últimos pacientes atendidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentPatients patients={metrics?.recentPatients || []} />
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {metrics?.appointments.pendingConfirmation > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-600">
                {metrics.appointments.pendingConfirmation} consultas aguardando confirmação
              </p>
              <p className="text-sm text-muted-foreground">
                Confirme as consultas para enviar lembretes aos pacientes
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="h-96 animate-pulse rounded-lg bg-muted lg:col-span-4" />
        <div className="h-96 animate-pulse rounded-lg bg-muted lg:col-span-3" />
      </div>
    </div>
  );
}
```

---

### 11.5 MÓDULO DE TELEMEDICINA WEB

#### PROMPT 11.5.1: Componente de Videochamada
```typescript
CRIAR ARQUIVO: /healthflow/apps/web/src/components/features/telemedicine/video-room.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
  Chat,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  MessageSquare,
  Users,
  Settings,
  Share2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConsultationNotes } from './consultation-notes';
import { PrescriptionPanel } from './prescription-panel';
import { PatientInfo } from './patient-info';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api';

interface VideoRoomProps {
  sessionId: string;
  token: string;
  roomUrl: string;
  role: 'host' | 'participant';
  patientData?: any;
  onEnd?: () => void;
}

export function VideoRoom({
  sessionId,
  token,
  roomUrl,
  role,
  patientData,
  onEnd,
}: VideoRoomProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'notes' | 'prescription' | 'patient'>('notes');
  const [consultationData, setConsultationData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const handleEndCall = async () => {
    try {
      await apiPost(`/telemedicine/${sessionId}/end`, {
        notes: consultationData,
      });
      
      toast({
        title: 'Consulta encerrada',
        description: 'A sessão foi finalizada com sucesso.',
      });
      
      onEnd?.();
    } catch (error) {
      toast({
        title: 'Erro ao encerrar',
        description: 'Não foi possível encerrar a sessão.',
        variant: 'destructive',
      });
    }
  };

  const handleScreenShare = async () => {
    // Implementar compartilhamento de tela
    toast({
      title: 'Compartilhamento de tela',
      description: 'Funcionalidade em desenvolvimento.',
    });
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={roomUrl}
          connectOptions={{ autoSubscribe: true }}
          onConnected={() => setIsConnected(true)}
          onDisconnected={handleDisconnect}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
          
          {/* Custom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-2">
              <ControlBar 
                variation="minimal" 
                controls={{
                  microphone: true,
                  camera: true,
                  screenShare: true,
                  leave: false,
                }}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              
              {role === 'host' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsPanelOpen(true)}
                >
                  <FileText className="h-5 w-5" />
                </Button>
              )}
              
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Chat Panel */}
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent side="right" className="w-80 p-0">
              <Chat />
            </SheetContent>
          </Sheet>
        </LiveKitRoom>
      </div>

      {/* Side Panel (Doctor Only) */}
      {role === 'host' && isPanelOpen && (
        <div className="w-96 bg-white dark:bg-slate-800 border-l overflow-hidden flex flex-col">
          <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as any)} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b px-2">
              <TabsTrigger value="patient" className="gap-2">
                <Users className="h-4 w-4" />
                Paciente
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="h-4 w-4" />
                SOAP
              </TabsTrigger>
              <TabsTrigger value="prescription" className="gap-2">
                <FileText className="h-4 w-4" />
                Prescrição
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="patient" className="flex-1 overflow-auto p-4 mt-0">
              <PatientInfo patient={patientData} />
            </TabsContent>
            
            <TabsContent value="notes" className="flex-1 overflow-auto p-4 mt-0">
              <ConsultationNotes
                data={consultationData}
                onChange={setConsultationData}
              />
            </TabsContent>
            
            <TabsContent value="prescription" className="flex-1 overflow-auto p-4 mt-0">
              <PrescriptionPanel
                patientId={patientData?.id}
                sessionId={sessionId}
              />
            </TabsContent>
          </Tabs>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPanelOpen(false)}
              className="w-full"
            >
              Fechar painel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## FASE 12: MOBILE APP [Dias 211-245]

### 12.1 ESTRUTURA REACT NATIVE

#### PROMPT 12.1.1: Setup do Projeto Mobile
```typescript
CRIAR ESTRUTURA: /healthflow/apps/mobile/

// Estrutura de pastas
apps/mobile/
├── app/                        # Expo Router
│   ├── (auth)/                # Rotas de autenticação
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                # Tab Navigator principal
│   │   ├── index.tsx          # Home/Dashboard
│   │   ├── appointments.tsx   # Agendamentos
│   │   ├── health.tsx         # Saúde (sinais vitais, avatar)
│   │   ├── tasks.tsx          # Tarefas de gamificação
│   │   ├── profile.tsx        # Perfil
│   │   └── _layout.tsx
│   ├── appointment/[id].tsx   # Detalhes do agendamento
│   ├── consultation/[id].tsx  # Consulta/Telemedicina
│   ├── prescription/[id].tsx  # Prescrição
│   ├── _layout.tsx            # Root layout
│   └── +not-found.tsx
├── components/
│   ├── ui/                    # Componentes base
│   ├── features/              # Componentes de feature
│   └── navigation/            # Componentes de navegação
├── hooks/                     # Custom hooks
├── lib/                       # Utilitários
├── stores/                    # Zustand stores
├── types/                     # TypeScript types
├── assets/                    # Imagens, fontes
├── app.json
├── package.json
└── tsconfig.json
```

```json
CRIAR ARQUIVO: /healthflow/apps/mobile/package.json

{
  "name": "@healthflow/mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.1",
    "expo-font": "~12.0.5",
    "expo-splash-screen": "~0.27.5",
    "expo-secure-store": "~13.0.1",
    "expo-notifications": "~0.28.0",
    "expo-device": "~6.0.2",
    "expo-haptics": "~13.0.1",
    "expo-image-picker": "~15.0.5",
    "expo-camera": "~15.0.9",
    "expo-av": "~14.0.5",
    "expo-linking": "~6.3.1",
    "expo-updates": "~0.25.14",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "react-native-reanimated": "~3.10.1",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-safe-area-context": "4.10.1",
    "react-native-screens": "3.31.1",
    "react-native-svg": "15.2.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.2",
    "axios": "^1.6.8",
    "date-fns": "^3.6.0",
    "react-hook-form": "^7.51.2",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "nativewind": "^4.0.1",
    "tailwindcss": "^3.4.3",
    "@expo/vector-icons": "^14.0.0",
    "react-native-calendars": "^1.1304.1",
    "lottie-react-native": "6.7.0",
    "@livekit/react-native": "^2.0.0",
    "@livekit/react-native-webrtc": "^118.0.0",
    "socket.io-client": "^4.7.5"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "typescript": "~5.3.3",
    "eslint": "^8.57.0",
    "eslint-config-expo": "~7.1.2"
  }
}
```

---

### 12.2 TELA DE GAMIFICAÇÃO MOBILE

#### PROMPT 12.2.1: Tela de Tarefas e Gamificação
```typescript
CRIAR ARQUIVO: /healthflow/apps/mobile/app/(tabs)/tasks.tsx

import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { 
  Check, 
  Trophy, 
  Flame, 
  Star,
  Pill,
  Heart,
  Activity,
  Target,
} from 'lucide-react-native';
import { apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TaskCard } from '@/components/features/gamification/task-card';
import { AchievementBadge } from '@/components/features/gamification/achievement-badge';
import { StreakCard } from '@/components/features/gamification/streak-card';

interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
}

interface GamificationData {
  points: number;
  level: number;
  levelName: string;
  currentStreak: number;
  longestStreak: number;
  pointsToNextLevel: number;
  progress: number;
  todayTasks: Task[];
  recentBadges: any[];
}

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Animações
  const pointsScale = useSharedValue(1);
  const animatedPointsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointsScale.value }],
  }));

  // Buscar dados de gamificação
  const { data, isLoading } = useQuery({
    queryKey: ['gamification', user?.patientId],
    queryFn: () => apiGet<GamificationData>(`/gamification/patient/${user?.patientId}`),
  });

  // Mutation para completar tarefa
  const completeMutation = useMutation({
    mutationFn: (taskId: string) => 
      apiPost(`/gamification/tasks/${taskId}/complete`),
    onSuccess: () => {
      // Animação de pontos
      pointsScale.value = withSpring(1.2, {}, () => {
        pointsScale.value = withSpring(1);
      });
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['gamification'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleCompleteTask = (taskId: string) => {
    completeMutation.mutate(taskId);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'MEDICATION':
        return Pill;
      case 'VITAL_SIGNS':
        return Heart;
      case 'EXERCISE':
        return Activity;
      default:
        return Target;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('@/assets/animations/loading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </View>
      </SafeAreaView>
    );
  }

  const completedTasks = data?.todayTasks.filter(t => t.status === 'COMPLETED').length || 0;
  const totalTasks = data?.todayTasks.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header com pontos */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          style={styles.header}
        >
          <View style={styles.levelBadge}>
            <Trophy size={24} color="#FFD700" />
            <Text style={styles.levelText}>Nível {data?.level}</Text>
            <Text style={styles.levelName}>{data?.levelName}</Text>
          </View>
          
          <Animated.View style={[styles.pointsContainer, animatedPointsStyle]}>
            <Star size={32} color="#FFD700" fill="#FFD700" />
            <Text style={styles.pointsText}>{data?.points.toLocaleString()}</Text>
            <Text style={styles.pointsLabel}>pontos</Text>
          </Animated.View>
          
          {/* Progress to next level */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Próximo nível</Text>
              <Text style={styles.progressValue}>
                {data?.pointsToNextLevel} pts restantes
              </Text>
            </View>
            <ProgressBar 
              progress={data?.progress || 0} 
              color="#10B981"
              height={8}
            />
          </View>
        </Animated.View>

        {/* Streak Card */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <StreakCard
            currentStreak={data?.currentStreak || 0}
            longestStreak={data?.longestStreak || 0}
          />
        </Animated.View>

        {/* Tarefas do Dia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Missões de Hoje</Text>
            <Text style={styles.sectionSubtitle}>
              {completedTasks}/{totalTasks} concluídas
            </Text>
          </View>

          {data?.todayTasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInRight.delay(300 + index * 100)}
            >
              <TaskCard
                task={task}
                icon={getTaskIcon(task.type)}
                onComplete={() => handleCompleteTask(task.id)}
                isLoading={
                  completeMutation.isPending && 
                  completeMutation.variables === task.id
                }
              />
            </Animated.View>
          ))}

          {totalTasks === completedTasks && totalTasks > 0 && (
            <View style={styles.allCompletedContainer}>
              <LottieView
                source={require('@/assets/animations/celebration.json')}
                autoPlay
                loop={false}
                style={styles.celebrationAnimation}
              />
              <Text style={styles.allCompletedText}>
                🎉 Parabéns! Todas as missões concluídas!
              </Text>
            </View>
          )}
        </View>

        {/* Conquistas Recentes */}
        {data?.recentBadges && data.recentBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conquistas Recentes</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesContainer}
            >
              {data.recentBadges.map((badge, index) => (
                <Animated.View
                  key={badge.id}
                  entering={FadeInRight.delay(400 + index * 100)}
                >
                  <AchievementBadge badge={badge} />
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  levelName: {
    color: '#93C5FD',
    fontSize: 14,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
  },
  pointsLabel: {
    color: '#93C5FD',
    fontSize: 16,
    marginTop: 8,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#93C5FD',
    fontSize: 14,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  badgesContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  allCompletedContainer: {
    alignItems: 'center',
    padding: 24,
  },
  celebrationAnimation: {
    width: 150,
    height: 150,
  },
  allCompletedText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10B981',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});
```

---

## FASE 13: INFRAESTRUTURA E DEVOPS [Dias 246-266]

### 13.1 DOCKER E KUBERNETES

#### PROMPT 13.1.1: Configuração Docker Completa
```yaml
CRIAR ARQUIVO: /healthflow/docker-compose.yml

version: '3.8'

services:
  # API Backend
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: healthflow-api
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://healthflow:${DB_PASSWORD}@postgres:5432/healthflow
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - healthflow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: healthflow-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=healthflow
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=healthflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init:/docker-entrypoint-initdb.d
    networks:
      - healthflow-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U healthflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: healthflow-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - healthflow-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FHIR Server (HAPI FHIR)
  fhir:
    image: hapiproject/hapi:v6.10.1
    container_name: healthflow-fhir
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - spring.datasource.url=jdbc:postgresql://postgres:5432/fhir
      - spring.datasource.username=healthflow
      - spring.datasource.password=${DB_PASSWORD}
      - hapi.fhir.fhir_version=R4
    depends_on:
      - postgres
    networks:
      - healthflow-network

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    container_name: healthflow-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - healthflow-network

  # Web Frontend
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: healthflow-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001/api
    depends_on:
      - api
    networks:
      - healthflow-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: healthflow-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api
      - web
    networks:
      - healthflow-network

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  healthflow-network:
    driver: bridge
```

```dockerfile
CRIAR ARQUIVO: /healthflow/apps/api/Dockerfile

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat openssl

# Copiar arquivos de configuração
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY apps/api ./apps/api
COPY packages ./packages

# Gerar Prisma Client
RUN cd apps/api && npx prisma generate

# Build
RUN npm run build --filter=@healthflow/api

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Instalar apenas dependências de produção
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/api/package*.json ./apps/api/
RUN npm ci --only=production --ignore-scripts

# Copiar build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Definir permissões
RUN chown -R nestjs:nodejs /app
USER nestjs

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Iniciar aplicação
CMD ["node", "apps/api/dist/main.js"]
```

---

### 13.2 KUBERNETES MANIFESTS

#### PROMPT 13.2.1: Deployment Kubernetes
```yaml
CRIAR ARQUIVO: /healthflow/infrastructure/k8s/api-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthflow-api
  namespace: healthflow
  labels:
    app: healthflow-api
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: healthflow-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: healthflow-api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3001"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: healthflow-api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: api
          image: healthflow/api:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3001
              protocol: TCP
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: healthflow-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: healthflow-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: healthflow-secrets
                  key: jwt-secret
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: healthflow-api-config
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - healthflow-api
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: healthflow-api
  namespace: healthflow
spec:
  type: ClusterIP
  selector:
    app: healthflow-api
  ports:
    - port: 80
      targetPort: 3001
      protocol: TCP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: healthflow-api-hpa
  namespace: healthflow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: healthflow-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## FASE 14: TESTES E2E [Dias 267-280]

### 14.1 TESTES E2E COM PLAYWRIGHT

#### PROMPT 14.1.1: Testes E2E Completos
```typescript
CRIAR ARQUIVO: /healthflow/apps/web/tests/e2e/auth.spec.ts

import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('button', { name: /entrar/i }).click();
    
    await expect(page.getByText(/email é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/senha é obrigatória/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('invalid@email.com');
    await page.getByLabel(/senha/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Usar credenciais de teste
    await page.getByLabel(/email/i).fill('doctor@healthflow.test');
    await page.getByLabel(/senha/i).fill('Test@123456');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verificar elementos do dashboard
    await expect(page.getByText(/bem-vindo/i)).toBeVisible();
  });

  test('should handle 2FA flow', async ({ page }) => {
    await page.goto('/login');
    
    // Login com usuário que tem 2FA
    await page.getByLabel(/email/i).fill('doctor-2fa@healthflow.test');
    await page.getByLabel(/senha/i).fill('Test@123456');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Verificar tela de 2FA
    await expect(page.getByText(/verificação em duas etapas/i)).toBeVisible();
    await expect(page.getByLabel(/código/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login primeiro
    await loginAsDoctor(page);
    
    // Clicar no menu do usuário
    await page.getByTestId('user-menu').click();
    await page.getByRole('menuitem', { name: /sair/i }).click();
    
    // Verificar redirecionamento para login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Appointment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
  });

  test('should create new appointment', async ({ page }) => {
    await page.goto('/appointments/new');
    
    // Selecionar paciente
    await page.getByLabel(/paciente/i).click();
    await page.getByRole('option', { name: /joão silva/i }).click();
    
    // Selecionar data e hora
    await page.getByLabel(/data/i).fill('2024-03-20');
    await page.getByLabel(/horário/i).click();
    await page.getByRole('option', { name: '09:00' }).click();
    
    // Selecionar tipo de consulta
    await page.getByLabel(/tipo/i).click();
    await page.getByRole('option', { name: /primeira consulta/i }).click();
    
    // Criar agendamento
    await page.getByRole('button', { name: /agendar/i }).click();
    
    // Verificar sucesso
    await expect(page.getByText(/agendamento criado/i)).toBeVisible();
  });

  test('should display appointments calendar', async ({ page }) => {
    await page.goto('/appointments');
    
    await expect(page.getByRole('heading', { name: /agenda/i })).toBeVisible();
    
    // Verificar que o calendário está visível
    await expect(page.getByTestId('calendar')).toBeVisible();
    
    // Verificar navegação de mês
    await page.getByRole('button', { name: /próximo mês/i }).click();
    await page.getByRole('button', { name: /mês anterior/i }).click();
  });

  test('should check-in patient', async ({ page }) => {
    // Ir para agendamento existente
    await page.goto('/appointments/test-appointment-id');
    
    // Clicar em check-in
    await page.getByRole('button', { name: /check-in/i }).click();
    
    // Preencher triagem
    await page.getByLabel(/pressão arterial/i).fill('120/80');
    await page.getByLabel(/temperatura/i).fill('36.5');
    await page.getByLabel(/queixa principal/i).fill('Dor de cabeça há 2 dias');
    
    // Confirmar check-in
    await page.getByRole('button', { name: /confirmar/i }).click();
    
    // Verificar sucesso
    await expect(page.getByText(/check-in realizado/i)).toBeVisible();
    await expect(page.getByText(/senha:/i)).toBeVisible();
  });
});

test.describe('Consultation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
  });

  test('should create consultation with SOAP notes', async ({ page }) => {
    // Ir para consulta de um agendamento
    await page.goto('/consultations/new?appointmentId=test-appointment-id');
    
    // Preencher Subjetivo
    await page.getByLabel(/queixa principal/i).fill('Cefaleia intensa há 3 dias');
    await page.getByLabel(/história da doença/i).fill('Paciente refere dor de cabeça iniciada há 3 dias...');
    
    // Preencher Objetivo
    await page.getByRole('tab', { name: /objetivo/i }).click();
    await page.getByLabel(/pressão arterial/i).fill('130/85');
    await page.getByLabel(/frequência cardíaca/i).fill('78');
    
    // Preencher Avaliação
    await page.getByRole('tab', { name: /avaliação/i }).click();
    await page.getByLabel(/código cid/i).fill('G43.9');
    await page.getByRole('button', { name: /adicionar diagnóstico/i }).click();
    
    // Preencher Plano
    await page.getByRole('tab', { name: /plano/i }).click();
    await page.getByRole('checkbox', { name: /gerar prescrição/i }).check();
    
    // Salvar consulta
    await page.getByRole('button', { name: /salvar/i }).click();
    
    // Verificar sucesso
    await expect(page.getByText(/consulta salva/i)).toBeVisible();
  });

  test('should finalize and sign consultation', async ({ page }) => {
    // Ir para consulta em andamento
    await page.goto('/consultations/test-consultation-id');
    
    // Finalizar consulta
    await page.getByRole('button', { name: /finalizar/i }).click();
    
    // Confirmar assinatura digital
    await expect(page.getByText(/assinatura digital/i)).toBeVisible();
    await page.getByRole('button', { name: /assinar e finalizar/i }).click();
    
    // Verificar sucesso
    await expect(page.getByText(/consulta finalizada/i)).toBeVisible();
  });
});

// Helper functions
async function loginAsDoctor(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('doctor@healthflow.test');
  await page.getByLabel(/senha/i).fill('Test@123456');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/.*dashboard/);
}

async function loginAsPatient(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('patient@healthflow.test');
  await page.getByLabel(/senha/i).fill('Test@123456');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/.*dashboard/);
}
```

---

## CICLO FINAL DE VALIDAÇÃO

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              VALIDAÇÃO FINAL - SISTEMA HEALTHFLOW COMPLETO                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  BACKEND API (NestJS)                                                        ║
║  □ Todos os módulos implementados e testados                                 ║
║  □ Autenticação JWT + 2FA                                                    ║
║  □ Autorização RBAC                                                          ║
║  □ Auditoria completa                                                        ║
║  □ Integração FHIR/RNDS                                                      ║
║  □ Swagger documentation                                                     ║
║  □ Coverage > 80%                                                            ║
║                                                                              ║
║  FRONTEND WEB (Next.js)                                                      ║
║  □ Dashboard completo                                                        ║
║  □ Módulo de agendamento                                                     ║
║  □ Módulo de consultas (SOAP)                                                ║
║  □ Módulo de prescrições                                                     ║
║  □ Telemedicina (LiveKit)                                                    ║
║  □ Responsivo e acessível                                                    ║
║                                                                              ║
║  MOBILE APP (React Native)                                                   ║
║  □ Fluxo de autenticação                                                     ║
║  □ Dashboard do paciente                                                     ║
║  □ Gamificação completa                                                      ║
║  □ Sinais vitais e avatar 3D                                                 ║
║  □ Telemedicina mobile                                                       ║
║  □ Push notifications                                                        ║
║                                                                              ║
║  INFRAESTRUTURA                                                              ║
║  □ Docker Compose funcional                                                  ║
║  □ Kubernetes manifests                                                      ║
║  □ CI/CD pipeline (GitHub Actions)                                           ║
║  □ Monitoramento (Prometheus/Grafana)                                        ║
║  □ Logging centralizado                                                      ║
║                                                                              ║
║  CONFORMIDADE                                                                ║
║  □ LGPD by design                                                            ║
║  □ CFM 2.299/2021 e 2.314/2022                                               ║
║  □ SBIS NGS1/NGS2                                                            ║
║  □ ANVISA Portaria 344                                                       ║
║  □ HL7 FHIR R4                                                               ║
║                                                                              ║
║  COMANDOS DE DEPLOY:                                                         ║
║  1. npm run lint (todos os projetos)                                         ║
║  2. npm run test -- --coverage                                               ║
║  3. npm run test:e2e                                                         ║
║  4. npm run build                                                            ║
║  5. docker-compose up --build                                                ║
║  6. kubectl apply -f infrastructure/k8s/                                     ║
║                                                                              ║
║  SE TUDO OK → DEPLOY PARA PRODUÇÃO                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

# FIM DO ULTRA AGENT SYSTEM

## Resumo Final

Este documento contém a especificação completa para desenvolvimento do sistema HEALTHFLOW, incluindo:

1. **Parte 1**: Fundação do projeto e módulo de autenticação
2. **Parte 2**: Auth Service e Controller completos
3. **Parte 3**: Módulos de Pacientes e Agendamento
4. **Parte 4**: Consultas, Prescrições, Gamificação e Telemedicina
5. **Parte 5**: Notificações, Integrações FHIR/RNDS, Analytics
6. **Parte 6**: Frontend Web, Mobile, Infraestrutura, Testes E2E, Deploy

Total estimado: **50.000+ linhas de código** seguindo padrões enterprise multinacionais.

**Stack Completa:**
- Backend: NestJS, PostgreSQL, Redis, Prisma
- Frontend: Next.js 14, React 18, TailwindCSS
- Mobile: React Native, Expo
- Infra: Docker, Kubernetes, AWS
- Integrações: FHIR R4, RNDS, CFM, ANVISA, Firebase, Stripe
