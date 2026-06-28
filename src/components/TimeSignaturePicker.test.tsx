import { render, screen, fireEvent } from '@testing-library/react';
import { TimeSignaturePicker } from './TimeSignaturePicker';

describe('TimeSignaturePicker', () => {
  it('calls onChange with the clicked meter', () => {
    const onChange = vi.fn();
    render(<TimeSignaturePicker value="4/4" onChange={onChange} />);
    fireEvent.click(screen.getByText('3/4'));
    expect(onChange).toHaveBeenCalledWith('3/4');
  });

  it('keeps one selected — clicking the active meter does not deselect it', () => {
    const onChange = vi.fn();
    render(<TimeSignaturePicker value="4/4" onChange={onChange} />);
    // Radix single-select toggles off on re-click (emits ''); the guard drops it.
    fireEvent.click(screen.getByText('4/4'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
