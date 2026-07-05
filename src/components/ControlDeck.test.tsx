import { render, screen, fireEvent } from '@testing-library/react';
import { feelToSubdivision } from '@fretwork/lib';
import { ControlDeck } from './ControlDeck';

// The deck composes the real tempo/meter/feel controls; these props keep the
// derived feel at "off" and the meter at 4/4 so the render is deterministic.
const base = {
  bpm: 120,
  onBpm: vi.fn(),
  spacebarEnabled: false,
  timeSignatureId: '4/4',
  onTimeSignature: vi.fn(),
  subdivision: feelToSubdivision('off'),
  swing: 0.5,
  onSubdivision: vi.fn(),
  onSwing: vi.fn(),
  onAbout: vi.fn(),
};

describe('ControlDeck', () => {
  it('always shows the tempo controls (tap tempo), even collapsed', () => {
    render(<ControlDeck expanded={false} onToggle={vi.fn()} {...base} />);
    expect(screen.getByRole('button', { name: 'Tap tempo' })).toBeInTheDocument();
  });

  it('the grab handle reflects the expanded state and toggles it', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<ControlDeck expanded={false} onToggle={onToggle} {...base} />);
    const handle = screen.getByRole('button', { name: /show meter/i });
    expect(handle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(handle);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(<ControlDeck expanded onToggle={onToggle} {...base} />);
    expect(screen.getByRole('button', { name: /hide meter/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the meter + feel controls (kept mounted for the collapse animation)', () => {
    render(<ControlDeck expanded onToggle={vi.fn()} {...base} />);
    expect(screen.getByText('4/4')).toBeInTheDocument(); // a meter option
    expect(screen.getByText('Off')).toBeInTheDocument(); // a feel option
  });

  it('opens About via the onAbout callback', () => {
    const onAbout = vi.fn();
    render(<ControlDeck expanded onToggle={vi.fn()} {...base} onAbout={onAbout} />);
    fireEvent.click(screen.getByText('About metronomnom'));
    expect(onAbout).toHaveBeenCalledOnce();
  });
});
