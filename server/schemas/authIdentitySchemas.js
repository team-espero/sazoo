import { z } from 'zod';

const identityProviderSchema = z.enum(['google', 'kakao']);

export const authIdentityRecordSchema = z.object({
  provider: identityProviderSchema,
  providerAccountId: z.string().min(1).max(160),
  displayName: z.string().trim().max(160).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable(),
  photoURL: z.string().trim().url().max(2048).optional().nullable().or(z.literal('')).transform((value) => value || null),
  lastLoginAt: z.string().datetime().optional(),
});

export const authIdentityUpsertRequestSchema = z.object({
  installationId: z.string().min(4).max(160),
  userId: z.string().min(1).max(191),
  identity: authIdentityRecordSchema,
});

export const authIdentityStateRequestSchema = z.object({
  installationId: z.string().min(4).max(160),
  userId: z.string().min(1).max(191).optional(),
});
