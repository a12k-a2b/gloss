#!/usr/bin/env bash
# SessionStart hook - tell the agent where it is before it does anything.
#
# The single biggest failure mode with many parallel agents is an agent that
# does not know which branch/worktree/port it owns, so it works on the wrong
# tree, restarts a dev server another agent is using, or commits to the default
# branch. Everything printed here is added to the session's context.
#
# stdout on exit 0 becomes context, so this must stay short: a screenful, not a
# report. Anything longer belongs behind `vibe fleet`.

set -uo pipefail
DIR=$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$DIR/lib-hook.sh"

# cd FIRST: the check has to run where the agent actually is, not where this
# hook process happened to start.
cd "$(hook_project_dir)" 2>/dev/null || hook_skip
hook_in_repo || hook_skip

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
DEFAULT=$(hook_default_branch)
REPO=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")

echo "## Workspace"
echo "repo=$REPO branch=$BRANCH default=$DEFAULT"

# A worktree created by \`vibe wt new\` carries its own identity and port.
if [ -f .vibe/workspace.json ]; then
  SLUG=$(sed -n 's/.*"slug": *"\([^"]*\)".*/\1/p' .vibe/workspace.json | head -1)
  PORT=$(sed -n 's/.*"port": *\([0-9]*\).*/\1/p' .vibe/workspace.json | head -1)
  TASK=$(sed -n 's/.*"task": *"\(.*\)",*$/\1/p' .vibe/workspace.json | head -1)
  echo "worktree=$SLUG port=$PORT"
  [ -n "$TASK" ] && echo "assigned task: $TASK"
  echo "Bind every dev server / test server to port $PORT (it is yours alone)."
elif [ "$BRANCH" = "$DEFAULT" ]; then
  echo
  echo "You are on the default branch. Before writing code, run:"
  echo "    vibe wt new <short-slug> --task \"<what you are doing>\""
  echo "and work in that worktree. Never commit directly to $DEFAULT."
fi

# Local state that would otherwise be discovered only at commit time.
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
UNPUSHED=$(git rev-list --count HEAD --not --remotes 2>/dev/null || echo 0)
if [ "${DIRTY:-0}" -gt 0 ] || [ "${UNPUSHED:-0}" -gt 0 ]; then
  echo
  echo "Inherited state: $DIRTY uncommitted file(s), $UNPUSHED unpushed commit(s)."
  echo "Decide whether that work is yours before adding to it."
fi

# Other live worktrees, so this agent does not duplicate or trample them.
COUNT=$(git worktree list 2>/dev/null | wc -l | tr -d ' ')
if [ "${COUNT:-1}" -gt 1 ]; then
  echo
  echo "## Other agents are working here"
  git worktree list --porcelain 2>/dev/null \
    | awk '/^worktree /{w=substr($0,10)} /^branch /{print "  " w " -> " substr($0,8)}' \
    | grep -v "$(pwd)" | head -8
  echo "Do not edit files under those paths."
fi

# Cached fleet summary. Never fetches: a session start must not wait on the
# network, so this only reports what a previous \`vibe fleet\` already learned.
STATE="${VIBE_HOME:-${XDG_STATE_HOME:-$HOME/.local/state}/vibe}/fleet-report.json"
if [ -f "$STATE" ] && command -v python3 >/dev/null 2>&1; then
  python3 - "$STATE" <<'PY' 2>/dev/null || true
import json, os, sys, time
try:
    rep = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
age_h = (time.time() - os.path.getmtime(sys.argv[1])) / 3600
if age_h > 48:
    sys.exit(0)
loose, prs = len(rep.get("loose_branches", [])), len(rep.get("prs", []))
dele = len(rep.get("deletable_branches", []))
if not (loose or prs or dele):
    sys.exit(0)
print(f"\n## Fleet (cached {age_h:.0f}h ago)")
print(f"{prs} open PRs, {loose} branches with unmerged work and no PR, {dele} deletable.")
top = sorted(rep.get("prs", []), key=lambda p: -p.get("score", 0))[:2]
for pr in top:
    if pr.get("score", 0) > 30:
        print(f"  needs attention: {pr['repo']}#{pr['number']} - {', '.join(pr['reasons'])}")
PY
fi

echo
echo "House rules: work in a worktree, keep PRs small, run \`vibe ship\` when a"
echo "slice is done, \`vibe land\` after it merges. \`vibe fleet\` shows everything in flight."
exit 0
