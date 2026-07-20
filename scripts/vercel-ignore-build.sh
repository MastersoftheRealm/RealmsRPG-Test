#!/usr/bin/env bash
# Vercel Ignored Build Step — exit 0 skips deploy; exit 1 continues build.
# Skips docs/agent/task-queue-only commits so Hobby deploy rate limits are not burned
# by rapid merged_at / changelog PRs. App code changes still deploy.
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
skip_regex='^(src/docs/|\.cursor/|\.github/|sql/|scripts/seed-data/|codex_csv/|AGENTS\.md$|README\.md$|.*\.md$)'

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
