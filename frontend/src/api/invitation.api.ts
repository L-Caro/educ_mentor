import client from './client';

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
