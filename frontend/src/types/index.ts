export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export interface Setting {
  key: string;
  value: string;
}

// ── Auth / Invitations ────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  token: string;
  label: string;
  created_at: string;
  used_at: string | null;
}

export interface InvitationWithLink extends Invitation {
  link: string;
}
