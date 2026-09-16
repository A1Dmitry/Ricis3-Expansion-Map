import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

/**
 * BUG-07 regression tests: in non-secure contexts (plain http over LAN/IP)
 * navigator.clipboard is undefined — a raw writeText call throws a TypeError
 * inside the click handler and rejected promises leak unhandled rejections.
 */

const withClipboardUndefined = () => {
  vi.stubGlobal('navigator', {});
};
const withClipboardRejecting = () => {
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText: vi.fn(() => Promise.reject(new Error('Permission denied'))),
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('copyTextToClipboard', () => {
  it('resolves to true when the Clipboard API works', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyTextToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('resolves to false (never throws) when navigator.clipboard is undefined (non-secure context)', async () => {
    withClipboardUndefined();
    await expect(copyTextToClipboard('hello')).resolves.toBe(false);
  });

  it('resolves to false when the Clipboard API rejects (no unhandled rejection)', async () => {
    withClipboardRejecting();
    await expect(copyTextToClipboard('hello')).resolves.toBe(false);
  });

  it('falls back to the hidden-textarea execCommand path when the API is missing', async () => {
    withClipboardUndefined();
    const originalExecCommand = document.execCommand;
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand as unknown as typeof document.execCommand;

    try {
      await expect(copyTextToClipboard('legacy')).resolves.toBe(true);
      expect(execCommand).toHaveBeenCalledWith('copy');
      // The textarea must not stay in the DOM.
      expect(document.querySelector('textarea')).toBeNull();
    } finally {
      document.execCommand = originalExecCommand;
    }
  });
});
