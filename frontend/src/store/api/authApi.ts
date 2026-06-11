import type { Invitation, InvitationWithLink } from 'src/types';
import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    verifyPin: builder.mutation<{ token: string }, { pin: string }>({
      query: (body) => ({ url: '/auth/verify-pin', method: 'POST', body }),
    }),

    // ─── Invitations ────────────────────────────────────────────────────────────
    getInvitations: builder.query<Invitation[], void>({
      query: () => '/admin/invitations',
      providesTags: ['Invitations'],
    }),
    createInvitation: builder.mutation<InvitationWithLink, { label: string }>({
      query: (body) => ({ url: '/admin/invitations', method: 'POST', body }),
      invalidatesTags: ['Invitations'],
    }),
    deleteInvitation: builder.mutation<void, string>({
      query: (invitationId) => ({ url: `/admin/invitations/${invitationId}`, method: 'DELETE' }),
      invalidatesTags: ['Invitations'],
    }),
  }),
});

export const {
  useVerifyPinMutation,
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
} = authApi;
