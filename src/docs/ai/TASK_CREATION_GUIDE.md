# Task Creation Guide for AI Agents

## Philosophy
**Don't let discoveries go to waste.** When you find issues, inconsistencies, or improvement opportunities during your work, create tasks immediately. This ensures valuable audit insights and discoveries get acted upon rather than buried in notes.

## When to Create New Tasks

### ✅ During Audits & Code Reviews
**Create tasks for every actionable finding:**
- Found inconsistent styling across components → Create task
- Discovered unused code or dependencies → Create task  
- Identified missing error handling → Create task
- Spotted performance issues → Create task

**Example:**
```yaml
- id: TASK-038
  title: Remove unused imports from 5+ components
  priority: low
  status: not-started
  created_at: 2026-02-05
  created_by: agent
  description: During TASK-002 audit, found unused imports in character-sheet components that should be cleaned up
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
  notes: "Created during TASK-002 audit. Affects 5 components, see full list in related_files"
```

### ✅ During Task Implementation
**When completing a task reveals more work:**
- Discovered a related bug while fixing another → Create task
- Found edge cases not covered → Create task
- Identified opportunities for refactoring → Create task

**Example:**
```yaml
- id: TASK-039
  title: Fix edge case - equip toggle fails for items with spaces in name
  priority: medium
  status: not-started
  created_at: 2026-02-05
  created_by: agent
  description: While implementing TASK-034 equip toggle, discovered items with spaces in names fail to match correctly
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  notes: "Discovered during TASK-034 implementation. Need to update name matching logic to handle URL encoding"
```

### ✅ Breaking Down Complex Tasks
**For large or multi-phase work:**
- Phase 1: Research/audit → Create tasks for each finding
- Phase 2: Implementation → Create sub-tasks for each component
- Phase 3: Polish → Create tasks for edge cases and improvements

**Example:**
```yaml
- id: TASK-040
  title: Dice roller overhaul - Phase 1: Custom images
  priority: high
  status: not-started
  created_at: 2026-02-05
  created_by: agent
  description: Part 1 of TASK-032 dice roller overhaul - implement custom dice images from vanilla site
  related_files:
    - src/components/shared/dice-roller.tsx
  notes: "Broken out from TASK-032. Phase 1 of 3. Depends on: none. Unlocks: TASK-041, TASK-042"

- id: TASK-041
  title: Dice roller overhaul - Phase 2: Roll persistence
  priority: high
  status: not-started
  created_at: 2026-02-05
  created_by: agent
  description: Part 2 of TASK-032 - implement localStorage persistence for last 20 rolls
  related_files:
    - src/components/shared/dice-roller.tsx
  notes: "Broken out from TASK-032. Phase 2 of 3. Depends on: TASK-040"
```

### ✅ After Completing a Task
**Follow-up improvements discovered:**
- Completed fix but found related areas needing same fix → Create task
- Implemented feature but identified enhancements → Create task
- Fixed bug but found similar patterns elsewhere → Create task

## How to Create Tasks

### 1. Check for Duplicates First
Search AI_TASK_QUEUE.md to ensure you're not creating a duplicate:
```bash
# Search for similar titles/descriptions
grep -i "keyword" src/docs/ai/AI_TASK_QUEUE.md
```

### 2. Use Next Available ID
Find the last TASK-### in the file and increment by 1

### 3. Follow the Template
```yaml
- id: TASK-###
  title: Clear, actionable title (what needs to be done)
  priority: high|medium|low
  status: not-started  # or in-progress if you're starting it now
  related_files:
    - path/to/affected/file.tsx
    - path/to/another/file.tsx
  created_at: YYYY-MM-DD
  created_by: agent
  description: |
    Detailed description including:
    - What needs to be done
    - Why it needs to be done
    - Context about discovery (if during another task)
  acceptance_criteria:
    - Specific testable outcome 1
    - Specific testable outcome 2
    - Specific testable outcome 3
  notes: "Created during TASK-### while [doing X]. Additional context here."
```

