import nextConfig from '../../../next.config';
import { describe, expect, it } from 'vitest';

const RULEBOOK_MDX_TRACE_GLOB = './src/content/rules/**/*.mdx';

/** Routes that call `loadRulebookSearchChunks` via `RulebookNav` (runtime MDX reads). */
const RULEBOOK_SEARCH_TRACE_ROUTES = ['/rules', '/rules/[slug]'] as const;

describe('rulebook search deploy tracing (LIB3-025)', () => {
  it('includes rulebook MDX in serverless traces for rules routes', () => {
    const includes = nextConfig.outputFileTracingIncludes;
    expect(includes).toBeDefined();

    for (const route of RULEBOOK_SEARCH_TRACE_ROUTES) {
      expect(includes?.[route], `missing outputFileTracingIncludes for ${route}`).toEqual(
        expect.arrayContaining([RULEBOOK_MDX_TRACE_GLOB]),
      );
    }
  });
});
