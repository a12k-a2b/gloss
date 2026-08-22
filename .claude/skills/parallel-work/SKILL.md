---
name: parallel-work
description: How to run several coding agents at once without them colliding, and how to keep the resulting branches from piling up. Use when starting work that could be split across agents, when asked to parallelise something, when deciding whether a branch is safe to delete, or when work seems to have gone missing across branches and worktrees.
allowed-tools: Bash, Read, Grep, Glob
---

# Running work in parallel without losing it

Two failure modes account for almost all the pain, and they pull in opposite
directions. Agents that share state overwrite each other. Agents that are
properly isolated produce branches faster than anyone reviews them, and the
surplus rots. Isolation is the easy half; the second half is what this covers.

## Isolate first

One agent, one worktree, one branch, one port.

```
vibe wt new <slug> --task "<what this agent is doing>"
cd "$(vibe wt path <slug>)" && source .vibe/env
```

Worktrees isolate *files*. They do not isolate *runtime*. Two agents in two
worktrees will still fight over port 3000, over one Postgres database, over a
shared Redis, and over a global build cache. `source .vibe/env` gives this
workspace a port derived from its slug — deterministic, so it survives restarts,
and collision-free without any allocator. Use `$VIBE_PORT`, never a default.

Claude Code has its own worktree machinery that works the same way:
`claude --worktree <name>` creates `.claude/worktrees/<name>` on branch
`worktree-<name>`, and a `.worktreeinclude` file (gitignore syntax) at the repo
root copies gitignored files like `.env` into each new worktree. Use whichever
you prefer; do not use both for one piece of work.

## Split work so the splits are real

Before spawning anything, prove the tasks are independent: name the files each
one will touch, by looking, not by guessing. Two agents editing one file in two
worktrees produce a merge conflict every single time — the isolation just delays
the collision until merge.

Things that look parallel and are not: two features touching one lockfile; two
migrations against one schema; two changes to a shared type or config; anything
that requires renaming something a sibling task also references.

If two tasks collide, either merge them into one task or sequence them and say
which lands first.

## Respect the WIP limit

The ceiling is not compute, it is review. Somewhere around five or six
concurrent agents, the reviewer becomes the bottleneck and every additional
agent just lengthens the queue. `vibe spawn` enforces a limit for this reason.
When you hit it, the answer is to land something, not to raise the limit.

## Land work, do not accumulate it

Every branch is in exactly one of four states, and only one of them is fine:

| State | What it means | What to do |
| --- | --- | --- |
| Open PR, green | working as intended | review and merge |
| Open PR, red or conflicted | blocked | fix it now, it will only get worse |
| Pushed, no PR | invisible; nobody will ever see it | `vibe ship` or delete it |
| Local only | invisible and unbacked-up | `vibe ship` or delete it |

`vibe fleet` classifies every branch across every repo this way; `vibe triage`
reduces it to the few that need you.

## Deleting a branch safely

**`git branch --merged` is wrong**, and this is the single biggest cause of
branch sprawl. GitHub's default merge is a squash, which replaces the branch's
commits with one new commit with a different hash. Ancestry is broken by design,
so `--merged` never lists a squash-merged branch. Per-commit `git cherry` fails
the same way, because a squash combines several patches into one.

The result is that finished work looks identical to abandoned work, so nothing
ever gets deleted and the list grows until it is useless.

Use `vibe landed <branch>`. It reconstructs the branch's final tree as a
synthetic commit on the merge-base and asks `git cherry` whether that patch is
already in the base — which is exactly what the squash produced, so it matches.
It stays correct after the base branch moves on.

```
vibe landed claude/pwm-fix     # "squash-merged into main - safe to delete"
vibe wt clean --apply          # removes every worktree whose branch landed
vibe fleet --prune             # deletes those branches on the remote too
```

Nothing is deleted while it holds uncommitted changes or unpushed commits —
`vibe wt rm` and `vibe wt clean` both refuse, and the unpushed check accounts
for single-branch clones, where `git rev-list --not --remotes` reports pushed
work as unpushed.

## Ending a session

Never leave work uncommitted, unpushed, or without a PR. Each of those makes it
invisible to every tool here and to every human. A Stop hook will refuse to let
a session end that way; the fix is `vibe ship`, not an override.
