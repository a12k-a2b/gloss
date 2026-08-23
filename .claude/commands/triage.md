---
description: Rank outstanding work and fix the single worst thing
argument-hint: "[--deep]"
allowed-tools: Bash(vibe:*), Bash(git:*), Bash(gh:*), Read, Edit, Write, Grep, Glob
---

!`vibe triage $ARGUMENTS 2>&1 | head -60`

Take the **top item only**. Work it to a resolution:

- **CI failing** → read the failing job log (`gh run view --log-failed`), find the
  root cause, fix it, push. A re-run is not a fix.
- **Merge conflict** → merge the base branch in and resolve. Never rebase or
  force-push a branch that has an open PR.
- **Idle PR** → say in one line what is blocking it, and either finish it or
  close it with a reason.
- **Orphan branch with no PR** → decide: `vibe ship` it, or `vibe wt rm` it.
  Do not leave it in limbo, that is how it got here.

Fix one thing completely rather than touching five things. Report what you did
and what the next item would be.
