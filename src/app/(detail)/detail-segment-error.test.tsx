// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DetailSegmentError from './error';
import {
  RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
  ResourceAccessUnavailableError,
} from '@/lib/server/resource-access-unavailable';

describe('DetailSegmentError recovery', () => {
  afterEach(() => {
    cleanup();
  });

  it('invokes retry (router refresh + boundary reset), not reset alone', () => {
    const retry = vi.fn();
    const reset = vi.fn();
    render(<DetailSegmentError error={new Error('generic')} reset={reset} retry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();
  });

  it('shows generic error copy for non-outage failures', () => {
    render(<DetailSegmentError error={new Error('generic')} reset={() => {}} retry={() => {}} />);
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeTruthy();
  });

  it('shows outage copy when the serialized digest matches', () => {
    const err = new ResourceAccessUnavailableError('network', '/characters/x');
    render(
      <DetailSegmentError
        error={
          {
            message: err.message,
            digest: RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
          } as Error & { digest?: string }
        }
        reset={() => {}}
        retry={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: /temporarily unavailable/i })).toBeTruthy();
  });
});
