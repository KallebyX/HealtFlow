// ============================================================
// AUTH LAYOUT
// Layout para páginas públicas de autenticação
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    template: '%s | HealthFlow',
    default: 'Autenticacao | HealthFlow',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-foreground/20" />
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-4xl font-bold">H</span>
            </div>
            <span className="text-4xl font-bold">HealthFlow</span>
          </Link>
          <h1 className="text-3xl font-bold text-center mb-4">
            Sistema de Gestao de Saude
          </h1>
          <p className="text-lg text-center text-primary-foreground/80 max-w-md">
            Gerencie sua clinica de forma inteligente. Agendamentos, prontuarios,
            telemedicina e muito mais em uma unica plataforma.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6">
            <FeatureItem
              icon="📅"
              title="Agenda Inteligente"
              description="Gerencie consultas facilmente"
            />
            <FeatureItem
              icon="📋"
              title="Prontuario Digital"
              description="Registros completos e seguros"
            />
            <FeatureItem
              icon="💊"
              title="Receituario Digital"
              description="Prescricoes com assinatura"
            />
            <FeatureItem
              icon="📹"
              title="Telemedicina"
              description="Consultas por video"
            />
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <header className="lg:hidden p-4 flex items-center justify-center border-b bg-card">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
            <span className="text-xl font-bold text-primary">HealthFlow</span>
          </Link>
        </header>

        {/* Form content */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md">{children}</div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-sm text-muted-foreground border-t">
          <p>
            &copy; {new Date().getFullYear()} HealthFlow. Todos os direitos reservados.
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/termos" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            <span>|</span>
            <Link href="/privacidade" className="hover:text-primary transition-colors">
              Privacidade
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-primary-foreground/70">{description}</p>
      </div>
    </div>
  );
}
