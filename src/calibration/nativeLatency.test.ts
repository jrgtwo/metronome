import { webNativeLatency, activeNativeLatency } from './nativeLatency';

// The native-latency seam: the web provider can't read the OS audio stack, so it
// must always report `null` (never throw), and the active provider on web must BE
// the web one. A future Tauri shell swaps `activeNativeLatency` — these tests pin
// the contract that swap has to honor.
describe('nativeLatency (web provider seam)', () => {
  it('identifies itself as the web backend', () => {
    expect(webNativeLatency.id).toBe('web');
  });

  it('resolves null (no OS number on web)', async () => {
    await expect(webNativeLatency.getOutputLatencyMs()).resolves.toBeNull();
  });

  it('never rejects — resolves rather than throwing', async () => {
    // The contract says implementations must never throw; getOutputLatencyMs
    // returns a Promise that resolves (here to null) on every call.
    let settled = false;
    let rejected = false;
    await webNativeLatency
      .getOutputLatencyMs()
      .then(() => {
        settled = true;
      })
      .catch(() => {
        rejected = true;
      });
    expect(settled).toBe(true);
    expect(rejected).toBe(false);
  });

  it('is the active provider on web', () => {
    expect(activeNativeLatency).toBe(webNativeLatency);
    expect(activeNativeLatency.id).toBe('web');
  });
});
