'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Bell,
  Moon,
  Sun,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
  HelpCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMobileMenuToggle?: () => void;
}

export function Header({ sidebarCollapsed, onMobileMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = React.useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-sticky flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/60',
        sidebarCollapsed ? 'lg:pl-[calc(4.5rem+1rem)]' : 'lg:pl-[calc(16rem+1rem)]'
      )}
    >
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </Button>

      {/* Search */}
      <div className="hidden flex-1 items-center gap-4 lg:flex">
        <div className="relative w-full max-w-md">
          <Input
            type="search"
            placeholder="Buscar pacientes, consultas..."
            className="pl-10"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Mobile Search Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setShowSearch(!showSearch)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
          <span className="sr-only">Notificacoes</span>
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Ajuda</span>
        </Button>

        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-medium">Dr. Carlos Silva</span>
            <span className="text-xs text-muted-foreground">Administrador</span>
          </div>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatars/01.png" alt="Avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                CS
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="absolute inset-x-0 top-16 border-b bg-background p-4 lg:hidden">
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full"
            icon={<Search className="h-4 w-4" />}
            autoFocus
          />
        </div>
      )}
    </header>
  );
}
