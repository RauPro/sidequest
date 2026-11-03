import "server-only";
import { z } from "zod";
import { matchCampQuestion } from "@/domain/campGuide";
import { chatWithCustomerAgent, type CustomerAgentInput } from "@/server/klaviyo/customerAgent";

export const campChatSchema = z.object({
  conversationId: z.string().max(100).optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "agent"]),
    content: z.string().trim().min(1).max(500),
  }).strict()).min(1).max(20),
  email: z.string().trim().email().max(254).optional(),
}).strict().superRefine(({ messages }, context) => {
  if (messages.at(-1)?.role !== "user") {
    context.addIssue({ code: "custom", message: "The last message must be from the user.", path: ["messages"] });
  }
});

export type CampChatInput = z.infer<typeof campChatSchema>;

export async function handleCampChat(input: CampChatInput) {
  if (process.env.SIDEQUEST_MODE === "demo" || process.env.CAMP_CHAT_MODE !== "live") {
    const match = matchCampQuestion(input.messages.at(-1)!.content);
    return { status: "simulated" as const, ...match };
  }
  return chatWithCustomerAgent(input as CustomerAgentInput);
}
