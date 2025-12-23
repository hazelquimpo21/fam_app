/**
 * ============================================================================
 * 🖥️ Supabase Server Client
 * ============================================================================
 *
 * This creates Supabase clients for server-side use:
 * - Server Components (RSC)
 * - Server Actions
 * - API Routes
 *
 * These handle cookies automatically for session management.
 *
 * ============================================================================
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for Server Components
 *
 * Use this in:
 * - page.tsx (Server Components)
 * - Server Actions
 * - API Route Handlers
 *
 * @example
 * // In a Server Component
 * const supabase = await createClient()
 * const { data } = await supabase.from('tasks').select('*')
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the current user from a server context
 * Returns null if not authenticated
 *
 * @example
 * const user = await getCurrentUser()
 * if (!user) redirect('/login')
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's session
 * Returns null if no session exists
 *
 * @example
 * const session = await getSession()
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
