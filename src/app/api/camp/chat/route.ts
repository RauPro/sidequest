import { jsonRoute } from "@/server/http";
import { campChatSchema, handleCampChat } from "@/server/campChat";

export const runtime = "nodejs";
export const POST = jsonRoute(campChatSchema, handleCampChat);
