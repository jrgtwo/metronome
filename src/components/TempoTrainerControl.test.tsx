import { render, screen, fireEvent } from '@testing-library/react';
import { TempoTrainerControl } from './TempoTrainerControl';

const base = {
  enabled: false,
  target: 140,
  step: 5,
  interval: 4,
  onToggle: vi.fn(),
  onTarget: vi.fn(),
  onStep: vi.fn(),
  onInterval: vi.fn(),
  justReached: false,
};

describe('TempoTrainerControl', () => {
  it('renders the label, arm toggle, and the three stepper values', () => {
    render(<TempoTrainerControl {...base} />);
    expect(screen.getByText('Tempo trainer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enable tempo trainer' })).toBeInTheDocument();
    expect(screen.getByText('140')).toBeInTheDocument(); // target
    expect(screen.getByText('5')).toBeInTheDocument(); // step
    expect(screen.getByText('4')).toBeInTheDocument(); // bars
  });

  it('reflects the armed state on the toggle', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<TempoTrainerControl {...base} onToggle={onToggle} />);
    const toggle = screen.getByRole('button', { name: 'Enable tempo trainer' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(<TempoTrainerControl {...base} enabled onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'Disable tempo trainer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('steps each value by ±1 through its callback', () => {
    const onTarget = vi.fn();
    const onStep = vi.fn();
    const onInterval = vi.fn();
    render(
      <TempoTrainerControl {...base} onTarget={onTarget} onStep={onStep} onInterval={onInterval} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Increase target tempo' }));
    expect(onTarget).toHaveBeenCalledExactlyOnceWith(141);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease step size' }));
    expect(onStep).toHaveBeenCalledExactlyOnceWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'Increase bar interval' }));
    expect(onInterval).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('highlights the row when the target is reached', () => {
    const { container, rerender } = render(<TempoTrainerControl {...base} justReached={false} />);
    expect(container.firstChild).not.toHaveClass('bg-pop/10');
    rerender(<TempoTrainerControl {...base} justReached />);
    expect(container.firstChild).toHaveClass('bg-pop/10');
  });
});
