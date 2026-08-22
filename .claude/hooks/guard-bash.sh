#!/usr/bin/env bash
# PreToolUse:Bash - refuse the handful of commands that lose work.
#
# This is deliberately a short list. A guard that fires on ordinary commands
# gets disabled within a day, so it only blocks things that are unrecoverable
# or that break other agents' worktrees. Everything else is allowed through.
#
# Exit 2 blocks the call and hands stderr back to Claude to act on.

set -uo pipefail
DIR=$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$DIR/lib-hook.sh"

CMD=$(hook_field '.tool_input.command')
[ -n "$CMD" ] || hook_skip

cd "$(hook_project_dir)" 2>/dev/null || hook_skip
hook_in_repo || hook_skip

DEFAULT=$(hook_default_branch)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# An escape hatch has to be visible in the command itself. A PreToolUse hook
# receives the command as text and runs in its own process, so an inline
# `VAR=1 cmd` prefix never reaches this environment - checking only the env
# made every documented override a no-op.
opted_out() { # <VAR_NAME>
  case "$CMD" in *"$1=1"*|*"$1=true"*) return 0 ;; esac
  eval "[ -n \"\${$1:-}\" ]"
}

# Collapse whitespace so `git   push  --force` matches too.
FLAT=$(printf '%s' "$CMD" | tr '\n' ' ' | tr -s ' ')

# Only inspect segments that actually INVOKE git. Matching raw substrings of
# the whole command line blocks things that merely mention a git verb -
# `echo "run git commit next"`, `grep -r "git push --force" docs/`, or a commit
# message containing the words. A guard that blocks reading a file about git is
# noise, and noise is what gets guards disabled.
#
# Split on shell separators, drop leading env assignments (VAR=1 git ...), and
# keep only segments whose first word is git.
git_segments() {
  # printf '%s\n', not '%s': without the trailing newline `while read` drops
  # the final line, and for a single-command input that is the only line - so
  # every guard silently passed.
  printf '%s\n' "$FLAT" \
    | sed 's/&&/\n/g; s/||/\n/g; s/;/\n/g; s/|/\n/g' \
    | while IFS= read -r seg; do
        seg=$(printf '%s' "$seg" | sed 's/^ *//; s/ *$//')
        while :; do
          case "$seg" in
            [A-Za-z_][A-Za-z_0-9]*=*\ *) seg=${seg#* } ;;
            *) break ;;
          esac
        done
        case "$seg" in git\ *) printf '%s\n' "$seg" ;; esac
      done
}
GIT_SEGS=$(git_segments)

# 1. Force-push to a shared branch destroys other agents' bases.
case "$GIT_SEGS" in
  *"git push"*)
    # Isolate the push invocation itself. Testing the exemption against the
    # whole line let one safe push anywhere in a compound command exempt every
    # other push in it.
    PUSH_SEG=$(printf '%s' "$GIT_SEGS" \
               | grep -- 'git push' | grep -E -- '--force|[[:space:]]-f([[:space:]]|$)|--delete' \
               | grep -v -- '--force-with-lease' \
               | grep -v -- '--dry-run' | head -1)   # a dry run pushes nothing
    case "${PUSH_SEG:-}" in
      "") ;;  # every forceful push in this line uses --force-with-lease
      *)
        for prot in "$DEFAULT" main master trunk develop; do
          case "$PUSH_SEG" in
            *" $prot"|*" $prot "|*":$prot"*|*"origin $prot"*)
              hook_block "Refusing: force-push/delete targeting '$prot'.
Other worktrees and open PRs are based on it. If you must rewrite a branch you
own, use --force-with-lease on your own feature branch instead."
              ;;
          esac
        done
        ;;
    esac
    ;;
esac

# 2. Committing straight to the default branch is how parallel work collides.
case "$GIT_SEGS" in
  *"git commit"*)
    if [ "$BRANCH" = "$DEFAULT" ] && ! opted_out VIBE_ALLOW_DEFAULT_COMMIT; then
      hook_block "Refusing: commit directly to '$DEFAULT'.
Create an isolated workspace first:
    vibe wt new <slug> --task \"<what you are doing>\"
then commit there and run 'vibe ship'. To override for a one-off (a hotfix, a
README typo), re-run with VIBE_ALLOW_DEFAULT_COMMIT=1 in front of the command."
    fi
    ;;
esac

# 3. Hard reset / clean with uncommitted work in the tree.
if ! opted_out VIBE_ALLOW_DISCARD; then
# A dry run discards nothing, and restoring one named path is not a whole-tree
# discard - blocking either teaches people to reach for the override reflexively.
case "$GIT_SEGS" in
  *--dry-run*|*"git restore "[!.]*|*"git checkout -- "[!.]*) ;;
  *"git reset --hard"*|*"git checkout ."*|*"git clean -"*[fdx]*|*"git restore ."*)
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
      hook_block "Refusing: '$FLAT' would discard uncommitted changes in this worktree.
Stash them first ('git stash push -u -m <why>') or commit them to a branch.
If the changes really are disposable, say so and re-run with VIBE_ALLOW_DISCARD=1."
    fi
    ;;
esac
fi

# 4. Removing another worktree's directory from inside this one.
case "$FLAT" in
  *"rm -rf"*|*"rm -fr"*)
    # Only object when the target is a sibling worktree, not ordinary cleanup.
    while IFS= read -r wt; do
      [ -n "$wt" ] || continue
      [ "$wt" = "$(pwd)" ] && continue
      case "$FLAT" in
        *"$wt"*)
          hook_block "Refusing: '$wt' is another agent's live worktree.
Use 'vibe wt rm <slug>' - it checks for unpushed work before removing anything."
          ;;
      esac
    done <<EOF
$(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print substr($0,10)}')
EOF
    ;;
esac

# 5. `git checkout <branch>` inside a worktree that owns a branch: switching
#    away silently orphans the worktree's identity and its port mapping.
case "$GIT_SEGS" in
  # A pathspec checkout (`git checkout main -- file`) is not a branch switch.
  *" -- "*) ;;
  "git checkout "[!-]*|"git switch "[!-]*)
    if [ -f .vibe/workspace.json ]; then
      OWN=$(sed -n 's/.*"branch": *"\([^"]*\)".*/\1/p' .vibe/workspace.json | head -1)
      case "$FLAT" in
        *"$OWN"*|*" -b "*|*"--detach"*) ;;
        *)
          hook_block "Refusing: this worktree is bound to '$OWN'.
Switching branches here breaks its port assignment and confuses 'vibe wt ls'.
Open a separate workspace instead: vibe wt new <slug>"
          ;;
      esac
    fi
    ;;
esac

exit 0
