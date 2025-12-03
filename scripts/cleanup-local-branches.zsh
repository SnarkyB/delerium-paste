#!/usr/bin/env zsh
# Safe cleanup of local git branches merged into the default branch
# Usage: ./scripts/cleanup-local-branches.zsh [--repo /path/to/repo] [--yes] [--force] [--dry-run]
# --yes : don't prompt, proceed with deletion
# --force : if some deletions fail, force-delete them (git -D) after prompting
# --dry-run : only show branches that would be deleted; perform no deletions

set -euo pipefail

REPO="/Users/marcusb/src/repos/delerium-paste"
YES=0
FORCE=0
DRYRUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="$2"; shift 2;;
    --yes)
      YES=1; shift;;
    --force)
      FORCE=1; shift;;
    --dry-run)
      DRYRUN=1; shift;;
    -h|--help)
      echo "Usage: $0 [--repo /path/to/repo] [--yes] [--force] [--dry-run]"; exit 0;;
    *)
      echo "Unknown arg: $1"; exit 2;;
  esac
done

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG="/tmp/branch-cleanup-$TIMESTAMP.log"
PREVIEW="/tmp/branches-to-delete-$TIMESTAMP.txt"

echo "Branch cleanup run at $(date)" > "$LOG"
echo "Repo: $REPO" >> "$LOG"

if [ ! -d "$REPO" ]; then
  echo "Repository path does not exist: $REPO" | tee -a "$LOG"
  exit 2
fi

if ! git -C "$REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "$REPO is not a git repository" | tee -a "$LOG"
  exit 2
fi

# Fetch and prune
echo "Fetching remotes (fetch --all --prune)..." | tee -a "$LOG"
git -C "$REPO" fetch --all --prune >> "$LOG" 2>&1 || true

