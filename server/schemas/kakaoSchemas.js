import { z } from 'zod';

export const kakaoExchangeRequestSchema = z.object({
  code: z.string().trim().min(4).max(2048),
  redirectUri: z.string().trim().url().max(512),
  state: z.string().trim().max(512).optional(),
});
