// ============================================================
// PUBLIC LAYOUT
// Layout para páginas públicas (Landing, Termos, etc)
// ============================================================

import Link from 'next/link';
import { Button } from '@/components/ui';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
            <span className="text-xl font-bold text-primary">HealthFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#recursos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Recursos
            </Link>
            <Link href="/#planos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Planos
            </Link>
            <Link href="/#contato" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/registro">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">H</span>
                </div>
                <span className="text-xl font-bold text-primary">HealthFlow</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Sistema completo de gestao de saude para clinicas e consultorios medicos.
              </p>
            </div>

            {/* Produto */}
            <div className="space-y-4">
              <h4 className="font-semibold">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/#recursos" className="hover:text-primary transition-colors">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="/#planos" className="hover:text-primary transition-colors">
                    Planos e precos
                  </Link>
                </li>
                <li>
                  <Link href="/documentacao" className="hover:text-primary transition-colors">
                    Documentacao
                  </Link>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div className="space-y-4">
              <h4 className="font-semibold">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/sobre" className="hover:text-primary transition-colors">
                    Sobre nos
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/#contato" className="hover:text-primary transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/termos" className="hover:text-primary transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:text-primary transition-colors">
                    Politica de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/lgpd" className="hover:text-primary transition-colors">
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} HealthFlow. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
