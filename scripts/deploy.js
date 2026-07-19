import { execSync } from "node:child_process";

const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function run(cmd, opts = {}) {
  console.log(dim(`$ ${cmd}`));
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function runSilent(cmd) {
  return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
}

// ── 1. Detect Convex backend changes ──────────────────────────────────────────
console.log(green("\n🔍 Checking for Convex backend changes..."));
const convexChanges = runSilent(
  'git diff --name-only HEAD -- "convex/" ":!convex/_generated/"',
);

const hasBackendChanges = convexChanges.length > 0;

if (hasBackendChanges) {
  console.log(yellow("\n📦 Convex backend files changed:"));
  convexChanges.split("\n").forEach((f) => console.log(`   ${f}`));
  console.log(yellow("\n☁️  Deploying to Convex..."));
  run("npx convex deploy");
} else {
  console.log(dim("   No Convex backend changes (excluding _generated/). Skipping."));
}

// ── 2. Push to git ───────────────────────────────────────────────────────────
const branch = runSilent("git branch --show-current");
console.log(green(`\n🚀 Pushing to origin/${branch}...`));
run(`git push origin ${branch}`);

console.log(green("\n✅ Deploy complete!\n"));
