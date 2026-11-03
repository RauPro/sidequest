import { z } from "zod";
import { eventNames } from "@/domain/events";
import { productIds } from "@/domain/catalog";
import { moods } from "@/domain/recommendations";

const email = z.string().trim().email().max(254);
const preferences = z.object({
  preferredCompanion: z.enum(productIds).optional(),
  deskMood: z.enum(moods).optional(),
  visualStyle: z.enum(["fantasy", "nature", "technology"]).optional(),
}).strict();

export const identifySchema = z.object({ email, preferences: preferences.optional() }).strict();
export const subscribeSchema = identifySchema.extend({ consent: z.literal(true) });
export const eventSchema = z.object({
  event: z.enum(eventNames),
  eventId: z.uuid(),
  email,
  properties: z.object({
    productId: z.enum(productIds).optional(),
    discoverySource: z.enum(["market", "oracle", "shop"]).optional(),
    productIds: z.array(z.enum(productIds)).max(3).optional(),
    quantities: z.array(z.number().int().min(1).max(99)).max(3).optional(),
    demoTotalMinor: z.number().int().min(0).max(1_000_000).optional(),
    currency: z.literal("USD").optional(),
    recommendedProductId: z.enum(productIds).optional(),
    ruleVersion: z.enum(["1", "2"]).optional(),
    demoOrderId: z.uuid().optional(),
  }).strict(),
}).strict();

export type IdentifyInput = z.infer<typeof identifySchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type EventInput = z.infer<typeof eventSchema>;
