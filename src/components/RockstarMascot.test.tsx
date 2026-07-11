import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RockstarMascot } from './RockstarMascot';

describe('RockstarMascot', () => {
  it('renders a decorative mascot svg', () => {
    render(<RockstarMascot bpm={120} isRunning />);
    const svg = screen.getByTestId('rockstar-mascot');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('headbangs (and swings/strums) while running', () => {
    const { container } = render(<RockstarMascot bpm={120} isRunning />);
    expect(container.querySelector('.animate-rock-headbang')).not.toBeNull();
    expect(container.querySelector('.animate-rock-swing')).not.toBeNull();
    expect(container.querySelector('.animate-rock-strum')).not.toBeNull();
  });

  it('holds still (no beat animations) when not running', () => {
    const { container } = render(<RockstarMascot bpm={120} isRunning={false} />);
    expect(container.querySelector('.animate-rock-headbang')).toBeNull();
    expect(container.querySelector('.animate-rock-swing')).toBeNull();
  });

  it('paces the headbang off the BPM (one full cycle every two beats)', () => {
    const { container } = render(<RockstarMascot bpm={120} isRunning />);
    // 120 BPM → 500ms/beat → 1000ms per two-beat headbang cycle.
    const body = container.querySelector('.animate-rock-headbang') as HTMLElement;
    expect(body.style.animationDuration).toBe('1000ms');
  });
});
