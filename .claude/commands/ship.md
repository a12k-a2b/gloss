---
description: Commit, push, and open a draft PR for the current worktree
argument-hint: "[commit message]"
allowed-tools: Bash(vibe:*), Bash(git:*), Bash(gh:*), Read, Grep
---

Branch: !`git rev-parse --abbrev-ref HEAD`
Changes: !`git status --porcelain | head -30`
Diff summary: !`git diff --stat HEAD | tail -20`

Before shipping, do this review pass on your own diff — it is cheaper than a
reviewer finding it, and these are the things AI-written code gets wrong most:

- Does every new code path have a caller? Delete anything unreachable.
- Are errors handled, or swallowed by a bare `catch {}` / `except: pass`?
- Any API, flag, or package invented rather than verified? Check it exists.
- Any debug output, commented-out code, or `TODO` left behind?
- Does the change do only what was asked, or did scope creep in?
- Any secret, token, or absolute local path in the diff?

Fix what you find. Then run:

    vibe ship -m "<conventional-commit message describing the change>"

Use the message I gave in $ARGUMENTS if there is one. Report the PR URL.
