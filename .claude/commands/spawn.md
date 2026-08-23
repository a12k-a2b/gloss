---
description: Split work into independent tasks and run one isolated agent per task
argument-hint: "<the larger goal to parallelise>"
allowed-tools: Bash(vibe:*), Bash(git:*), Read, Grep, Glob
---

Currently in flight:

!`vibe wt ls 2>&1 | head -15`

Goal to parallelise: $ARGUMENTS

Do this in order, and stop for my approval before spawning anything:

1. **Decompose.** Break the goal into tasks that are genuinely independent —
   each one landable as its own small PR. Aim for 2–5. Fewer, cleaner splits
   beat more, entangled ones.

2. **Prove independence.** For each pair of tasks, name the files each will
   touch (use Grep/Glob to check, do not guess). If two tasks would edit the
   same file, they are not parallel: either merge them into one task, or
   sequence them and say which must land first. Two agents editing one file in
   two worktrees produces a merge conflict every time.

3. **Show me the plan** as a short list: slug, one-line task, files it owns,
   and any ordering constraint. Wait for my go-ahead.

4. **On approval**, run:

       vibe spawn -t "<task 1>" -t "<task 2>" ...

   That creates one worktree, branch and port per task and prints the briefs.
   Add `--launch` only if I ask for them to run unattended.

Respect the WIP limit. If we are already at it, say what should land first
instead of adding more.
