import { afterEach, describe, expect, it, vi } from "vitest";
import { campChatSchema, handleCampChat } from "./campChat";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Camp chat contract", () => {
  it("requires the final message to be from the user", () => {
    expect(campChatSchema.safeParse({ messages: [{ role: "agent", content: "Hello" }] }).success).toBe(false);
  });

  it("caps conversation history and message content", () => {
    expect(campChatSchema.safeParse({ messages: [{ role: "user", content: "x".repeat(501) }] }).success).toBe(false);
    expect(campChatSchema.safeParse({
      messages: Array.from({ length: 21 }, () => ({ role: "user", content: "hello" })),
    }).success).toBe(false);
    expect(campChatSchema.safeParse({
      conversationId: "x".repeat(101),
      messages: [{ role: "user", content: "hello" }],
    }).success).toBe(false);
  });

  it("uses deterministic local answers in demo without provider requests or follow-up claims", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "demo");
    vi.stubEnv("CAMP_CHAT_MODE", "live");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await handleCampChat({ messages: [{ role: "user", content: "How does checkout work?" }] });
    expect(result).toEqual({
      status: "simulated",
      open: true,
      replies: [{ kind: "message", text: "Checkout is a demo: no payment is taken and nothing is delivered." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
