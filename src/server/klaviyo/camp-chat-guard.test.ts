import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { checkBotId } = vi.hoisted(() => ({ checkBotId: vi.fn() }));
vi.mock("botid/server", () => ({ checkBotId }));

import { guardCampChat } from "./camp-chat-guard";

beforeEach(() => {
  vi.stubEnv("SIDEQUEST_MODE", "demo");
  vi.stubEnv("CAMP_CHAT_MODE", "live");
  vi.stubEnv("VERCEL", "");
  checkBotId.mockReset().mockResolvedValue({ isBot: false });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Camp chat BotID guard", () => {
  it("passes in demo mode without checking BotID", async () => {
    await expect(guardCampChat()).resolves.toBeUndefined();
    expect(checkBotId).not.toHaveBeenCalled();
  });

  it("passes when Camp is not live even if the general integration mode is live", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "live");
    vi.stubEnv("CAMP_CHAT_MODE", "preview");

    await expect(guardCampChat()).resolves.toBeUndefined();
    expect(checkBotId).not.toHaveBeenCalled();
  });

  it("fails closed for live chat outside Vercel", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "live");
    vi.stubEnv("CAMP_CHAT_MODE", "live");

    await expect(guardCampChat()).rejects.toMatchObject({ status: 503, code: "protection_unavailable" });
    expect(checkBotId).not.toHaveBeenCalled();
  });

  it("checks basic BotID protection and blocks bots", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "live");
    vi.stubEnv("CAMP_CHAT_MODE", "live");
    vi.stubEnv("VERCEL", "1");
    checkBotId.mockResolvedValueOnce({ isBot: true });

    await expect(guardCampChat()).rejects.toMatchObject({ status: 403, code: "request_not_verified" });
    expect(checkBotId).toHaveBeenCalledWith({ advancedOptions: { checkLevel: "basic" } });
  });
});
