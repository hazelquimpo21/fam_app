'use client';

/**
 * ============================================================================
 * Admin Hook
 * ============================================================================
 *
 * Hook for checking admin status.
 * Admins have access to additional features like cache clearing for testing.
 *
 * ============================================================================
 */

import { useAuth } from './use-auth';

/**
 * List of admin email addresses
 * Only these users will have access to the admin area
 */
const ADMIN_EMAILS = ['hazel.quimpo@gmail.com'];

/**
 * Check if an email is an admin email
 * @param email - Email to check
 * @returns true if the email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * useAdmin Hook
 *
 * Returns whether the current user is an admin.
 * Admins have access to special features like clearing cache for testing.
 *
 * @returns Object with isAdmin boolean and loading state
 *
 * @example
 * function AdminPanel() {
 *   const { isAdmin, isLoading } = useAdmin()
 *
 *   if (!isAdmin) return null
 *
 *   return <div>Admin Panel</div>
 * }
 */
export function useAdmin() {
  const { user, familyMember, authState } = useAuth();

  const isLoading = authState === 'loading';
  const email = user?.email || familyMember?.email;
  const isAdmin = isAdminEmail(email);

  return {
    isAdmin,
    isLoading,
  };
}
