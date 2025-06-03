import { z } from "zod";

export const TokenResponseSchema = z.object({
  token: z.string(),
});
