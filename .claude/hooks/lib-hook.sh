#!/usr/bin/env bash
# Shared helpers for vibe hooks.
#
# Hooks run on every tool call, so they must be fast, silent when nothing is
# wrong, and incapable of wedging a session. Every helper here fails open.

# Read stdin exactly once, at source time.
#
# It has to happen here rather than lazily inside hook_read: every hook_field
# call runs in a command substitution, so a lazy read would consume stdin in a
# subshell and every later lookup would come back empty.
HOOK_JSON=""
if [ ! -t 0 ]; then
  HOOK_JSON=$(cat 2>/dev/null || true)
fi
hook_read() { printf '%s' "$HOOK_JSON"; }

# hook_field <jq-path>  e.g. hook_field '.tool_input.command'
# Returns "" for missing values, never fails.
hook_field() {
  local path="$1" json
  json=$(hook_read)
  [ -n "$json" ] || return 0
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$json" | jq -r "$path // \"\"" 2>/dev/null || true
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$json" | python3 -c '
import json, sys
path = sys.argv[1].lstrip(".").split(".")
try:
    cur = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for key in path:
    if isinstance(cur, dict) and key in cur:
        cur = cur[key]
    else:
        sys.exit(0)
if cur is None:
    sys.exit(0)
sys.stdout.write(cur if isinstance(cur, str) else json.dumps(cur))
' "$path" 2>/dev/null || true
  fi
}

# Where the agent is ACTUALLY working right now.
#
# Not $CLAUDE_PROJECT_DIR: that deliberately stays pinned to the directory the
# session was launched from and does not follow Claude into a worktree. A hook
# that trusts it will inspect the main checkout's branch and dirty state while
# the agent is editing a completely different tree - reporting the wrong branch,
# guarding the wrong commits, and assigning the wrong port.
#
# The hook payload's `cwd` field is the session's real working directory, so it
# is the first choice. $CLAUDE_PROJECT_DIR is a fallback for events that do not
# carry one.
hook_project_dir() {
  local cwd
  cwd=$(hook_field '.cwd')
  if [ -n "$cwd" ] && [ -d "$cwd" ]; then
    printf '%s' "$cwd"
    return 0
  fi
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    printf '%s' "$CLAUDE_PROJECT_DIR"
  else
    git rev-parse --show-toplevel 2>/dev/null || pwd
  fi
}

# Block the tool call: stderr goes back to Claude, exit 2 stops the call.
hook_block() { printf '%s\n' "$*" >&2; exit 2; }

# Bail out quietly. Used everywhere a check cannot run.
hook_skip() { exit 0; }

hook_in_repo() { git rev-parse --git-dir >/dev/null 2>&1; }

hook_default_branch() {
  local b
  b=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
  if [ -z "$b" ]; then
    for c in main master trunk; do
      git show-ref --verify --quiet "refs/remotes/origin/$c" && { b="$c"; break; }
    done
  fi
  printf '%s' "${b:-main}"
}

# A clone made with --depth 1 / --single-branch has a narrow fetch refspec, so
# git never creates origin/<branch> for anything but the default branch. Under
# that refspec `git rev-list HEAD --not --remotes` counts pushed commits as
# unpushed, and this hook would nag about work that is already on the remote.
# A guard that cries wolf gets muted, and then the real warning is muted too.
hook_remote_is_single_branch() {
  local specs
  specs=$(git config --get-all remote.origin.fetch 2>/dev/null) || return 1
  [ -n "$specs" ] || return 1
  case "$specs" in *'refs/heads/*'*) return 1 ;; *) return 0 ;; esac
}

hook_unpushed_count() {
  local branch="${1:-HEAD}" n name local_sha remote_sha
  n=$(git rev-list --count "$branch" --not --remotes 2>/dev/null || echo 0)
  [ "${n:-0}" -gt 0 ] || { printf '0\n'; return 0; }
  hook_remote_is_single_branch || { printf '%s\n' "$n"; return 0; }
  name=$(git rev-parse --abbrev-ref "$branch" 2>/dev/null)
  [ -n "$name" ] && [ "$name" != "HEAD" ] || { printf '%s\n' "$n"; return 0; }
  local_sha=$(git rev-parse --verify --quiet "$branch^{commit}" 2>/dev/null)
  # One network call, only on the path that is about to block the session.
  remote_sha=$(git ls-remote origin "refs/heads/$name" 2>/dev/null | awk '{print $1}')
  if [ -n "$remote_sha" ] && [ "$remote_sha" = "$local_sha" ]; then printf '0\n'; return 0; fi
  printf '%s\n' "$n"
}
