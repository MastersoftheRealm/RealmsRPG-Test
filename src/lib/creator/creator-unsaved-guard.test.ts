import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  creatorBackSentinelAction,
  creatorBackSentinelState,
  creatorBeforeUnloadListener,
  creatorDraftIsDirty,
  creatorInternalNavigationHref,
  creatorToolbarLoadAction,
  stepCreatorBackUntilLeft,
  type CreatorBackHistory,
} from '@/lib/creator/creator-unsaved-guard';

const page = 'https://realmsrpg.com/power-creator?edit=row-1';

describe('creator unsaved guard', () => {
  it('treats an edited draft as dirty and a saved draft as clean', () => {
    const saved = '{"name":"Saved"}';
    expect(creatorDraftIsDirty('{"name":"Edited"}', saved)).toBe(true);
    expect(creatorDraftIsDirty(saved, saved)).toBe(false);
  });

  it('asks before an in-app link leaves the creator', () => {
    expect(
      creatorInternalNavigationHref({
        href: 'https://realmsrpg.com/library',
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBe('/library');
  });

  it('does not ask for reload-equivalent same document, a new tab, or another site', () => {
    expect(
      creatorInternalNavigationHref({
        href: page,
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBeNull();
    expect(
      creatorInternalNavigationHref({
        href: 'https://realmsrpg.com/library',
        target: '_blank',
        download: false,
        pageUrl: page,
      }),
    ).toBeNull();
    expect(
      creatorInternalNavigationHref({
        href: 'https://example.com/away',
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBeNull();
  });

  it('blocks reload while the draft is dirty and stays quiet when it is clean', () => {
    const block = creatorBeforeUnloadListener(() => true);
    const blocked = {
      prevented: false,
      returnValue: 'untouched',
      preventDefault() {
        this.prevented = true;
      },
    };
    block(blocked);
    expect(blocked.prevented).toBe(true);
    expect(blocked.returnValue).toBe('');

    const allow = creatorBeforeUnloadListener(() => false);
    const clean = {
      prevented: false,
      returnValue: 'untouched',
      preventDefault() {
        this.prevented = true;
      },
    };
    allow(clean);
    expect(clean.prevented).toBe(false);
    expect(clean.returnValue).toBe('untouched');

    const hook = readFileSync(
      path.join(import.meta.dirname, '../../hooks/use-creator-unsaved-guard.ts'),
      'utf8',
    );
    expect(hook).toContain('creatorBeforeUnloadListener');
    expect(hook).toContain("addEventListener('beforeunload'");
    expect(hook).not.toContain('history.go(-2)');
  });

  it('asks before Load discards a dirty creator and opens Load when the draft is clean', () => {
    expect(creatorToolbarLoadAction({ unsavedDirty: true, needsLogin: false })).toBe(
      'confirm-discard',
    );
    expect(creatorToolbarLoadAction({ unsavedDirty: false, needsLogin: false })).toBe('open');
    expect(creatorToolbarLoadAction({ unsavedDirty: true, needsLogin: true })).toBe('login');

    const shell = readFileSync(
      path.join(import.meta.dirname, '../../components/creator/CreatorPageShell.tsx'),
      'utf8',
    );
    expect(shell).toContain('creatorToolbarLoadAction');
    expect(shell).toContain("setDiscardAction('load')");
  });

  it('Back after save then another edit leaves the creator instead of another copy', () => {
    const creator = 'https://realmsrpg.com/power-creator';
    const library = 'https://realmsrpg.com/library';
    const routerState = { idx: 4, __NA: true };
    type Entry = { url: string; state: unknown };
    let entries: Entry[] = [
      { url: library, state: { idx: 3 } },
      { url: creator, state: routerState },
    ];
    let index = 1;

    const applyDirty = (isDirty: boolean) => {
      const current = entries[index];
      if (!current) throw new Error('missing history entry');
      const action = creatorBackSentinelAction(isDirty, current.state);
      if (action === 'push') {
        entries = entries.slice(0, index + 1);
        entries.push({ url: current.url, state: creatorBackSentinelState(current.state) });
        index = entries.length - 1;
      } else if (action === 'back') {
        entries = entries.slice(0, index);
        index -= 1;
      }
    };

    applyDirty(true);
    applyDirty(true);
    expect(entries).toHaveLength(3);
    expect(entries[2]?.state).toEqual({ ...routerState, creatorUnsavedGuard: true });
    expect(entries[1]?.state).toEqual(routerState);

    applyDirty(false);
    expect(index).toBe(1);
    expect(entries[1]?.state).toEqual(routerState);
    expect(
      entries.some(
        (entry) =>
          entry.state && (entry.state as { creatorUnsavedGuard?: boolean }).creatorUnsavedGuard,
      ),
    ).toBe(false);

    applyDirty(true);
    expect(entries).toHaveLength(3);

    const history: CreatorBackHistory & { href: string } = {
      get state() {
        return entries[index]?.state;
      },
      get length() {
        return entries.length;
      },
      get href() {
        return entries[index]?.url ?? '';
      },
      back() {
        if (index === 0) return;
        index -= 1;
        listeners.forEach((listener) => listener());
      },
    };
    const listeners: Array<() => void> = [];
    stepCreatorBackUntilLeft(history, history, (onPop) => {
      listeners.push(onPop);
      return () => {
        const at = listeners.indexOf(onPop);
        if (at >= 0) listeners.splice(at, 1);
      };
    });
    expect(history.href).toBe(library);
    expect(entries[index]?.url).toBe(library);

    const leftover: Entry[] = [
      { url: library, state: { idx: 3 } },
      { url: creator, state: routerState },
      { url: creator, state: creatorBackSentinelState(routerState) },
      { url: creator, state: creatorBackSentinelState(routerState) },
    ];
    let leftoverIndex = 3;
    const leftoverHistory: CreatorBackHistory & { href: string } = {
      get state() {
        return leftover[leftoverIndex]?.state;
      },
      get length() {
        return leftover.length;
      },
      get href() {
        return leftover[leftoverIndex]?.url ?? '';
      },
      back() {
        if (leftoverIndex === 0) return;
        leftoverIndex -= 1;
        leftoverListeners.forEach((listener) => listener());
      },
    };
    const leftoverListeners: Array<() => void> = [];
    stepCreatorBackUntilLeft(leftoverHistory, leftoverHistory, (onPop) => {
      leftoverListeners.push(onPop);
      return () => {
        const at = leftoverListeners.indexOf(onPop);
        if (at >= 0) leftoverListeners.splice(at, 1);
      };
    });
    expect(leftoverHistory.href).toBe(library);

    const hook = readFileSync(
      path.join(import.meta.dirname, '../../hooks/use-creator-unsaved-guard.ts'),
      'utf8',
    );
    expect(hook).toContain('creatorBackSentinelAction');
    expect(hook).toContain('stepCreatorBackUntilLeft');
    expect(hook).toContain('creatorBackSentinelState');
  });

  it('guards species and catches header Login the same way as an in-app link', () => {
    expect(
      creatorInternalNavigationHref({
        href: 'https://realmsrpg.com/login',
        target: null,
        download: false,
        pageUrl: page,
      }),
    ).toBe('/login');

    const speciesPage = readFileSync(
      path.join(import.meta.dirname, '../../app/(main)/species-creator/page.tsx'),
      'utf8',
    );
    const speciesWorkspace = readFileSync(
      path.join(
        import.meta.dirname,
        '../../app/(main)/species-creator/use-species-creator-workspace.ts',
      ),
      'utf8',
    );
    expect(speciesPage).toContain('unsavedDirty={ws.unsavedDirty}');
    expect(speciesWorkspace).toContain('useCreatorDraftDirty');
    expect(speciesWorkspace).toContain('onSaveCommitted: acceptDraft');
    expect(speciesWorkspace).toContain('acceptDraft()');

    const header = readFileSync(
      path.join(import.meta.dirname, '../../components/layout/header.tsx'),
      'utf8',
    );
    expect(header).toContain('href="/login"');
    expect(header).toContain('data-login-link="header"');
    expect(header).not.toContain("router.push('/login')");
  });
});
