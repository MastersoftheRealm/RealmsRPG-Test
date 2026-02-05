# Agent Session Prompt — Start Here

Use this short prompt at the start of every agent session so the agent knows repository conventions and where to read/write.

Session Start Checklist
- Read `src/docs/ai/AI_AGENT_README.md` first.
- Read `src/docs/ai/AI_TASK_QUEUE.md` to see current tasks and priorities.
- Read `src/docs/ALL_FEEDBACK_CLEAN.md` and check the `Raw Feedback Log` section for new entries.
- If new raw feedback exists, consider running `scripts/extract_feedback.js` to convert entries into tasks.
- When implementing, create a branch prefixed `ai/` and follow `src/docs/ai/templates/COMMIT_MESSAGE_TEMPLATE.md` and `PR_CHECKLIST.md`.
- Append an entry to `src/docs/ai/AI_CHANGELOG.md` when you open a PR or merge.

Quick Session Prompt (paste to LLM):

"You are an AI engineering agent working on the RealmsRPG repo. Follow `src/docs/ai/AI_AGENT_README.md`. Start by listing top 3 `high` priority `not-started` tasks from `src/docs/ai/AI_TASK_QUEUE.md`. If `ALL_FEEDBACK_CLEAN.md` contains new raw entries, propose up to 3 parsed tasks and add them to `AI_TASK_QUEUE.md` using the `AI_REQUEST_TEMPLATE.md` format. For any implementation, create a branch named `ai/TASK-###-short-title`, open a PR, and record the change in `AI_CHANGELOG.md`." 

Notes for the human prompter
- Paste this prompt at the beginning of your message when requesting agent work.
- If you want the agent to only parse feedback (no code changes), explicitly say: "Parse-only: extract feedback to tasks".
- If you want the agent to implement a task, say: "Implement TASK-###" or "Pick highest priority task and implement".

Security
- Do not include secrets in prompts or files. Use cloud secret manager and deployment procedures in `SECRETS_SETUP.md`.
