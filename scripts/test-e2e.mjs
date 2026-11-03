import { spawnSync } from "node:child_process";

const env = { ...process.env, NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING: "demo" };
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(command, args) {
  const result = spawnSync(command, args, { env, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) {
    console.error(result.error);
    return 1;
  }
  return result.status ?? 1;
}

let status = run(npm, ["run", "build"]);
if (status === 0) status = run(npx, ["playwright", "test"]);
process.exitCode = status;
