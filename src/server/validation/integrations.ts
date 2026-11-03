import { z } from "zod";
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
const eventCommon = { eventId: z.uuid(), email };
const bagProperties = z.object({
  productIds: z.array(z.enum(productIds)).max(3),
  quantities: z.array(z.number().int().min(1).max(99)).max(3),
}).strict().superRefine((value, context) => {
  if (value.productIds.length !== value.quantities.length) {
    context.addIssue({ code: "custom", message: "Product and quantity counts must match." });
  }
});
export const eventSchema = z.discriminatedUnion("event", [
  z.object({
    ...eventCommon,
    event: z.literal("Sidequest Location Visited"),
    properties: z.object({ location: z.enum(["market", "oracle", "camp", "post"]) }).strict(),
  }).strict(),
  z.object({
    ...eventCommon,
    event: z.literal("Sidequest Product Viewed"),
    properties: z.object({
      productId: z.enum(productIds),
      discoverySource: z.enum(["market", "oracle", "shop", "camp"]),
    }).strict(),
  }).strict(),
  z.object({ ...eventCommon, event: z.literal("Sidequest Bag Updated"), properties: bagProperties }).strict(),
  z.object({
    ...eventCommon,
    event: z.literal("Sidequest Oracle Completed"),
    properties: z.object({
      recommendedProductId: z.enum(productIds),
      ruleVersion: z.literal("2"),
      deskMood: z.enum(moods),
      visualStyle: z.enum(["fantasy", "nature", "technology"]),
    }).strict(),
  }).strict(),
  z.object({
    ...eventCommon,
    event: z.literal("Sidequest Camp Question Asked"),
    properties: z.object({ topic: z.enum(["companion", "checkout", "shipping", "custom"]) }).strict(),
  }).strict(),
  z.object({
    ...eventCommon,
    event: z.literal("Sidequest Demo Checkout Completed"),
    properties: z.object({
      productIds: z.array(z.enum(productIds)).max(3),
      quantities: z.array(z.number().int().min(1).max(99)).max(3),
      demoTotalMinor: z.number().int().min(0).max(1_000_000),
      currency: z.literal("USD"),
      demoOrderId: z.uuid(),
    }).strict().superRefine((value, context) => {
      if (value.productIds.length !== value.quantities.length) {
        context.addIssue({ code: "custom", message: "Product and quantity counts must match." });
      }
    }),
  }).strict(),
]);

export type IdentifyInput = z.infer<typeof identifySchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type EventInput = z.infer<typeof eventSchema>;
