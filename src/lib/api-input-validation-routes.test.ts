import { describe, expect, it } from 'vitest';

import { collectInputValidationGaps } from './api-input-validation-scan';

describe('API route input validation coverage', () => {
  it('every handler that reads query, params, or JSON validates with Zod helpers', () => {
    expect(collectInputValidationGaps()).toEqual([]);
  });
});
