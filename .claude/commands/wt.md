---
description: Create an isolated worktree with its own branch and port
argument-hint: "<slug> [--task \"what you are doing\"]"
allowed-tools: Bash(vibe:*), Bash(git:*)
---

Existing worktrees:

!`vibe wt ls 2>&1 | head -20`

Create a workspace for: $ARGUMENTS

    vibe wt new $ARGUMENTS

Then `cd` into the printed path and `source .vibe/env` before doing anything
else. The `VIBE_PORT` it exports is yours alone — bind every dev server and
test server to it so you never collide with another agent on this machine.

Confirm the path, branch and port back to me, then start on the task.
