import { z } from 'zod';
import { USER_ROLES } from '@/shared/constants';

export const createMemberInvitationSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MANAGER], {
    required_error: 'Role must be ADMIN or MANAGER',
  }),
});

export type CreateMemberInvitationInput = z.infer<typeof createMemberInvitationSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MANAGER], {
    required_error: 'Role must be ADMIN or MANAGER',
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
