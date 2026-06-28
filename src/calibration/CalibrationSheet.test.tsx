import { render, screen, fireEvent } from '@testing-library/react';
import { CalibrationSheet } from './CalibrationSheet';

// The hook reaches into the audio engine; stub it so the sheet renders in jsdom.
vi.mock('./useCalibration', () => ({
  useCalibration: () => ({
    tapRunning: false,
    registerTap: vi.fn(),
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
});
