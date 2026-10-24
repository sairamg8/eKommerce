import z from "zod";

export const page_notification = z.enum(["banner", "toast", "message"]);
export type Page_NotificationT = {
  template: {
    msg: string;
    type: z.infer<typeof page_notification>;
  };
};
