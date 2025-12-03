'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  FileText,
  TestTubes,
  Video,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Building2,
  Pill,
  Trophy,
  Bell,
  HelpCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Agenda', href: '/agenda', icon: Calendar },
    ],
  },
  {
    title: 'Gestao',
    items: [
      { title: 'Pacientes', href: '/pacientes', icon: Users },
      { title: 'Medicos', href: '/medicos', icon: Stethoscope },
      { title: 'Clinicas', href: '/clinicas', icon: Building2 },
      { title: 'Funcionarios', href: '/funcionarios', icon: UserCog },
    ],
  },
  {
    title: 'Clinico',
    items: [
      { title: 'Consultas', href: '/consultas', icon: FileText },
      { title: 'Prescricoes', href: '/prescricoes', icon: Pill },
      { title: 'Exames', href: '/exames', icon: TestTubes },
      { title: 'Telemedicina', href: '/telemedicina', icon: Video },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { title: 'Faturamento', href: '/faturamento', icon: CreditCard },
      { title: 'Relatorios', href: '/relatorios', icon: BarChart3 },
    ],
  },
  {
    title: 'Engajamento',
    items: [
      { title: 'Gamificacao', href: '/gamificacao', icon: Trophy },
      { title: 'Notificacoes', href: '/notificacoes', icon: Bell },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-drawer h-screen border-r bg-card transition-all duration-300',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar-expanded'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
            <span className="text-xl font-bold text-primary">HealthFlow</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4 py-4">
          {navigation.map((group, index) => (
            <div key={group.title} className="px-3">
              {!collapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h4>
              )}
              {collapsed && index > 0 && <Separator className="mb-2" />}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        item.disabled && 'pointer-events-none opacity-50',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-card p-3">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <Link
              href="/configuracoes"
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === '/configuracoes' && 'bg-primary/10 text-primary'
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Configuracoes</span>
            </Link>
          )}
          {collapsed && (
            <Link
              href="/configuracoes"
              className={cn(
                'mx-auto flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === '/configuracoes' && 'bg-primary/10 text-primary'
              )}
              title="Configuracoes"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(collapsed && 'mx-auto')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