### 4. Set Appropriate Priority

**High priority:**
- Bugs affecting functionality
- Security issues
- User-facing errors
- Blocking other work

**Medium priority:**
- UI inconsistencies
- Performance improvements
- Code quality issues
- Non-critical bugs

**Low priority:**
- Code cleanup
- Documentation updates
- Nice-to-have enhancements
- Optimizations

### 5. Link to Parent Task
Always mention which task led to the discovery in the `notes` field:
```yaml
notes: "Created during TASK-002 audit - found when reviewing modal implementations"
```

## Examples from Real Sessions

### Audit → Multiple Tasks
```yaml
# During component audit (TASK-002), created 3 follow-up tasks:

- id: TASK-043
  title: Unify modal footer buttons
  priority: medium
  created_by: agent
  notes: "TASK-002 audit found 4 modals with custom footer styling"

- id: TASK-044
  title: Extract repeated form validation logic
  priority: low
  created_by: agent
  notes: "TASK-002 audit found duplicate validation in 6 components"

- id: TASK-045
  title: Add loading states to async modals
  priority: medium
  created_by: agent
  notes: "TASK-002 audit found 3 modals missing loading indicators"
```

### Bug Discovery → Follow-up Task
```yaml
- id: TASK-046
  title: Fix quantity selector accepting negative values
  priority: medium
  status: not-started
  created_at: 2026-02-05
  created_by: agent
  description: While fixing TASK-034, discovered quantity selector allows negative values via keyboard input
  related_files:
    - src/components/shared/quantity-selector.tsx
  notes: "Discovered during TASK-034 testing. Current min validation only works for stepper buttons, not direct input"
```

### Complex Task → Phase Breakdown
```yaml
# Original complex task split into 3 phases:

- id: TASK-047
  title: API refactor - Phase 1: Create new endpoints
  priority: high
  notes: "Part 1 of 3 for API refactor. Creates foundation for phases 2 & 3"

- id: TASK-048
  title: API refactor - Phase 2: Migrate components
  priority: high
  notes: "Part 2 of 3. Depends on: TASK-047"

- id: TASK-049
  title: API refactor - Phase 3: Remove old endpoints
  priority: high
  notes: "Part 3 of 3. Depends on: TASK-048. Final cleanup"
```

## Anti-Patterns to Avoid

❌ **Just documenting findings without creating tasks**
```
Bad: "Found 5 components with inconsistent styling during audit"
Good: Create TASK-050 to fix the styling
```

❌ **Creating vague tasks**
```yaml
Bad:
  title: Fix some styling issues
  description: There are problems

Good:
  title: Standardize button sizes in modal footers
  description: 4 modals use different button sizes (sm/md/lg). Standardize to 'md' per design system.
```

❌ **Not linking to parent work**
```yaml
Bad:
  notes: ""

Good:
  notes: "Created during TASK-002 audit when reviewing modal implementations"
```

❌ **Creating tasks for things already done**
```
Always check the queue first - use grep or search
```

## Workflow Integration

1. **Start work session** → Read AI_TASK_QUEUE.md
2. **Pick a task** → Mark as in-progress
3. **During work** → Discover issues/improvements
4. **Create new tasks immediately** → Don't wait until end
5. **Complete original task** → Mark as done
6. **New tasks are ready** → For you or next agent to pick up

## Benefits

✅ **Nothing gets lost** - Every discovery becomes actionable
✅ **Better planning** - Complex work broken into manageable pieces  
✅ **Continuous improvement** - Audit insights drive real changes
✅ **Clear progress** - Easy to see what's done and what's next
✅ **Team coordination** - Other agents can pick up tasks you create

---

**Remember:** The task queue is a living document. Don't hesitate to add tasks when you find work that needs doing. It's better to have clear, actionable tasks than buried notes in completed work logs.
