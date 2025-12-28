'use client';

/**
 * ============================================================================
 * 🔐 Authentication Hook (Re-export)
 * ============================================================================
 *
 * This file re-exports the useAuth hook from the centralized AuthProvider.
 *
 * MIGRATION NOTE:
 * Previously, this file contained a standalone hook that managed its own state.
 * That pattern caused issues:
 * - Multiple components calling useAuth() created independent state instances
 * - Each instance fetched family member data separately
 * - State wasn't shared across the component tree
 *
 * Now, auth state is managed centrally in AuthProvider (lib/contexts/auth-context.tsx).
 * This file exists for backwards compatibility - all existing imports still work.
 *
 * USAGE (unchanged):
 *   import { useAuth } from '@/lib/hooks/use-auth'
 *   const { user, familyMember, family, signOut } = useAuth()
 *
 * NEW FEATURES:
 *   - familyId: Quick access to family_id without digging into familyMember
 *   - refetchFamilyMember: Manual refresh after profile updates
 *
 * ============================================================================
 */

// Re-export everything from the centralized auth context
export {
  useAuth,
  AuthProvider,
  AuthContext,
  type AuthState,
  type AuthContextValue,
} from '@/lib/contexts/auth-context';
