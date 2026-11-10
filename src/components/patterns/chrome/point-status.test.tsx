// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PointStatus } from './point-status';

describe('PointStatus remaining display', () => {
  it('shows negative remaining for 27 spent of 25', () => {
    render(<PointStatus total={25} spent={27} label="Training Points" variant="inline" />);
    expect(screen.getByText('-2')).toBeTruthy();
  });

  it('floors remaining at 0 only when clampRemainingAtZero is set', () => {
    const { container } = render(
      <PointStatus
        total={25}
        spent={27}
        label="Training Points"
        variant="inline"
        clampRemainingAtZero={true}
      />,
    );
    const bold = container.querySelector('.font-bold');
    expect(bold?.textContent).toBe('0');
  });
});
