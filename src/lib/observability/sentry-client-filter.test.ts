import { describe, expect, it } from 'vitest';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import {
  isAbortOrCancelledRequest,
  isChunkOrDynamicImportFailure,
  isHarmlessBrowserNetworkError,
  sentryClientBeforeSend,
  shouldDropClientSentryEvent,
} from './sentry-client-filter';

function hintFor(error: unknown): EventHint {
  return { originalException: error };
}

function emptyEvent(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    event_id: 'test',
    platform: 'javascript',
    timestamp: 0,
    ...overrides,
  } as ErrorEvent;
}

describe('shouldDropClientSentryEvent', () => {
  it('drops harmless fetch and network errors', () => {
    expect(
      shouldDropClientSentryEvent(emptyEvent(), hintFor(new TypeError('Failed to fetch'))),
    ).toBe(true);
    expect(
      shouldDropClientSentryEvent(
        emptyEvent(),
        hintFor(new Error('NetworkError when attempting to fetch resource.')),
      ),
    ).toBe(true);
    expect(shouldDropClientSentryEvent(emptyEvent(), hintFor(new Error('Load failed')))).toBe(true);
  });

  it('drops aborts, cancellations, and chunk / dynamic-import failures', () => {
    const abort = new DOMException('The user aborted a request.', 'AbortError');
    expect(shouldDropClientSentryEvent(emptyEvent(), hintFor(abort))).toBe(true);
    expect(
      shouldDropClientSentryEvent(emptyEvent(), hintFor(new Error('Request was cancelled'))),
    ).toBe(true);

    const chunk = new Error('Loading chunk 42 failed.');
    chunk.name = 'ChunkLoadError';
    expect(shouldDropClientSentryEvent(emptyEvent(), hintFor(chunk))).toBe(true);
    expect(
      shouldDropClientSentryEvent(
        emptyEvent(),
        hintFor(new TypeError('Failed to fetch dynamically imported module: https://x/y.js')),
      ),
    ).toBe(true);
  });

  it('keeps API and server failures with HTTP 5xx', () => {
    const apiError = Object.assign(new Error('Internal Server Error'), { status: 503 });
    expect(shouldDropClientSentryEvent(emptyEvent(), hintFor(apiError))).toBe(false);

    const event = emptyEvent({
      contexts: { response: { status_code: 500 } },
    });
    expect(shouldDropClientSentryEvent(event, hintFor(new TypeError('Failed to fetch')))).toBe(
      false,
    );
  });

  it('keeps unrelated application errors', () => {
    expect(
      shouldDropClientSentryEvent(emptyEvent(), hintFor(new Error('Cannot read property x'))),
    ).toBe(false);
    const clientError = Object.assign(new Error('Bad Request'), { status: 400 });
    expect(shouldDropClientSentryEvent(emptyEvent(), hintFor(clientError))).toBe(false);
  });
});

describe('sentryClientBeforeSend', () => {
  it('returns null when the event should be dropped', () => {
    expect(
      sentryClientBeforeSend(emptyEvent(), hintFor(new TypeError('Failed to fetch'))),
    ).toBeNull();
  });

  it('returns the event when it should be reported', () => {
    const event = emptyEvent();
    expect(sentryClientBeforeSend(event, hintFor(new Error('Unexpected null')))).toBe(event);
  });
});

describe('network noise helpers', () => {
  it('classifies abort, chunk, and network helpers consistently', () => {
    expect(isAbortOrCancelledRequest(new DOMException('', 'AbortError'))).toBe(true);
    expect(
      isChunkOrDynamicImportFailure(Object.assign(new Error('x'), { name: 'ChunkLoadError' })),
    ).toBe(true);
    expect(isHarmlessBrowserNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  });
});
