/**
 * Root Layout
 * ============
 * Main application layout with fonts, metadata, and providers
 */

import type { Metadata, Viewport } from 'next';
import { Nunito, Nunito_Sans } from 'next/font/google';
import { AuthProvider, QueryProvider } from '@/components/providers';
import { ToastProvider } from '@/components/ui';
import './globals.css';

// Primary font - Nunito for headings and brand text
const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Body font - Nunito Sans for readability
const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito-sans',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'RealmsRPG',
    template: '%s | RealmsRPG',
  },
  description: 'Create and manage your tabletop RPG characters with RealmsRPG',
  keywords: ['RPG', 'tabletop', 'character creator', 'character sheet', 'roleplaying'],
  authors: [{ name: 'RealmsRPG Team' }],
  creator: 'RealmsRPG',
  publisher: 'RealmsRPG',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1a2e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${nunitoSans.variable}`}>
      <head>
        {/* Nova Flat font from Google Fonts (not available in next/font/google) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nova+Flat&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-surface text-on-surface font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
