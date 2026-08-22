#!/usr/bin/env bash
# PreToolUse:Write|Edit|MultiEdit - stop a credential before it reaches disk.
#
# Once a secret is committed it is in the reflog, in the push, and in every
# clone; rotating it is the only real fix. Catching it at the write is orders of
# magnitude cheaper than catching it in CI.
#
# Only high-confidence, vendor-prefixed patterns are matched. Generic entropy
# checks produce false positives on hashes and minified code, and a guard that
# cries wolf gets switched off.

set -uo pipefail
DIR=$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$DIR/lib-hook.sh"

FILE=$(hook_field '.tool_input.file_path')
CONTENT=$(hook_field '.tool_input.content')
[ -n "$CONTENT" ] || CONTENT=$(hook_field '.tool_input.new_string')
if [ -z "$CONTENT" ]; then
  # MultiEdit: every replacement lives under .edits[].new_string
  CONTENT=$(hook_field '.tool_input.edits')
fi
[ -n "$CONTENT" ] || hook_skip

# Files whose whole purpose is to hold placeholders.
case "$FILE" in
  *.example|*.sample|*.template|*.md|*/testdata/*|*_test.*|*.test.*|*/fixtures/*)
    hook_skip ;;
esac

match() { printf '%s' "$CONTENT" | grep -Eq -e "$1"; }

FOUND=""
match 'AKIA[0-9A-Z]{16}'                        && FOUND="AWS access key id"
match '(ghp|gho|ghs|ghu)_[A-Za-z0-9]{36}'       && FOUND="GitHub token"
match 'github_pat_[A-Za-z0-9_]{60,}'            && FOUND="GitHub fine-grained PAT"
match 'xox[baprs]-[A-Za-z0-9-]{10,}'            && FOUND="Slack token"
match 'sk-ant-[A-Za-z0-9_-]{20,}'               && FOUND="Anthropic API key"
match 'sk-(proj-)?[A-Za-z0-9]{40,}'             && FOUND="OpenAI API key"
match '(sk|rk)_live_[A-Za-z0-9]{20,}'           && FOUND="Stripe live key"
match 'AIza[0-9A-Za-z_-]{35}'                   && FOUND="Google API key"
match 'glpat-[A-Za-z0-9_-]{20,}'                && FOUND="GitLab token"
match '-----BEGIN [A-Z ]*PRIVATE KEY-----'      && FOUND="private key block"
match 'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.' && FOUND="signed JWT"

if [ -n "$FOUND" ]; then
  hook_block "Refusing to write $FILE: it contains what looks like a real $FOUND.

Put the value in an environment variable or a gitignored .env / .dev.vars file
and read it at runtime. If this is a placeholder, make it obviously fake
(e.g. 'AKIAEXAMPLEEXAMPLE') or give the file a .example suffix."
fi

exit 0
