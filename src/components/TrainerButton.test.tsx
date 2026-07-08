import { render, screen, fireEvent } from '@testing-library/react';
import { TrainerButton } from './TrainerButton';

describe('TrainerButton', () => {
  it('offers to enter trainer mode (and toggles) when inactive', () => {
    const onToggle = vi.fn();
    render(<TrainerButton active={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: 'Enter tempo trainer' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('offers to exit and reads as pressed when active', () => {
    render(<TrainerButton active onToggle={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Exit tempo trainer' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
