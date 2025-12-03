'use client';

import * as React from 'react';
import { Sidebar, Header } from '@/components/layout';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-drawer bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-drawer w-64 lg:hidden">
            <Sidebar
              collapsed={false}
              onCollapsedChange={() => setMobileMenuOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'
        )}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
