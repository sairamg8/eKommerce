import z from "zod";

export const refresh_schema = z.object({
  id: z.string({ error: "Refresh id must be declared" }),
  user_id: z.string({ error: "Refresh must be synced with user" }),
  expires_at: z.date({ error: "Refresh token must have expiry" }),
  ip: z.string().optional(),
  token_hash: z.string({ error: "Token hash cannot be empty" }),
  revoked_at: z.string().optional(),
  replaced_by_id: z.string().optional(),
  created_at: z.iso.datetime().optional(),
});
