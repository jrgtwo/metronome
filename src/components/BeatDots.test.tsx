import { render, screen } from '@testing-library/react';
import { BeatDots } from './BeatDots';

const base = {
  beats: 4,
  accents: [0] as const,
  accentEnabled: true,
  currentBeat: -1,
  currentSubdivisionIndex: -1,
  isRunning: false,
} as const;

describe('BeatDots', () => {
  it('renders no sub-dots when subdivision is off', () => {
    render(<BeatDots {...base} subdivision="off" />);
    expect(screen.queryAllByTestId('sub-dot')).toHaveLength(0);
  });

  it('renders 1 sub-dot per beat for 8ths', () => {
    // 8ths = 2 subs/beat → 1 sub-dot per beat × 4 beats = 4
    render(<BeatDots {...base} subdivision="8ths" />);
    expect(screen.getAllByTestId('sub-dot')).toHaveLength(4);
  });

  it('renders 3 sub-dots per beat for 16ths', () => {
    render(<BeatDots {...base} subdivision="16ths" />);
    expect(screen.getAllByTestId('sub-dot')).toHaveLength(12);
  });

  it('lights the sub-dot matching currentBeat + currentSubdivisionIndex while running', () => {
    render(
      <BeatDots
        {...base}
        subdivision="16ths"
        isRunning
        currentBeat={1}
        currentSubdivisionIndex={2}
      />,
    );
    const lit = screen.getAllByTestId('sub-dot').filter((el) =>
      el.className.includes('animate-beat-pop'),
    );
    expect(lit).toHaveLength(1);
  });

  it('lights no sub-dot when stopped', () => {
    render(
      <BeatDots
        {...base}
        subdivision="16ths"
        isRunning={false}
        currentBeat={1}
        currentSubdivisionIndex={2}
      />,
    );
    const lit = screen.getAllByTestId('sub-dot').filter((el) =>
      el.className.includes('animate-beat-pop'),
    );
    expect(lit).toHaveLength(0);
  });
});
