import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DisclaimerFooter from '../components/layout/DisclaimerFooter';

describe('DisclaimerFooter', () => {
  it('renders the medical disclaimer text', () => {
    render(<MemoryRouter><DisclaimerFooter /></MemoryRouter>);
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });

  it('links to the privacy page', () => {
    render(<MemoryRouter><DisclaimerFooter /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /privacy & disclaimer/i });
    expect(link).toHaveAttribute('href', '/privacy');
  });
});
