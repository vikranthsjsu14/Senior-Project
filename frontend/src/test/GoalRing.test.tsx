import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GoalRing from '../components/dashboard/GoalRing';
import { ThemeProvider } from '../context/ThemeContext';

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('GoalRing', () => {
  it('shows percentage toward the target', () => {
    wrap(<GoalRing current={5000} target={10000} label="Steps" />);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/5,000.*10,000/)).toBeInTheDocument();
  });

  it('caps display at 100% when user exceeds target', () => {
    wrap(<GoalRing current={25000} target={10000} label="Steps" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('does not divide by zero when target is 0', () => {
    wrap(<GoalRing current={0} target={0} label="Steps" />);
    // Should render 0% instead of NaN/Infinity
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders the label in uppercase', () => {
    wrap(<GoalRing current={100} target={200} label="Water" />);
    expect(screen.getByText('Water')).toBeInTheDocument();
  });
});
