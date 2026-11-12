// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AbilityPickButton } from './ability-pick-button';

describe('AbilityPickButton', () => {
  it('calls onPick when clicked with tooltip wrapper (custom archetype path)', async () => {
    const onPick = vi.fn();

    render(
      <AbilityPickButton
        variant="martial"
        ability="strength"
        selected={false}
        disabled={false}
        onPick={onPick}
      />,
    );

    const button = screen.getByRole('button', { name: /^strength$/i });
    fireEvent.click(button);

    expect(onPick).toHaveBeenCalledTimes(1);
  });
});
