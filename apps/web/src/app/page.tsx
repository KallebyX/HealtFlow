export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Mobile First - Stack vertically on mobile */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400 md:text-5xl lg:text-6xl">
              HealthFlow
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300 md:text-xl">
              Sistema de Gestão de Saúde
            </p>
          </div>

          {/* Status Badge */}
          <div className="mb-8 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            Em Desenvolvimento
          </div>

          {/* Features Grid - Mobile First */}
          <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Prontuário Eletrônico"
              description="Registros médicos completos com estrutura SOAP"
              icon="📋"
            />
            <FeatureCard
              title="Agendamento"
              description="Sistema inteligente de agendamento de consultas"
              icon="📅"
            />
            <FeatureCard
              title="Telemedicina"
              description="Consultas por videochamada integradas"
              icon="📹"
            />
            <FeatureCard
              title="Prescrição Digital"
              description="Receitas digitais com assinatura ICP-Brasil"
              icon="💊"
            />
            <FeatureCard
              title="Gamificação"
              description="Engajamento do paciente com pontos e conquistas"
              icon="🎮"
            />
            <FeatureCard
              title="Integrações"
              description="FHIR, RNDS e convênios médicos"
              icon="🔗"
            />
          </div>

          {/* Tech Stack */}
          <div className="mt-12 text-sm text-slate-500 dark:text-slate-400">
            <p>Construído com Next.js 14, NestJS, PostgreSQL e React Native</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
