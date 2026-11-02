import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Vercel serves the BotID challenge; local production builds stay self-contained.
  env: { NEXT_PUBLIC_SIDEQUEST_BOT_PROTECTION: process.env.VERCEL === "1" ? "enabled" : "disabled" },
};

export default nextConfig;
