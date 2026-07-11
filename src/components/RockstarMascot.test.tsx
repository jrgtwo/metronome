import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RockstarMascot } from './RockstarMascot';

describe('RockstarMascot', () => {
  it('renders a decorative mascot svg', () => {
    render(<RockstarMascot bpm={120} isRunning currentBeat={0} beats={4} />);
    const svg = screen.getByTestId('rockstar-mascot');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders whether or not it is running (motion is driven imperatively)', () => {
    const { rerender } = render(<RockstarMascot bpm={120} isRunning={false} />);
    expect(screen.getByTestId('rockstar-mascot')).toBeInTheDocument();
    rerender(<RockstarMascot bpm={90} isRunning currentBeat={2} beats={3} />);
    expect(screen.getByTestId('rockstar-mascot')).toBeInTheDocument();
  });
});
