export {
  ARMAMENT_GLR_SURFACE,
  GLR_SURFACE_REGISTRY,
  getGlrSurfaceSpec,
  normalizeGlrColumnKey,
  type GlrFactId,
  type GlrFactPlacement,
  type GlrFactRule,
  type GlrSurfaceId,
  type GlrSurfaceSpec,
} from './required-facts-registry';

export {
  assertRowFactCoverage,
  assertSurfaceColumnConfig,
  validateRowFactCoverage,
  validateSurfaceColumnConfig,
  chipLabelsFromDetailSections,
  type GlrRowFactSnapshot,
} from './validate-glr-facts';

export {
  CODEX_BROWSE_LIST_ROW_CLASSNAME,
  CODEX_BROWSE_SHELL_SOURCES,
  CREATOR_EMBEDDED_GLR_SOURCES,
  DEFAULT_GLR_LIST_CLASSNAME,
  DEFAULT_USM_LIST_CLASSNAME,
  FORBIDDEN_GLR_GRID_ACTION_TRACK_REGEX,
  GLR_GRID_COLUMN_SOURCES,
  GLR_LIST_CLASSNAME_CALLER_SOURCES,
  GLR_LIST_SHELL_SOURCES,
  MY_LIBRARY_ENTITY_TAB_SOURCES,
  USM_LIST_SHELL_SOURCES,
  GLR_ROW_LAYOUT_SOURCES,
} from './glr-chrome-spacing-norms';

export {
  assertGlrChromeSpacingSources,
  expectedRowChromeFromRowActions,
  resolvedRowChromeFlags,
  scanGlrChromeSpacingSources,
  validateGlrListClassName,
  type GlrChromeSpacingScanResult,
  type RowChromeFlags,
} from './validate-glr-chrome-spacing';
