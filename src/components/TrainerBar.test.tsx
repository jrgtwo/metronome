import { render, screen, fireEvent } from '@testing-library/react';
import { TrainerBar } from './TrainerBar';

const base = {
  target: 140,
  step: 5,
  interval: 4,
  onTarget: vi.fn(),
  onStep: vi.fn(),
  onInterval: vi.fn(),
  justReached: false,
};

describe('TrainerBar', () => {
  it('renders the label and the three stepper values', () => {
    render(<TrainerBar {...base} />);
    expect(screen.getByText('Trainer')).toBeInTheDocument();
    expect(screen.getByText('140')).toBeInTheDocument(); // target
    expect(screen.getByText('5')).toBeInTheDocument(); // step
    expect(screen.getByText('4')).toBeInTheDocument(); // bars
  });

  it('steps each value by ±1 through its callback', () => {
    const onTarget = vi.fn();
    const onStep = vi.fn();
    const onInterval = vi.fn();
    render(<TrainerBar {...base} onTarget={onTarget} onStep={onStep} onInterval={onInterval} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase target tempo' }));
    expect(onTarget).toHaveBeenCalledExactlyOnceWith(141);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease step size' }));
    expect(onStep).toHaveBeenCalledExactlyOnceWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'Increase bar interval' }));
    expect(onInterval).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('highlights the bar when the target is reached', () => {
    const { container, rerender } = render(<TrainerBar {...base} justReached={false} />);
    expect(container.firstChild).not.toHaveClass('bg-pop/10');
    rerender(<TrainerBar {...base} justReached />);
    expect(container.firstChild).toHaveClass('bg-pop/10');
  });
});
