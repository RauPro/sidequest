import "server-only";
import { subscribeSchema, type SubscribeInput } from "@/server/validation/integrations";
import { runIntegration } from "./client";

export async function subscribeProfile(input: SubscribeInput) {
  subscribeSchema.parse(input);
  // The live implementation must save preferences before requesting consent.
  return runIntegration("subscribe");
}
