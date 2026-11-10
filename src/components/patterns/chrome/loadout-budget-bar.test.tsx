// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadoutBudgetBar } from './loadout-budget-bar';

describe('LoadoutBudgetBar Training Points over pool', () => {
  it('shows negative remaining and a warn-only alert for 27 of 25', () => {
    render(<LoadoutBudgetBar tpTotal={25} tpSpent={27} />);

    expect(screen.getByText('-2')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(
      'You are 2 Training Points over budget. You can still continue.',
    );
  });

  it('does not floor negative remaining when clampRemainingAtZero is off on the bar', () => {
    render(<LoadoutBudgetBar tpTotal={25} tpSpent={27} />);
    expect(screen.queryByText('0')).toBeNull();
  });
});
