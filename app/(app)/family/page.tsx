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
 * Features (planned):
 * - Family member list with roles
 * - Invite new members
 * - Pending invites management
 * - Member profile editing
 * - Role management (adult/kid)
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
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Family member role type
 */
type MemberRole = 'owner' | 'adult' | 'kid';

/**
 * Mock family data
 * In production, this would come from useFamily() hook
 */
const mockFamily = {
  name: 'The Quimpo Family',
  createdAt: '2024-10-01',
  members: [
    {
      id: '1',
      name: 'Hazel',
      email: 'hazel@example.com',
      role: 'owner' as MemberRole,
      color: '#6366F1',
      avatarUrl: null,
      joinedAt: '2024-10-01',
    },
    {
      id: '2',
      name: 'Mike',
      email: 'mike@example.com',
      role: 'adult' as MemberRole,
      color: '#10B981',
      avatarUrl: null,
      joinedAt: '2024-10-02',
    },
    {
      id: '3',
      name: 'Zelda',
      email: null,
      role: 'kid' as MemberRole,
      color: '#F59E0B',
      avatarUrl: null,
      joinedAt: '2024-10-03',
    },
    {
      id: '4',
      name: 'Miles',
      email: null,
      role: 'kid' as MemberRole,
      color: '#EC4899',
      avatarUrl: null,
      joinedAt: '2024-10-03',
    },
  ],
  pendingInvites: [
    {
      id: 'inv1',
      email: 'grandma@example.com',
      role: 'adult' as MemberRole,
      sentAt: '2024-12-20',
      expiresAt: '2024-12-27',
    },
  ],
};

/**
 * Get role configuration for display
 */
function getRoleConfig(role: MemberRole) {
  const configs = {
    owner: { label: 'Owner', icon: Crown, className: 'bg-amber-100 text-amber-700' },
    adult: { label: 'Adult', icon: User, className: 'bg-blue-100 text-blue-700' },
    kid: { label: 'Kid', icon: User, className: 'bg-green-100 text-green-700' },
  };
  return configs[role];
}

/**
 * FamilyMemberCard Component
 */
interface FamilyMemberCardProps {
  member: {
    id: string;
    name: string;
    email: string | null;
    role: MemberRole;
    color: string;
    avatarUrl: string | null;
    joinedAt: string;
  };
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
            src={member.avatarUrl || undefined}
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
              Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
  invite: {
    id: string;
    email: string;
    role: MemberRole;
    sentAt: string;
    expiresAt: string;
  };
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
}

function PendingInviteCard({ invite, onResend, onCancel }: PendingInviteCardProps) {
  const roleConfig = getRoleConfig(invite.role);
  const sentDate = new Date(invite.sentAt);
  const expiresDate = new Date(invite.expiresAt);
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
              {daysUntilExpire > 0 && ` · Expires in ${daysUntilExpire} days`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResend(invite.id)}
            >
              Resend
            </Button>
            <button
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
              onClick={() => onCancel(invite.id)}
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
 * Family Page Component
 */
export default function FamilyPage() {
  // Log page load for debugging
  useEffect(() => {
    logger.info('Family page loaded', {
      familyName: mockFamily.name,
      memberCount: mockFamily.members.length,
      pendingInvites: mockFamily.pendingInvites.length,
    });
    logger.divider('Family');
  }, []);

  /**
   * Handle resending an invite
   */
  const handleResendInvite = (inviteId: string) => {
    logger.info('Resending invite', { inviteId });
  };

  /**
   * Handle canceling an invite
   */
  const handleCancelInvite = (inviteId: string) => {
    logger.info('Canceling invite', { inviteId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">{mockFamily.name}</h1>
            <p className="text-sm text-neutral-500">{mockFamily.members.length} members</p>
          </div>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Invite Member
        </Button>
      </div>

      {/* Members section */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
          Family Members
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {mockFamily.members.map((member) => (
            <FamilyMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Pending invites section */}
      {mockFamily.pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
            Pending Invites
          </h2>
          <div className="space-y-3">
            {mockFamily.pendingInvites.map((invite) => (
              <PendingInviteCard
                key={invite.id}
                invite={invite}
                onResend={handleResendInvite}
                onCancel={handleCancelInvite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
