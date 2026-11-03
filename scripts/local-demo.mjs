import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const demo = join(root, ".sidequest-demo");
const marker = join(demo, "demo-build.json");
const command = process.argv[2];
const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  VERCEL: "",
  SIDEQUEST_MODE: "demo",
  NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING: "demo",
  NEXT_PUBLIC_SIDEQUEST_SOLD_OUT: "bolt",
  NEXT_PUBLIC_KLAVIYO_SITE_ID: "",
  ORACLE_PROFILE_MODE: "demo",
  ORACLE_PROFILE_ALLOWED_EMAILS: "",
  CAMP_CHAT_MODE: "demo",
  KLAVIYO_CUSTOMER_AGENT_MODE: "preview",
  KLAVIYO_CUSTOMER_AGENT_API_KEY: "",
  KLAVIYO_PRIVATE_API_KEY: "",
  KLAVIYO_LIST_ID: "",
  KLAVIYO_LIVE_ALLOWED_EMAILS: "",
  KLAVIYO_SUBSCRIPTION_ACCESS: "invited",
};

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: demo, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.signal) process.exit(1);
  return result.status ?? 1;
}

if (command === "build") {
  // Copy only application inputs. Local credentials and Vercel state never enter this build.
  rmSync(demo, { recursive: true, force: true });
  mkdirSync(join(demo, "scripts"), { recursive: true });
  for (const path of ["src", "public", "package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "next-env.d.ts", "scripts/export-product-images.mjs", "assets/source/village/walk-grid.json"]) {
    mkdirSync(dirname(join(demo, path)), { recursive: true });
    cpSync(join(root, path), join(demo, path), { recursive: true });
  }
  symlinkSync(join(root, "node_modules"), join(demo, "node_modules"), "dir");
  let status = run(["scripts/export-product-images.mjs"]);
  if (status === 0) status = run(["node_modules/next/dist/bin/next", "build"]);
  if (status === 0) {
    writeFileSync(marker, JSON.stringify({ version: 1, mode: "demo", soldOut: "bolt", builtAt: new Date().toISOString() }) + "\n");
    console.log("Local demo ready. Run npm run demo:start, then open http://127.0.0.1:3110.");
  }
  process.exitCode = status;
} else if (command === "start") {
  if (!existsSync(marker) || !existsSync(join(demo, ".next/BUILD_ID"))) {
    throw new Error("Prepare the fallback while online first: npm run demo:build");
  }
  const build = JSON.parse(readFileSync(marker, "utf8"));
  if (build.version !== 1 || build.mode !== "demo" || build.soldOut !== "bolt") throw new Error("Rebuild the local fallback with npm run demo:build.");
  const port = process.env.SIDEQUEST_DEMO_PORT ?? "3110";
  if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error("SIDEQUEST_DEMO_PORT must be between 1024 and 65535.");
  console.log(`Starting isolated demo built ${build.builtAt}. All provider operations are simulated.`);
  process.exitCode = run(["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", port]);
} else {
  throw new Error("Usage: node scripts/local-demo.mjs build|start");
}
