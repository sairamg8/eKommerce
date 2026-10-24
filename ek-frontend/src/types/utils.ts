import z from "zod";
import { page_notification } from ".";

export const login_page_schema = z.object({
  template: z.object({
    msg: z.string(),
    type: page_notification,
  }),
});

export type Logon_PageT = z.infer<typeof login_page_schema>;
