import client from '../client.ts';

export type Invitation = {
  id: string;
  token: string;
  label: string;
  created_at: string;
  used_at: string | null;
};

export type InvitationWithLink = Invitation & { link: string };

export async function createInvitation(label: string): Promise<InvitationWithLink> {
  const { data } = await client.post<InvitationWithLink>('/admin/invitations', { label });
  return data;
}

export async function fetchInvitations(): Promise<Invitation[]> {
  const { data } = await client.get<Invitation[]>('/admin/invitations');
  return data;
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  await client.delete(`/admin/invitations/${invitationId}`);
}
