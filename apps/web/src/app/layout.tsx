import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { brand, publicEnv } from '@/config';
import { Providers } from '@/components/Providers';
import { RevealObserver } from '@/components/RevealObserver';
import { ThemePicker } from '@/components/ThemePicker';
import { Toaster } from '@/components/Toaster';
import { ThemeProvider, themeInitScript } from '@/lib/theme';
import { SessionBoot } from '@/modules/auth';
import { EnrollmentBanner, SecurityWatcher } from '@/modules/security';
import './globals.css';

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.tagline,
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Providers>
            <SessionBoot />
            {children}
            <EnrollmentBanner />
            <SecurityWatcher />
          </Providers>
          <Toaster />
          <RevealObserver />
          {publicEnv.showThemePicker && <ThemePicker />}
        </ThemeProvider>
      </body>
    </html>
  );
}
