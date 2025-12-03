import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'HealthFlow - Sistema de Gestao de Saude',
    template: '%s | HealthFlow',
  },
  description: 'Sistema completo de gestao de saude para clinicas e consultorios medicos',
  keywords: [
    'gestao de saude',
    'clinica medica',
    'prontuario eletronico',
    'telemedicina',
    'agendamento medico',
    'receituario digital',
    'RNDS',
    'FHIR',
  ],
  authors: [{ name: 'HealthFlow' }],
  creator: 'HealthFlow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'HealthFlow',
    title: 'HealthFlow - Sistema de Gestao de Saude',
    description: 'Sistema completo de gestao de saude para clinicas e consultorios medicos',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
