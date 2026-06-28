import { render, screen, fireEvent } from '@testing-library/react';
import { feelToSubdivision } from '@fretwork/lib';
import { FeelControl } from './FeelControl';

// subdivision/swing chosen so the derived feel is 'off' (straight).
const base = {
  subdivision: feelToSubdivision('off'),
  swing: 0.5,
} as const;

describe('FeelControl', () => {
  it('selecting a feel sets the matching subdivision', () => {
    const onSubdivision = vi.fn();
    render(<FeelControl {...base} onSubdivision={onSubdivision} onSwing={vi.fn()} />);
    fireEvent.click(screen.getByText('Trip')); // triplets
    expect(onSubdivision).toHaveBeenCalledWith(feelToSubdivision('triplets'));
  });

  it('keeps one selected — clicking the active feel does not deselect it', () => {
    const onSubdivision = vi.fn();
    render(<FeelControl {...base} onSubdivision={onSubdivision} onSwing={vi.fn()} />);
    fireEvent.click(screen.getByText('Off')); // the current feel
    expect(onSubdivision).not.toHaveBeenCalled();
  });
});
