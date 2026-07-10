import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RockMode, type RockModeProps } from './RockMode';

function props(over: Partial<RockModeProps> = {}): RockModeProps {
  return {
    act: 'climb',
    countdown: 0,
    go: true,
    progress: 0.5,
    levelUpKey: 0,
    bpm: 128,
    target: 140,
    step: 5,
    startBpm: 90,
    barsUntilNext: 3,
    beats: 4,
    accents: [0],
    accentEnabled: true,
    currentBeat: 1,
    subdivision: 'off',
    currentSubdivisionIndex: 0,
    isRunning: true,
    onStop: vi.fn(),
    onExit: vi.fn(),
    ...over,
  };
}

describe('RockMode', () => {
  it('renders nothing when idle', () => {
    const { container } = render(<RockMode {...props({ act: 'idle' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count-in during launch', () => {
    render(<RockMode {...props({ act: 'launch', go: false, countdown: 3 })} />);
    expect(screen.getByText(/get ready/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows GO at the end of the count-in', () => {
    render(<RockMode {...props({ act: 'launch', go: true, countdown: 0 })} />);
    expect(screen.getByText(/^go/i)).toBeInTheDocument();
  });

  it('keeps the real metronome (beat dots + BPM) as the centerpiece during the climb', () => {
    render(<RockMode {...props({ act: 'climb', bpm: 128, beats: 4 })} />);
    expect(screen.getAllByTestId('main-dot')).toHaveLength(4);
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('shows the amp-gain meter reflecting climb progress', () => {
    render(<RockMode {...props({ act: 'climb', progress: 0.5 })} />);
    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows the next-bump marquee during the climb', () => {
    render(<RockMode {...props({ act: 'climb', step: 5, barsUntilNext: 3 })} />);
    expect(screen.getByText(/\+5 BPM in 3 bars/i)).toBeInTheDocument();
  });

  it('singularizes the marquee at one bar', () => {
    render(<RockMode {...props({ act: 'climb', step: 5, barsUntilNext: 1 })} />);
    expect(screen.getByText(/\+5 BPM in 1 bar\b/i)).toBeInTheDocument();
  });

  it('hides the marquee when not counting (barsUntilNext is null)', () => {
    render(<RockMode {...props({ act: 'climb', barsUntilNext: null })} />);
    expect(screen.queryByText(/BPM in/i)).not.toBeInTheDocument();
  });

  it('shows the victory payoff with the reached target', () => {
    render(<RockMode {...props({ act: 'victory', target: 140 })} />);
    expect(screen.getByText(/shredded/i)).toBeInTheDocument();
    expect(screen.getByText('140')).toBeInTheDocument();
  });

  it('shows the level-up flare only after a bump, re-keyed each time', () => {
    const { rerender } = render(<RockMode {...props({ act: 'climb', levelUpKey: 0 })} />);
    // No bump yet → no flare.
    expect(screen.queryByTestId('levelup-flare')).not.toBeInTheDocument();
    rerender(<RockMode {...props({ act: 'climb', levelUpKey: 1 })} />);
    expect(screen.getByTestId('levelup-flare')).toHaveAttribute('data-key', '1');
    rerender(<RockMode {...props({ act: 'climb', levelUpKey: 2 })} />);
    expect(screen.getByTestId('levelup-flare')).toHaveAttribute('data-key', '2');
  });

  it('calls onStop when STOP is pressed', () => {
    const onStop = vi.fn();
    render(<RockMode {...props({ act: 'climb', onStop })} />);
    fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('calls onExit from the bail button and from Escape', () => {
    const onExit = vi.fn();
    render(<RockMode {...props({ act: 'climb', onExit })} />);
    fireEvent.click(screen.getByRole('button', { name: /exit rock mode/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(2);
  });
});
