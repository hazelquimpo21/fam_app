/**
 * ============================================================================
 * 🏠 Root Layout
 * ============================================================================
 *
 * The root layout wraps the entire application.
 * Includes fonts, global styles, and providers.
 *
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

/**
 * Inter font - clean and readable for productivity apps
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

/**
 * App metadata
 */
export const metadata: Metadata = {
  title: 'Fam - Family Command Center',
  description: 'Organize your family life with tasks, habits, goals, and more.',
  icons: {
    icon: '/favicon.ico',
  },
};

/**
 * Root Layout Component
 *
 * Wraps all pages with:
 * - Font configuration
 * - Global providers (React Query, Toasts, etc.)
 * - Base HTML structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
