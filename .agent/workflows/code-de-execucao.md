---
description: Automatically execute all shell commands required for development
---

Automatically execute all shell commands required for development, build, installation, project execution, and testing, without asking for confirmation.

Includes, but is not limited to:
- npm, pnpm, yarn
- node, vite, tsc
- git pull, git push, git commit
- supabase, docker (build, up)
- reading and navigation commands (ls, cd, cat, echo)

⚠️ MANDATORY EXCEPTION:
Before executing any command that may delete, remove, or destroy files, folders, or data, ALWAYS ask the user for explicit confirmation.

This includes, but is not limited to:
- rm, rm -rf
- del, rmdir, unlink
- format, mkfs
- shutdown, reboot
- any command that can delete data or change permissions destructively

Security Rule:
When in doubt, ask for confirmation only if there is a risk of data loss.
Otherwise, execute automatically.

Never ask for confirmation for normal development commands.
Never execute destructive commands without explicit human approval.
