// ============================================================================
// CLIPBOARD SERVICE (DRY / SAFE-CONTEXT)
// Single guarded copy helper for every "Copy" action in the app.
// navigator.clipboard is undefined in non-secure contexts (plain http over
// LAN/IP) — there we fall back to a hidden textarea + execCommand, and any
// failure resolves to `false` instead of throwing in a click handler or
// leaking an unhandled rejection.
// ============================================================================

function copyViaHiddenTextarea(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Keep it off-screen but still focusable/selectable.
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '-9999px';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch (e) {
    console.warn('Clipboard execCommand fallback failed:', e);
    succeeded = false;
  }
  document.body.removeChild(textArea);
  return succeeded;
}

/**
 * Copies `text` to the clipboard with a secure-context guard and a
 * textarea fallback. Never throws; resolves to `true` on success.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard API copy failed, trying legacy fallback:', e);
  }
  return copyViaHiddenTextarea(text);
}
