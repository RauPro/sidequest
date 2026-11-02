import "server-only";
import { identifySchema, type IdentifyInput } from "@/server/validation/integrations";
import { runIntegration } from "./client";

export async function identifyProfile(input: IdentifyInput) {
  identifySchema.parse(input);
  return runIntegration("identify");
}
