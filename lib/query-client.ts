/**
 * ============================================================================
 * 🔄 TanStack Query Client Configuration
 * ============================================================================
 *
 * This configures the React Query client with sensible defaults for Fam.
 *
 * TanStack Query handles:
 * - Caching API responses
 * - Background refetching
 * - Loading/error states
 * - Optimistic updates
 *
 * ============================================================================
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Create a new QueryClient with Fam's default configuration
 *
 * These settings are optimized for a family productivity app:
 * - 5 minute stale time (data is "fresh" for 5 minutes)
 * - 30 minute cache time (data is kept in memory for 30 minutes)
 * - Refetch on window focus (get latest data when returning to tab)
 * - 3 retries for failed queries (handle network blips)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered "fresh" for 5 minutes
        // During this time, queries return cached data without refetching
        staleTime: 1000 * 60 * 5, // 5 minutes

        // Data stays in cache for 30 minutes after last use
        // After this, inactive queries are garbage collected
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

        // Retry failed queries 3 times with exponential backoff
        retry: 3,

        // Refetch when window regains focus (user comes back to tab)
        refetchOnWindowFocus: true,

        // Refetch when reconnecting to the internet
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once (for network issues)
        retry: 1,
      },
    },
  });
}

/**
 * React hook to create a stable QueryClient instance
 * Use this in the root layout to avoid creating new clients on re-render
 */
export function useCreateQueryClient() {
  const [queryClient] = useState(() => createQueryClient());
  return queryClient;
}

// Re-export for convenience
export { QueryClient, QueryClientProvider };
