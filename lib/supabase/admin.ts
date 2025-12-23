/**
 * ============================================================================
 * 🔐 Supabase Admin Client
 * ============================================================================
 *
 * Server-only admin client using the service role key.
 * This bypasses Row Level Security and should ONLY be used for:
 * - User creation with auto-confirmation
 * - Admin operations
 * - Background jobs
 *
 * NEVER expose this client to the browser!
 *
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client with service role privileges
 *
 * This client bypasses RLS and should only be used server-side
 * for admin operations like user management.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env.local file. ' +
      'You can find it in your Supabase dashboard under Settings > API.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
