import { guards, jsonRoute } from "@/server/http";
import { campChatSchema, handleCampChat } from "@/server/campChat";
import { guardCampChat } from "@/server/klaviyo/camp-chat-guard";
import { rateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";
export const POST = jsonRoute(campChatSchema, handleCampChat, guards(rateLimit("/api/camp/chat", 12, 60_000), guardCampChat));
