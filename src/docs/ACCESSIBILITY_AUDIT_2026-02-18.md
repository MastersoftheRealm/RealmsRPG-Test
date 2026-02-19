# Accessibility Audit — Color Contrast WCAG 2.1 AA

**Date:** 2026-02-18  
**Task:** TASK-255  
**Requirements:** 4.5:1 for small text, 3:1 for large text (WCAG 2.1 AA)

## Changes Implemented

### 1. Auth pages (dark backgrounds)
- **AuthCard:** subtitle `text-gray-400` → `text-gray-300` (4.5:1 on gray-800)
- **Login/Register/Forgot:** "or" divider, footer text `text-gray-400` → `text-gray-300`
- **FormInput/PasswordInput:** helper text, placeholder, toggle icon `text-gray-400` → `text-gray-300`
- **Forgot-username:** Mail icon, helper text, center copy `text-gray-400/500` → `text-gray-300`

### 2. Design tokens (globals.css)
- **Dark mode `--text-muted`:** `#6e7681` → `#8b949e` (was ~3.6:1 on #161b22, now ~4.6:1)

### 3. Opacity-reduced text
- **item-card.tsx:** `opacity-70` on stat labels → `text-text-secondary` (semantic token)
- **creator-summary-panel.tsx:** `opacity-70` on "/ total" → `text-text-muted`

### 4. Roll log
- **roll-log.tsx:** timestamp `text-text-muted dark:text-neutral-400` → `text-text-secondary` (single token, sufficient contrast in both modes)

## Residual / Manual Review

- **Placeholder text:** Auth inputs use `placeholder:text-gray-300` on dark bg; passes 4.5:1.
- **Disabled states:** `disabled:opacity-50` on buttons/inputs is acceptable per WCAG (disabled content exempt from contrast).
- **Native select dropdowns:** Option list styling is OS-controlled; trigger uses `text-text-primary bg-surface`.
- **Recommend:** Run axe DevTools in browser on key flows (login, creators, character sheet) for automated verification.

## Token Reference

| Token           | Light        | Dark   | Notes                          |
|----------------|--------------|--------|--------------------------------|
| text-primary   | #091d2d      | #e6edf3| Primary text, high contrast    |
| text-secondary | #41464a      | #8b949e| Secondary text                 |
| text-muted     | #707070      | #8b949e| Muted/hint text, AA compliant  |
