import { render, screen, fireEvent } from '@testing-library/react';
import { MuteButton } from './MuteButton';

describe('MuteButton', () => {
  it('offers to mute (and toggles) when the click is on', () => {
    const onToggle = vi.fn();
    render(<MuteButton muted={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: 'Mute click' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('offers to unmute and reads as pressed when muted', () => {
    render(<MuteButton muted onToggle={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Unmute click' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
