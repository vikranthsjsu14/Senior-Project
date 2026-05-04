import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StreakBadge from '../components/dashboard/StreakBadge';

describe('StreakBadge', () => {
  it('prompts the user to set a goal when target is 0', () => {
    render(<StreakBadge days={0} target={0} />);
    expect(screen.getByText(/set a daily steps goal/i)).toBeInTheDocument();
    expect(screen.getByText(/to start a streak/i)).toBeInTheDocument();
  });

  it('shows "0 days" with sleep icon copy when streak is broken', () => {
    render(<StreakBadge days={0} target={10000} />);
    expect(screen.getByText('0 days')).toBeInTheDocument();
    expect(screen.getByText(/walk 10,000 steps today to start/i)).toBeInTheDocument();
  });

  it('pluralizes correctly at 1 day vs many', () => {
    const { rerender } = render(<StreakBadge days={1} target={10000} />);
    expect(screen.getByText('1 day')).toBeInTheDocument();

    rerender(<StreakBadge days={7} target={10000} />);
    expect(screen.getByText('7 days')).toBeInTheDocument();
  });

  it('shows the target inside the streak description', () => {
    render(<StreakBadge days={5} target={8000} />);
    expect(screen.getByText(/hit 8,000 steps in a row/i)).toBeInTheDocument();
  });
});
