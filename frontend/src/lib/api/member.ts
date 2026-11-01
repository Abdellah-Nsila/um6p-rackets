import { api, post } from '@/lib/api/api';
import type {
  JoinRequestWithUser,
  MemberRole,
  MemberWithUser,
  Paginated
} from '@/types/contracts/club';

const CLUBS = '/clubs';

const MEMBERS_LIMIT = 50; // maximum allowed by the contract

// no role = all members
export const getClubMembers = (slug: string, role?: MemberRole) => {
  const query = new URLSearchParams({ limit: String(MEMBERS_LIMIT) });
  if (role !== undefined) query.set("role", String(role));
  return api<Paginated<MemberWithUser>>(`${CLUBS}/${slug}/members?${query}`);
};

export const getJoinRequests = (slug: string) =>
  api<Paginated<JoinRequestWithUser>>(`${CLUBS}/${slug}/join-requests`);

// Accepting a request = creating the member
export const acceptJoinRequest = (slug: string, userId: number) =>
  post<void>(`${CLUBS}/${slug}/members`, { user_id: userId });

export const rejectJoinRequest = (slug: string, requestId: number) =>
  post<void>(`${CLUBS}/${slug}/join-requests/${requestId}/reject`);

export const updateMemberRole = (
  slug: string,
  memberId: number,
  role: MemberRole
) =>
  api<void>(`${CLUBS}/${slug}/members/${memberId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });

// Same endpoint as leaveClub (a member leaving is a member being removed)
export const removeMember = (slug: string, memberId: number) =>
  api<void>(`${CLUBS}/${slug}/members/${memberId}`, { method: 'DELETE' });