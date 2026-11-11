import { describe, expect, it } from 'vitest';
import { SKILL_PLAY_HOOK_OPTIONS } from './skill-play-hook-options';

describe('skill play hook options', () => {
  it('enables keepalive unload for skill encounters', () => {
    expect(SKILL_PLAY_HOOK_OPTIONS.keepaliveOnUnload).toBe(true);
    expect(SKILL_PLAY_HOOK_OPTIONS.requireSkillEncounter).toBe(true);
  });
});
