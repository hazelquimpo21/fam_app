'use client';

/**
 * ============================================================================
 * 👥 Family Page
 * ============================================================================
 *
 * Manage family members, invites, and family settings.
 *
 * Route: /family
 *
 * Features:
 * - Family member list with roles
 * - Invite new members
 * - Pending invites management
 * - Member profile editing
 * - Role management (owner/adult/kid)
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Crown,
  User,
  MoreHorizontal,
  Clock,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  useFamilyMembers,
  useFamilyInvites,
  useResendInvite,
  useCancelInvite,
} from '@/lib/hooks/use-family';
import type { FamilyMember, FamilyMemberRole, FamilyInvite } from '@/types/database';

/**
 * Get role configuration for display
 */
function getRoleConfig(role: FamilyMemberRole) {
  const configs = {
    owner: { label: 'Owner', icon: Crown, className: 'bg-amber-100 text-amber-700' },
    adult: { label: 'Adult', icon: User, className: 'bg-blue-100 text-blue-700' },
    kid: { label: 'Kid', icon: User, className: 'bg-green-100 text-green-700' },
  };
  return configs[role] || configs.adult;
}

/**
 * FamilyMemberCard Component
 */
interface FamilyMemberCardProps {
  member: FamilyMember;
}

function FamilyMemberCard({ member }: FamilyMemberCardProps) {
  const roleConfig = getRoleConfig(member.role);
  const RoleIcon = roleConfig.icon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar
            name={member.name}
            color={member.color}
            src={member.avatar_url || undefined}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-neutral-900">{member.name}</h3>
              <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', roleConfig.className)}>
                <RoleIcon className="h-3 w-3" />
                {roleConfig.label}
              </div>
            </div>
            {member.email && (
              <p className="text-sm text-neutral-500">{member.email}</p>
            )}
            <p className="text-xs text-neutral-400">
              Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            onClick={() => logger.info('Member menu clicked', { memberId: member.id })}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PendingInviteCard Component
 */
interface PendingInviteCardProps {
  invite: FamilyInvite;
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
  isProcessing: boolean;
}

function PendingInviteCard({ invite, onResend, onCancel, isProcessing }: PendingInviteCardProps) {
  const roleConfig = getRoleConfig(invite.role);
  const sentDate = new Date(invite.created_at);
  const expiresDate = new Date(invite.expires_at);
  const daysUntilExpire = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-neutral-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-neutral-900">{invite.email}</p>
              <Badge variant="outline" size="sm">{roleConfig.label}</Badge>
            </div>
            <p className="text-sm text-neutral-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sent {sentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {daysUntilExpire > 0 && ` - Expires in ${daysUntilExpire} days`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResend(invite.id)}
              disabled={isProcessing}
            >
              Resend
            </Button>
            <button
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
              onClick={() => onCancel(invite.id)}
              disabled={isProcessing}
              title="Cancel invite"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for family members
 */
function FamilySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-neutral-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-neutral-200 rounded w-24 mb-2" />
                    <div className="h-4 bg-neutral-100 rounded w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Family Page Component
 */
export default function FamilyPage() {
  // Fetch family data from database
  const { data: members = [], isLoading: loadingMembers, error: membersError } = useFamilyMembers();
  const { data: invites = [], isLoading: loadingInvites } = useFamilyInvites();

  // Mutations
  const resendInvite = useResendInvite();
  const cancelInvite = useCancelInvite();

  const isProcessing = resendInvite.isPending || cancelInvite.isPending;
  const isLoading = loadingMembers || loadingInvites;

  // Log page load for debugging
  useEffect(() => {
    logger.info('Family page loaded', {
      memberCount: members.length,
      pendingInvites: invites.length,
    });
    logger.divider('Family');
  }, [members.length, invites.length]);

  /**
   * Handle resending an invite
   */
  const handleResendInvite = (inviteId: string) => {
    logger.info('Resending invite', { inviteId });
    resendInvite.mutate(inviteId);
  };

  /**
   * Handle canceling an invite
   */
  const handleCancelInvite = (inviteId: string) => {
    logger.info('Canceling invite', { inviteId });
    cancelInvite.mutate(inviteId);
  };

  // Error state
  if (membersError) {
    logger.error('Failed to load family members', { error: membersError });
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Users className="h-16 w-16 text-red-500" />}
              title="Failed to load family"
              description="There was an error loading your family members. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Family</h1>
            {!isLoading && (
              <p className="text-sm text-neutral-500">{members.length} members</p>
            )}
          </div>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Invite Member
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && <FamilySkeleton />}

      {/* Empty state */}
      {!isLoading && members.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Users className="h-16 w-16 text-indigo-500" />}
              title="No family members yet"
              description="Start by adding your family members or inviting them via email."
              action={{
                label: 'Invite Member',
                onClick: () => logger.info('Invite member clicked'),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Members section */}
      {!isLoading && members.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
            Family Members
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <FamilyMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Pending invites section */}
      {!isLoading && invites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
            Pending Invites
          </h2>
          <div className="space-y-3">
            {invites.map((invite) => (
              <PendingInviteCard
                key={invite.id}
                invite={invite}
                onResend={handleResendInvite}
                onCancel={handleCancelInvite}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
