import { render, screen } from '@testing-library/react';
import { TempoReadout } from './BpmControl';

describe('TempoReadout trainer hint', () => {
  it('shows the BPM number', () => {
    render(<TempoReadout bpm={128} />);
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('hides the trainer hint when not counting (trainerBars null)', () => {
    render(<TempoReadout bpm={120} />);
    expect(screen.queryByText(/in \d+ bar/)).not.toBeInTheDocument();
  });

  it('shows "+step in N bars" while counting', () => {
    render(<TempoReadout bpm={120} trainerBars={3} trainerStep={5} />);
    expect(screen.getByText(/\+5 in 3 bars/)).toBeInTheDocument();
  });

  it('uses the singular "bar" when one bar remains', () => {
    render(<TempoReadout bpm={120} trainerBars={1} trainerStep={2} />);
    expect(screen.getByText(/\+2 in 1 bar$/)).toBeInTheDocument();
  });
});
