import { initBotId } from "botid/client/core";

if (process.env.NEXT_PUBLIC_SIDEQUEST_BOT_PROTECTION === "enabled") {
  initBotId({
    protect: [{ path: "/api/subscribe", method: "POST", advancedOptions: { checkLevel: "basic" } }],
  });
}
