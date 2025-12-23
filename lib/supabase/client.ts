/**
 * ============================================================================
 * 🔌 Supabase Client (Browser)
 * ============================================================================
 *
 * This creates the Supabase client for use in React components (client-side).
 * Use this for:
 * - Real-time subscriptions
 * - Client-side data fetching
 * - User authentication
 *
 * For server-side operations, use ./server.ts instead.
 *
 * ============================================================================
 */

import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/lib/utils/logger';

/**
 * Get the Supabase URL from environment variables
 * Throws a helpful error if not configured
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════╗
║  ❌ SUPABASE NOT CONFIGURED                                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Missing NEXT_PUBLIC_SUPABASE_URL environment variable!    ║
║                                                            ║
║  To fix this:                                              ║
║  1. Copy .env.example to .env.local                        ║
║  2. Add your Supabase project URL                          ║
║  3. Restart the dev server                                 ║
║                                                            ║
║  Get your URL from:                                        ║
║  https://supabase.com/dashboard → Settings → API           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `;
    console.error(errorMessage);
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  return url;
}

/**
 * Get the Supabase anon key from environment variables
 * Throws a helpful error if not configured
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════╗
║  ❌ SUPABASE NOT CONFIGURED                                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment var!    ║
║                                                            ║
║  To fix this:                                              ║
║  1. Copy .env.example to .env.local                        ║
║  2. Add your Supabase anon key                             ║
║  3. Restart the dev server                                 ║
║                                                            ║
║  Get your key from:                                        ║
║  https://supabase.com/dashboard → Settings → API           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `;
    console.error(errorMessage);
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return key;
}

/**
 * Create the browser-side Supabase client
 *
 * This client is used for:
 * - Authentication (login, logout, etc.)
 * - Real-time subscriptions
 * - Client-side data queries
 *
 * @example
 * const supabase = createClient()
 * const { data } = await supabase.from('tasks').select('*')
 */
export function createClient() {
  logger.debug('Creating Supabase browser client');

  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}

/**
 * Get a singleton Supabase client instance
 * Use this when you need a shared client across components
 */
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!clientInstance) {
    clientInstance = createClient();
    logger.info('Supabase client initialized');
  }
  return clientInstance;
}
