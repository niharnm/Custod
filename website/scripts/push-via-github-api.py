#!/usr/bin/env python3
"""Push workspace files to a GitHub branch without local git."""

from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
from pathlib import Path

REPO = sys.argv[1] if len(sys.argv) > 1 else "niharnm/Custod"
BRANCH = sys.argv[2] if len(sys.argv) > 2 else "website"
ROOT = Path(sys.argv[3] if len(sys.argv) > 3 else os.getcwd())
MESSAGE = (
    sys.argv[4]
    if len(sys.argv) > 4
    else "Add website branch with Next.js marketing site scaffold"
)

IGNORE = {
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
}
IGNORE_SUFFIX = (".tsbuildinfo",)


def gh_api(method: str, endpoint: str, body: dict | None = None) -> dict | None:
    args = ["gh", "api", "-X", method, endpoint]
    if body is not None:
        args.extend(["--input", "-"])
    result = subprocess.run(
        args,
        input=json.dumps(body).encode() if body is not None else None,
        capture_output=True,
        check=True,
    )
    if not result.stdout:
        return None
    return json.loads(result.stdout)


def should_ignore(rel_path: str, name: str) -> bool:
    if name in IGNORE:
        return True
    return any(part in IGNORE for part in rel_path.split("/")) or any(
        name.endswith(suffix) for suffix in IGNORE_SUFFIX
    )


def walk(base: Path = ROOT) -> list[str]:
    files: list[str] = []
    for path in sorted(base.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if should_ignore(rel, path.name):
            continue
        files.append(rel)
    return files


def ref_exists(ref: str) -> bool:
    try:
        gh_api("GET", f"repos/{REPO}/git/ref/{ref}")
        return True
    except subprocess.CalledProcessError:
        return False


def main() -> None:
    files = walk()
    print(f"Uploading {len(files)} files to {REPO}@{BRANCH}...")

    tree_items = []
    for index, rel in enumerate(files, start=1):
        content = (ROOT / rel).read_bytes()
        blob = gh_api(
            "POST",
            f"repos/{REPO}/git/blobs",
            {
                "content": base64.b64encode(content).decode("ascii"),
                "encoding": "base64",
            },
        )
        tree_items.append(
            {"path": rel, "mode": "100644", "type": "blob", "sha": blob["sha"]}
        )
        if index % 10 == 0 or index == len(files):
            print(f"  {index}/{len(files)}")

    tree = gh_api("POST", f"repos/{REPO}/git/trees", {"tree": tree_items})
    commit = gh_api(
        "POST",
        f"repos/{REPO}/git/commits",
        {"message": MESSAGE, "tree": tree["sha"]},
    )

    ref_name = f"heads/{BRANCH}"
    if ref_exists(ref_name):
        raise SystemExit(
            f'Branch "{BRANCH}" already exists on {REPO}. Choose a different branch name.'
        )

    gh_api(
        "POST",
        f"repos/{REPO}/git/refs",
        {"ref": f"refs/heads/{BRANCH}", "sha": commit["sha"]},
    )
    print(f"Created branch {BRANCH}: {commit['sha']}")


if __name__ == "__main__":
    main()
