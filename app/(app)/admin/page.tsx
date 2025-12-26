'use client';

/**
 * ============================================================================
 * Admin Page
 * ============================================================================
 *
 * Admin area for testing and debugging the app.
 * Only accessible to admin users (hazel.quimpo@gmail.com).
 *
 * Features:
 * - Clear TanStack Query cache
 * - Clear local storage
 * - View current user info
 *
 * ============================================================================
 */

import { useQueryClient } from '@tanstack/react-query';
import { Trash2, RefreshCcw, Shield, Database, HardDrive, User, Check } from 'lucide-react';
import { useState } from 'react';
import { useAdmin } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/lib/utils/logger';

export default function AdminPage() {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { user, familyMember, family, authState } = useAuth();
  const queryClient = useQueryClient();

  // Track which action was just completed for feedback
  const [justCleared, setJustCleared] = useState<'cache' | 'storage' | 'all' | null>(null);

  // Loading state
  if (isAdminLoading || authState === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not an admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Shield className="h-16 w-16 text-red-400" />
        <h1 className="text-2xl font-bold text-neutral-900">Access Denied</h1>
        <p className="text-neutral-600 text-center max-w-md">
          You don&apos;t have permission to access the admin area.
          Only authorized administrators can view this page.
        </p>
      </div>
    );
  }

  /**
   * Clear TanStack Query cache
   * Forces all queries to refetch fresh data
   */
  const handleClearQueryCache = () => {
    logger.info('Clearing TanStack Query cache...');
    queryClient.clear();
    setJustCleared('cache');
    setTimeout(() => setJustCleared(null), 2000);
    logger.success('Query cache cleared!');
  };

  /**
   * Clear local storage
   * Removes all stored data (theme preferences, etc.)
   */
  const handleClearLocalStorage = () => {
    logger.info('Clearing local storage...');
    localStorage.clear();
    setJustCleared('storage');
    setTimeout(() => setJustCleared(null), 2000);
    logger.success('Local storage cleared!');
  };

  /**
   * Clear everything and reload
   * Nuclear option - clears all caches and reloads the page
   */
  const handleClearAll = () => {
    logger.info('Clearing all caches and reloading...');
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    setJustCleared('all');
    // Small delay to show the success state before reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-neutral-900">Admin Area</h1>
        </div>
        <p className="text-neutral-600">
          Tools for testing and debugging the Fam app.
        </p>
      </div>

      {/* Cache Management Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Cache Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-600">
              Clear cached data to test fresh data loading, debug issues, or reset the app state.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Clear Query Cache */}
              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-neutral-900">Query Cache</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-4">
                  Clear TanStack Query cache. All data will be refetched.
                </p>
                <Button
                  onClick={handleClearQueryCache}
                  variant="secondary"
                  className="w-full"
                >
                  {justCleared === 'cache' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Cleared!
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </>
                  )}
                </Button>
              </div>

              {/* Clear Local Storage */}
              <div className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-neutral-900">Local Storage</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-4">
                  Clear localStorage. Preferences will reset.
                </p>
                <Button
                  onClick={handleClearLocalStorage}
                  variant="secondary"
                  className="w-full"
                >
                  {justCleared === 'storage' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Cleared!
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Clear Storage
                    </>
                  )}
                </Button>
              </div>

              {/* Clear Everything */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-neutral-900">Clear All</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-4">
                  Clear everything and reload the page.
                </p>
                <Button
                  onClick={handleClearAll}
                  variant="destructive"
                  className="w-full"
                >
                  {justCleared === 'all' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Reloading...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All & Reload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-neutral-50 p-4 font-mono text-sm overflow-auto">
              <pre className="whitespace-pre-wrap break-words">
{JSON.stringify({
  auth: {
    userId: user?.id,
    email: user?.email,
    createdAt: user?.created_at,
  },
  familyMember: familyMember ? {
    id: familyMember.id,
    name: familyMember.name,
    email: familyMember.email,
    role: familyMember.role,
    color: familyMember.color,
  } : null,
  family: family ? {
    id: family.id,
    name: family.name,
  } : null,
}, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
