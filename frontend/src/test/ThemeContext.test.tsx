import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark mode', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles theme and persists the choice', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => {
      screen.getByText('toggle').click();
    });
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('restores the persisted theme on mount', () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
});
