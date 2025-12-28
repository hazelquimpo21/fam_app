'use client';

/**
 * ============================================================================
 * APP PROVIDERS
 * ============================================================================
 *
 * WHAT THIS FILE DOES:
 * Wraps the app with all necessary React context providers:
 * - TanStack Query (data fetching & caching)
 * - Toast notifications (sonner)
 * - Theme/context providers (future)
 *
 * FUTURE AI DEVELOPERS:
 * - Add new providers here to make them available app-wide
 * - Order matters: outer providers wrap inner ones
 * - The startup log runs once on mount (not on every render)
 *
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useCreateQueryClient } from '@/lib/query-client';
import { logger } from '@/lib/utils/logger';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * App Providers Component
 *
 * Wrap your app with this at the root layout level.
 *
 * @example
 * // In app/layout.tsx
 * <Providers>
 *   {children}
 * </Providers>
 */
export function Providers({ children }: ProvidersProps) {
  // Create a stable QueryClient instance
  const queryClient = useCreateQueryClient();

  // Track if startup has been logged (prevents duplicate logs in React Strict Mode)
  const hasLoggedStartup = useRef(false);

  // Log startup ONCE on mount (useEffect prevents double-logging in Strict Mode)
  useEffect(() => {
    if (!hasLoggedStartup.current) {
      logger.startup('Fam - Family Command Center', '1.0.0');
      hasLoggedStartup.current = true;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Main app content */}
      {children}

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          // Default duration of 4 seconds
          duration: 4000,
          // Custom styling
          classNames: {
            toast: 'bg-white border border-neutral-200 shadow-lg',
            title: 'text-neutral-900 font-medium',
            description: 'text-neutral-500',
            actionButton: 'bg-indigo-600 text-white',
            cancelButton: 'bg-neutral-100 text-neutral-600',
          },
        }}
      />
    </QueryClientProvider>
  );
}
