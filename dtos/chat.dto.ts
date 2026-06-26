import { z } from "zod";

export const DirectConversationSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1),
  }),
});