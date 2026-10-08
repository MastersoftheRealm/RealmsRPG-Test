# ClickUp ↔ GitHub Workflow

Short pointer — full process lives in the [Realms Dev Workflow & Agent Rules](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) (§3.1 lifecycle, §5 conventions, §10.1 credentials) and the ClickUp wiki [Realms Workflow](https://app.clickup.com/9017636492/docs/8cqwdmc-3357/8cqwdmc-397) page.

## ClickUp statuses (Web Development)

`to do` → `in progress` → `in review` → `testing` → `complete` | `cancelled`

## Cursor agent ClickUp writes

Cursor agents may move tasks, add comments, and edit descriptions **only when Kadin tells them to** (Workflow §10.1). Clickup Manager (using Kadin's personal API token) is the only Grok bot that writes to ClickUp; Cursor agents use the workspace connector's call quota.

## Bypass merge

Collin merges normally. After a bypass merge without Collin:

- Move the task to **testing**.
- Comment QA instructions for what changed.
- Add James Owenby, and keep Collin assigned.
- Collin can move the task to **in review** if he still wants to review it.
