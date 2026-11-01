import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { clubKeys } from '@/hooks/use-clubs';
import {
  acceptJoinRequest,
  getClubMembers,
  getJoinRequests,
  rejectJoinRequest,
  removeMember,
  updateMemberRole
} from '@/lib/api/member';
import { MemberRole } from '@/types/contracts/club';

// Everything lives under clubKeys.detail(slug), so invalidating that key
// refreshes the club, its status, its members and its join requests at once.
export const memberKeys = {
  members: (slug: string) => [...clubKeys.detail(slug), 'members'] as const,
  list: (slug: string, role?: MemberRole) =>
    [...memberKeys.members(slug), { role }] as const,
  joinRequests: (slug: string) =>
    [...clubKeys.detail(slug), 'join-requests'] as const
};

export function useClubMembers(
  slug: string,
  role: MemberRole | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: memberKeys.list(slug, role),
    queryFn: () => getClubMembers(slug, role),
    enabled: enabled && Boolean(slug)
  });
}

export function useJoinRequests(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: memberKeys.joinRequests(slug),
    queryFn: () => getJoinRequests(slug),
    enabled: enabled && Boolean(slug)
  });
}

// variables = the requester's user id
export function useAcceptJoinRequest(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => acceptJoinRequest(slug, userId),
    onSuccess: () => {
      toast.success('Join request accepted successfully.');
      return queryClient.invalidateQueries({ queryKey: clubKeys.detail(slug) });
    },
    onError: (err) =>
      toast.error(err.message || 'Failed to accept join request.')
  });
}

// variables = the join request id
export function useRejectJoinRequest(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) => rejectJoinRequest(slug, requestId),
    onSuccess: () => {
      toast.success('Join request declined.');
      return queryClient.invalidateQueries({
        queryKey: memberKeys.joinRequests(slug)
      });
    },
    onError: (err) =>
      toast.error(err.message || 'Failed to decline join request.')
  });
}

export function useSetMemberRole(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: MemberRole }) =>
      updateMemberRole(slug, memberId, role),
    onSuccess: (_, { role }) => {
      toast.success(
        role === MemberRole.LEADER
          ? 'Member promoted to leader.'
          : 'Leader demoted to member.'
      );
      return queryClient.invalidateQueries({
        queryKey: memberKeys.members(slug)
      });
    },
    onError: (err) => toast.error(err.message || 'Failed to update member role.')
  });
}

// variables = the member id
export function useRemoveMember(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) => removeMember(slug, memberId),
    onSuccess: () => {
      toast.success('Member kicked from the club successfully.');
      return queryClient.invalidateQueries({ queryKey: clubKeys.detail(slug) });
    },
    onError: (err) => toast.error(err.message || 'Failed to remove member.')
  });
}