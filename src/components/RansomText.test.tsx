import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RansomText } from './RansomText';

describe('RansomText', () => {
  it('exposes the whole phrase to assistive tech via a single label', () => {
    render(<RansomText text="LEVEL UP" />);
    // The letters are decorative; the accessible name is the intact phrase.
    expect(screen.getByLabelText('LEVEL UP')).toBeInTheDocument();
  });

  it('renders one cut-out letter box per non-space character', () => {
    const { container } = render(<RansomText text="GO GO" />);
    // 4 letters (G,O,G,O) — the space is a spacer, not a letter box.
    expect(container.querySelectorAll('.rock-ransom-ch')).toHaveLength(4);
  });

  it('is deterministic — the same text renders the same letters/tilts twice', () => {
    const a = render(<RansomText text="SHRED" />).container.innerHTML;
    const b = render(<RansomText text="SHRED" />).container.innerHTML;
    expect(a).toBe(b);
  });
});
