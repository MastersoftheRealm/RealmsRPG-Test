#!/usr/bin/env bash
# Vercel Ignored Build Step — exit 0 skips deploy; exit 1 continues build.
# Skips docs/agent/task-queue/test-only commits so Hobby deploy rate limits are not
# burned by rapid merged_at / changelog / visual-baseline PRs. App code still deploys.
set -euo pipefail

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
curr="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if [[ -z "$prev" || "$prev" == "null" || "$prev" == "0000000000000000000000000000000000000000" ]]; then
  # First deploy / missing baseline — always build.
  exit 1
fi

if ! git cat-file -e "${prev}^{commit}" 2>/dev/null; then
  exit 1
fi

# Paths that never require a Next.js production rebuild.
# Include tests/ + Playwright configs so snapshot/CI-only commits do not burn
# Hobby deploy quota (audit 2026-08-13 P2). This script itself is skipped so
# ignore-list edits can land with test-only changes without a production rebuild.
skip_regex='^(src/docs/|\.cursor/|\.github/|sql/|scripts/seed-data/|scripts/vercel-ignore-build\.sh$|codex_csv/|tests/|playwright\..+\.config\.ts$|AGENTS\.md$|README\.md$|.*\.md$)'

changed="$(git diff --name-only "$prev" "$curr" || true)"
if [[ -z "${changed//[[:space:]]/}" ]]; then
  exit 0
fi

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ ! "$file" =~ $skip_regex ]]; then
    exit 1
  fi
done <<< "$changed"

exit 0
