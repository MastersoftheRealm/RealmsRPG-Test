# ClickUp ↔ GitHub Workflow

Reference for how ClickUp task statuses map to GitHub branch/PR lifecycle. See the [Realms Dev Workflow & Agent Rules](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit) (Drive SoT) for full process.

## ClickUp statuses (Web Development)

`to do` → `in progress` → `in review` → `testing` → `complete` | `cancelled`

## Status mapping

| Step | ClickUp status | GitHub action | Actor |
|------|---------------|---------------|-------|
| File task | **to do** | — | Clickup Manager |
| Claim task | **to do → in progress** | Create branch `bug\|feat/<clickUpId>-slug` | Human / Cursor agent (whoever picks it up) |
| Implement | **in progress** | Commits on branch | Cursor agent / human |
| Open PR | **in progress → in review** | PR opened; assign Collin | Cursor agent |
| PR review + CI | **in review** | PR Reviewer comments; CI runs | PR Reviewer + GitHub Actions |
| High-risk gate | **in review** (stays) | Kadin signs off | Kadin |
| Preview QA | **in review** | QA Tester checks Vercel preview | QA Tester |
| Merge | **in review → testing** | Collin merges (or Kadin bypass per §2.1) | Collin / Kadin |
| Post-merge QA | **testing → complete** (or back to **in progress**) | QA feedback on task | QA Tester + Bob, or Bob alone |

## Cursor agent ClickUp writes

Cursor agents may write to ClickUp **on Kadin's orders**. This includes:
- Moving their own task through **to do → in progress → in review**.
- Adding comments and editing descriptions.

Cursor agents do **not** merge PRs or move tasks to **testing** / **complete**.

## Branch naming

`bug/<clickUpId>-short-slug` or `feat/<clickUpId>-short-slug`

Include the ClickUp task ID in both the branch name and the PR description.
