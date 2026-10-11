# AI Task Queue — Process

> **Retired as agent workflow (2026-10-11).** Do not read or update this file to do a task. ClickUp is the work queue. The PR and the task comment are the note. `WAITING_TASKS.md` stays only where a hold is not yet on the ClickUp task.

**Optional engineering notes:** [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md)  
**Blocked / human-owned:** [`WAITING_TASKS.md`](WAITING_TASKS.md)  
**Done history:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)

Do not follow the old steps that lived here (status blocks, changelog lines, commit-subject ids, session-start reads). File new work in ClickUp.

CI still rejects a duplicated or non-numeric `TASK-###` id inside the historical files (`scripts/reconcile_tasks.js`). That check does not require a commit subject. The commit-subject gate is removed.
