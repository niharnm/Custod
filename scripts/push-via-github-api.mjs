#!/usr/bin/env node
/**
 * Push workspace files to a GitHub branch without local git.
 * Used when system git is unavailable (e.g. Xcode license not accepted).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO = process.argv[2] ?? "niharnm/Custod";
const BRANCH = process.argv[3] ?? "website";
const ROOT = process.argv[4] ?? process.cwd();
const MESSAGE =
  process.argv[5] ??
  "Add website branch with Next.js marketing site scaffold";

const IGNORE = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  "build",
  "dist",
  ".vercel",
  "temp",
  ".DS_Store",
  "next-env.d.ts",
]);

const IGNORE_SUFFIX = [".tsbuildinfo"];

function ghApi(method, endpoint, body) {
  const args = ["api", "-X", method, endpoint];
  if (body !== undefined) {
    args.push("--input", "-");
  }
  const input = body !== undefined ? JSON.stringify(body) : undefined;
  const out = execFileSync("gh", args, {
    input,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out ? JSON.parse(out) : null;
}

function shouldIgnore(relPath, name) {
  if (IGNORE.has(name)) return true;
  for (const part of relPath.split("/")) {
    if (IGNORE.has(part)) return true;
  }
  return IGNORE_SUFFIX.some((suffix) => name.endsWith(suffix));
}

function walk(dir, base = "") {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name;
    if (shouldIgnore(rel, name)) continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      entries.push(...walk(abs, rel));
    } else if (stat.isFile()) {
      entries.push(rel);
    }
  }
  return entries;
}

function createBlob(relPath) {
  const content = fs.readFileSync(path.join(ROOT, relPath));
  const result = ghApi("POST", `repos/${REPO}/git/blobs`, {
    content: content.toString("base64"),
    encoding: "base64",
  });
  return { path: relPath, mode: "100644", type: "blob", sha: result.sha };
}

function refExists(ref) {
  try {
    ghApi("GET", `repos/${REPO}/git/ref/${ref}`);
    return true;
  } catch {
    return false;
  }
}

const files = walk(ROOT).sort();
console.log(`Uploading ${files.length} files to ${REPO}@${BRANCH}...`);

const treeItems = [];
for (const file of files) {
  treeItems.push(createBlob(file));
  process.stdout.write(".");
}
console.log("");

const tree = ghApi("POST", `repos/${REPO}/git/trees`, {
  tree: treeItems,
});

const commit = ghApi("POST", `repos/${REPO}/git/commits`, {
  message: MESSAGE,
  tree: tree.sha,
});

const refName = `heads/${BRANCH}`;
if (refExists(refName)) {
  throw new Error(
    `Branch "${BRANCH}" already exists on ${REPO}. Delete it first or choose a different branch name.`,
  );
}

ghApi("POST", `repos/${REPO}/git/refs`, {
  ref: `refs/heads/${BRANCH}`,
  sha: commit.sha,
});
console.log(`Created branch ${BRANCH}: ${commit.sha}`);