# Detect default branch: prefer origin/HEAD then local main/master
DEFAULT=$(git -C "$REPO" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@' || true)
if [ -z "$DEFAULT" ]; then
  if git -C "$REPO" show-ref --verify --quiet refs/heads/main; then
    DEFAULT=main
  elif git -C "$REPO" show-ref --verify --quiet refs/heads/master; then
    DEFAULT=master
  else
    # try to find a likely default from remotes
    DEFAULT=$(git -C "$REPO" for-each-ref --format='%(refname:short)' refs/heads | head -n1 || true)
  fi
fi

if [ -z "$DEFAULT" ]; then
  echo "Could not detect a default branch for $REPO" | tee -a "$LOG"
  exit 2
fi

echo "Detected default branch: $DEFAULT" | tee -a "$LOG"

# If default branch not present locally, create a temporary ref pointing to origin/DEFAULT
TMPREF=""
if ! git -C "$REPO" show-ref --verify --quiet "refs/heads/$DEFAULT"; then
  echo "Default branch '$DEFAULT' not present locally; attempting to create temporary ref from origin/$DEFAULT" | tee -a "$LOG"
  if git -C "$REPO" show-ref --verify --quiet "refs/remotes/origin/$DEFAULT"; then
    git -C "$REPO" update-ref refs/tmp/default_branch "refs/remotes/origin/$DEFAULT"
    TMPREF=refs/tmp/default_branch
  else
    echo "origin/$DEFAULT not found either. Aborting." | tee -a "$LOG"
    exit 2
  fi
fi

CURRENT=$(git -C "$REPO" symbolic-ref --short HEAD 2>/dev/null || echo "DETACHED")
if [ "$CURRENT" = "DETACHED" ]; then
  echo "Repository is in a detached HEAD state. Please checkout a branch before running this script." | tee -a "$LOG"
  [ -n "$TMPREF" ] && git -C "$REPO" update-ref -d "$TMPREF" >/dev/null 2>&1 || true
  exit 2
fi

echo "Current branch: $CURRENT" | tee -a "$LOG"

protected_regex='^(main|master|develop|staging|release|prod|production|dev)$'

# List branches merged into target
echo "Listing local branches merged into $DEFAULT..." | tee -a "$LOG"
if [ -n "$TMPREF" ]; then
  git -C "$REPO" branch --format='%(refname:short)' --merged "$TMPREF" | sed 's/^[ *]*//' > "$PREVIEW"
else
  git -C "$REPO" branch --format='%(refname:short)' --merged "$DEFAULT" | sed 's/^[ *]*//' > "$PREVIEW"
fi

# Filter preview: remove protected and current and keep only non-empty lines
awk -v cur="$CURRENT" -v prot="$protected_regex" 'NF && $0 !~ prot && $0 != cur {print}' "$PREVIEW" > "${PREVIEW}.filtered"
mv "${PREVIEW}.filtered" "$PREVIEW"

COUNT=$(wc -l < "$PREVIEW" | tr -d ' ')

echo "Candidate branches to delete ($COUNT):" | tee -a "$LOG"
cat "$PREVIEW" | tee -a "$LOG"

if [ "$COUNT" -eq 0 ]; then
  echo "No merged local branches to delete." | tee -a "$LOG"
  [ -n "$TMPREF" ] && git -C "$REPO" update-ref -d "$TMPREF" >/dev/null 2>&1 || true
  exit 0
fi

# If dry-run, exit now without deleting
if [ "$DRYRUN" -eq 1 ]; then
  echo "Dry-run enabled: no branches will be deleted. Use --yes to skip confirmation when ready." | tee -a "$LOG"
  echo "Preview file: $PREVIEW" | tee -a "$LOG"
  [ -n "$TMPREF" ] && git -C "$REPO" update-ref -d "$TMPREF" >/dev/null 2>&1 || true
  exit 0
fi

if [ "$YES" -eq 0 ]; then
  echo "Confirm deletion of the above $COUNT branches? (y/N)" | tee -a "$LOG"
  read -r REPLY
  if [[ "$REPLY" != "y" && "$REPLY" != "Y" ]]; then
    echo "Aborted by user." | tee -a "$LOG"
    [ -n "$TMPREF" ] && git -C "$REPO" update-ref -d "$TMPREF" >/dev/null 2>&1 || true
    exit 0
  fi
fi

# Delete non-forced
FAILURES_TMP="/tmp/branch-cleanup-failed-$TIMESTAMP.txt"
: > "$FAILURES_TMP"
while IFS= read -r br; do
  if [ -z "$br" ]; then continue; fi
  echo "Deleting branch: $br" | tee -a "$LOG"
  if git -C "$REPO" branch -d "$br" >> "$LOG" 2>&1; then
    echo "Deleted: $br" | tee -a "$LOG"
  else
    echo "Failed to delete (not fully merged?): $br" | tee -a "$LOG"
    echo "$br" >> "$FAILURES_TMP"
  fi
done < "$PREVIEW"

FAILED_COUNT=$(wc -l < "$FAILURES_TMP" | tr -d ' ')

if [ "$FAILED_COUNT" -gt 0 ]; then
  echo "Some branches failed to delete ($FAILED_COUNT). See $FAILURES_TMP and $LOG" | tee -a "$LOG"
  if [ "$FORCE" -eq 1 ]; then
    echo "Force-deleting failed branches..." | tee -a "$LOG"
    while IFS= read -r br; do
      [ -z "$br" ] && continue
      echo "Force deleting: $br" | tee -a "$LOG"
      git -C "$REPO" branch -D "$br" >> "$LOG" 2>&1 || echo "Failed to force-delete: $br" | tee -a "$LOG"
    done < "$FAILURES_TMP"
  else
    echo "Run with --force to attempt forced deletion of these branches." | tee -a "$LOG"
  fi
fi

echo "Cleanup complete. Log: $LOG" | tee -a "$LOG"
[ -n "$TMPREF" ] && git -C "$REPO" update-ref -d "$TMPREF" >/dev/null 2>&1 || true
exit 0