/**
 * Layer 1 content governance caps (REALMS_PRODUCT_OVERVIEW.md Appendix I.3).
 * Used by admin path validation and creator UI affordances.
 */

export const LAYER1_GOVERNANCE = {
  maxGroupsPerStep: 3,
  maxItemsPerGroup: 7,
  maxWhyCopyLength: 120,
} as const;
