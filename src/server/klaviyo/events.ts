import "server-only";
import { eventSchema, type EventInput } from "@/server/validation/integrations";
import { runIntegration } from "./client";

export async function recordEvent(input: EventInput) {
  eventSchema.parse(input);
  return runIntegration("event");
}
