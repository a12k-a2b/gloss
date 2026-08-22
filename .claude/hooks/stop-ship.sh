#!/usr/bin/env bash
# Stop hook - do not let a session end with work stranded in a worktree.
#
# This is the single highest-value automation in the toolkit. Work that is
# finished but uncommitted, or committed but unpushed, or pushed but with no
# pull request, is invisible: it does not show up in `vibe fleet`, no reviewer
# sees it, and three weeks later nobody remembers what the branch was for.
# Every abandoned experiment starts as a session that just ended.
#
# Exit 2 hands the reason back to the agent and keeps the turn going.

set -uo pipefail
DIR=$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$DIR/lib-hook.sh"

# Claude Code re-runs Stop hooks after the agent responds to one. Without this
# guard the session cannot ever end.
ACTIVE=$(hook_field '.stop_hook_active')
[ "$ACTIVE" = "true" ] && hook_skip

# This script is registered for Stop AND SubagentStop. Subagents are where
# unreviewed work is generated fastest - /batch fans out 5-30 of them - so the
# gate has to cover them, but the bar differs: a subagent's parent opens the PR,
# so requiring one here would block work that is about to be shipped correctly.
EVENT=$(hook_field '.hook_event_name')
IS_SUBAGENT=0
[ "$EVENT" = "SubagentStop" ] && IS_SUBAGENT=1

cd "$(hook_project_dir)" 2>/dev/null || hook_skip
hook_in_repo || hook_skip
[ -n "$(git remote 2>/dev/null)" ] || hook_skip

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
DEFAULT=$(hook_default_branch)

# On the default branch there is no branch to ship; the bash guard already
# stops commits from landing there.
[ "$BRANCH" = "$DEFAULT" ] && hook_skip
[ -n "$BRANCH" ] || hook_skip
[ -n "${VIBE_SKIP_STOP_GUARD:-}" ] && hook_skip

DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
UNPUSHED=$(hook_unpushed_count HEAD)

if [ "${DIRTY:-0}" -gt 0 ]; then
  printf 'This session is ending with %s uncommitted file(s) on %s.\n' "$DIRTY" "$BRANCH" >&2
  printf 'Uncommitted work in a worktree is invisible to everything else.\n' >&2
  printf 'Run `vibe ship -m "<what you did>"` to commit, push and open a draft PR.\n' >&2
  printf 'If the changes really are scratch, delete them or say so explicitly.\n' >&2
  exit 2
fi

if [ "${UNPUSHED:-0}" -gt 0 ]; then
  printf '%s has %s unpushed commit(s). They exist only on this machine.\n' \
    "$BRANCH" "$UNPUSHED" >&2
  printf 'Run `vibe ship` to push and open a draft PR.\n' >&2
  exit 2
fi

# Pushed, but is anyone going to see it? A branch with no PR is the most common
# way finished work gets lost.
if [ "$IS_SUBAGENT" -eq 0 ] && command -v gh >/dev/null 2>&1 && [ -z "${VIBE_NO_AUTO_PR:-}" ]; then
  AHEAD=$(git rev-list --count "origin/$DEFAULT..HEAD" 2>/dev/null || echo 0)
  if [ "${AHEAD:-0}" -gt 0 ]; then
    if command -v timeout >/dev/null 2>&1; then GHT="timeout 10"
    elif command -v gtimeout >/dev/null 2>&1; then GHT="gtimeout 10"
    else GHT=""; fi
    # Bounded: a slow or hanging GitHub API must not hold a session open.
    PR=$($GHT gh pr list --head "$BRANCH" --state all --limit 1 --json number \
           --jq '.[0].number' 2>/dev/null || true)
    if [ -z "$PR" ]; then
      printf '%s is pushed with %s commit(s) ahead of %s but has no pull request.\n' \
        "$BRANCH" "$AHEAD" "$DEFAULT" >&2
      printf 'Open one now so it is reviewable and shows up in `vibe fleet`:\n' >&2
      printf '    vibe ship   (it will skip the commit step when there is nothing to commit)\n' >&2
      printf 'If this branch is deliberately not for review, run `vibe wt rm %s` to retire it.\n' \
        "${BRANCH#*/}" >&2
      exit 2
    fi
  fi
fi

exit 0
