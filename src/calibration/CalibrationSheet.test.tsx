import { render, screen, fireEvent } from '@testing-library/react';
import { CalibrationSheet } from './CalibrationSheet';

// The hook reaches into the audio engine; stub it so the sheet renders in jsdom.
// `registerTap` is a STABLE ref (the real hook memoizes it with useCallback([])),
// and `tapRunning` is mutable so a test can turn the Space handler on. The stub
// returns a fresh object literal every render — like the real hook — which is what
// exercises the effect-dep churn (CQ-10).
const mockCal = vi.hoisted(() => ({ registerTap: vi.fn(), tapRunning: false }));

vi.mock('./useCalibration', () => ({
  useCalibration: () => ({
    tapRunning: mockCal.tapRunning,
    registerTap: mockCal.registerTap,
    isBluetooth: false,
    deviceLabel: 'Test Device',
    grantLabelPermission: vi.fn(),
    nativeLatencyMs: null,
    browserLatencyMs: 10,
    offsetMs: 0,
    effectiveLatencyMs: 10,
    applyNative: vi.fn(),
    startTapIn: vi.fn(),
    tapCount: 0,
    tapMeasuredMs: null,
    cancelTapIn: vi.fn(),
    finishTapIn: vi.fn(),
    setOffset: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('CalibrationSheet', () => {
  beforeEach(() => {
    mockCal.tapRunning = false;
  });

  it('renders an accessible dialog with a title (the shadcn Dialog a11y win)', () => {
    render(<CalibrationSheet open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Calibration')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed (focus-trap/keyboard for free)', () => {
    const onClose = vi.fn();
    render(<CalibrationSheet open onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not re-subscribe the Space keydown listener on unrelated re-renders (CQ-10)', () => {
    mockCal.tapRunning = true;
    const addSpy = vi.spyOn(window, 'addEventListener');
    const keydownCount = () =>
      addSpy.mock.calls.filter(([type]) => type === 'keydown').length;

    const { rerender } = render(<CalibrationSheet open onClose={vi.fn()} />);
    const afterMount = keydownCount();
    expect(afterMount).toBeGreaterThan(0); // the Space handler mounted once

    // An unrelated re-render: open + tapRunning + registerTap are all unchanged,
    // only the onClose identity differs. The effect must NOT tear down + re-add.
    rerender(<CalibrationSheet open onClose={vi.fn()} />);
    expect(keydownCount()).toBe(afterMount);

    addSpy.mockRestore();
  });
});
