/**
 * Layer 1 content governance caps (REALMS_PRODUCT_OVERVIEW.md Appendix I.3).
 * Used by admin path validation and creator UI affordances.
 */

export const LAYER1_GOVERNANCE = {
  maxGroupsPerStep: 3,
  maxItemsPerGroup: 7,
  maxWhyCopyLength: 120,
  /** Path Level 1 recommended skills: at most 3 base skills (TASK-515). Legacy excess warns only. */
  maxPathRecommendedBaseSkills: 3,
} as const;
