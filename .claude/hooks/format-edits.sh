#!/usr/bin/env bash
# PostToolUse:Edit|Write|MultiEdit - format the file that just changed, and
# report lint errors back to the agent while it still has the context to fix them.
#
# Formatting after the fact means no agent ever has to think about style, and
# diffs stay free of whitespace noise - which matters most when a human is
# reviewing ten AI-authored PRs in a row.
#
# Only formatters that are already installed in the repo are used; nothing is
# ever downloaded. Only sub-second linters run inline - a five-second eslint on
# every edit would make the agent slower than doing it by hand, so full linting
# is left to CI.

set -uo pipefail
DIR=$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$DIR/lib-hook.sh"

FILE=$(hook_field '.tool_input.file_path')
[ -n "$FILE" ] || hook_skip
[ -f "$FILE" ] || hook_skip

cd "$(hook_project_dir)" 2>/dev/null || true

# Never reformat what the repo deliberately excludes.
if git check-ignore -q "$FILE" 2>/dev/null; then hook_skip; fi
case "$FILE" in
  */node_modules/*|*/.git/*|*/dist/*|*/build/*|*/vendor/*|*.min.*|*/target/*)
    hook_skip ;;
esac

has() { command -v "$1" >/dev/null 2>&1; }

# macOS ships neither `timeout` nor `gtimeout` by default. Capturing a shell's
# "command not found" into the lint output made the hook block every edit with
# an error it invented - so degrade to running the tool directly instead.
if has timeout; then     TIMEOUT=timeout
elif has gtimeout; then  TIMEOUT=gtimeout
else                     TIMEOUT=""
fi
cap() { # cap <seconds> <cmd...>
  local secs="$1"; shift
  if [ -n "$TIMEOUT" ]; then "$TIMEOUT" "$secs" "$@"; else "$@"; fi
}
run() { cap "${VIBE_HOOK_TIMEOUT:-20}" "$@" >/dev/null 2>&1 || true; }
# Prefer a locally installed binary over a global one, so the repo's pinned
# version wins.
local_bin() { [ -x "node_modules/.bin/$1" ] && printf 'node_modules/.bin/%s' "$1"; }

LINT_OUT=""

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.jsonc|*.css|*.scss|*.html|*.vue|*.svelte)
    if [ -n "$(local_bin biome)" ] || has biome; then
      BIOME=$(local_bin biome || echo biome)
      run "$BIOME" check --write "$FILE"
      LINT_OUT=$(cap 15 "$BIOME" check "$FILE" 2>&1 | head -25 || true)
    elif [ -n "$(local_bin prettier)" ] || has prettier; then
      PRETTIER=$(local_bin prettier || echo prettier)
      run "$PRETTIER" --write --log-level=silent "$FILE"
    elif has deno && [ -f deno.json ]; then
      run deno fmt "$FILE"
    fi
    ;;
  *.py)
    if has ruff; then
      run ruff format "$FILE"
      run ruff check --fix --quiet "$FILE"
      LINT_OUT=$(cap 15 ruff check --quiet "$FILE" 2>&1 | head -25 || true)
    elif has black; then
      run black --quiet "$FILE"
    fi
    ;;
  *.go)   has gofmt && run gofmt -w "$FILE" ;;
  *.rs)   has rustfmt && run rustfmt --edition 2021 "$FILE" ;;
  *.sh|*.bash)
    has shfmt && run shfmt -w -i 2 -ci "$FILE"
    if has shellcheck; then
      LINT_OUT=$(cap 15 shellcheck -S warning "$FILE" 2>&1 | head -25 || true)
    fi
    ;;
  *.kt|*.kts) has ktlint && run ktlint -F "$FILE" ;;
  *.java)  has google-java-format && run google-java-format -i "$FILE" ;;
  *.tf)    has terraform && run terraform fmt "$FILE" ;;
  *.yml|*.yaml)
    # A malformed workflow file only fails once it has been pushed and a run
    # has been queued, which is a slow way to find a typo.
    case "$FILE" in
      */.github/workflows/*)
        if has actionlint; then
          LINT_OUT=$(cap 15 actionlint "$FILE" 2>&1 | head -25 || true)
        fi ;;
    esac
    # Only when PyYAML is actually importable - otherwise an ImportError would
    # be reported to the agent as a syntax error in a perfectly good file.
    if has python3 && python3 -c 'import yaml' 2>/dev/null; then
      # safe_load_all, not safe_load: a multi-document file (--- separators,
      # normal for Kubernetes and for some CI configs) makes safe_load raise on
      # a perfectly valid file, and the hook would then reject every edit to it
      # forever. Unknown tags are a different story - report those, since a
      # plain YAML consumer would choke too.
      if ! python3 -c 'import sys,yaml; list(yaml.safe_load_all(open(sys.argv[1])))' "$FILE" 2>/dev/null; then
        LINT_OUT="${LINT_OUT}
$FILE is not valid YAML."
      fi
    fi
    ;;
esac

# Exit 2 puts stderr in front of the agent as something to act on. Anything
# else (including formatter noise) stays out of the way.
if [ -n "$(printf '%s' "$LINT_OUT" | tr -d '[:space:]')" ]; then
  printf 'Lint reports problems in %s. Some may predate this edit - fix the ones\nthis change introduced, and say so if the rest are pre-existing:\n%s\n' \
    "$FILE" "$LINT_OUT" >&2
  exit 2
fi
exit 0
