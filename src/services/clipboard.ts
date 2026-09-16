// ============================================================================
// UNIFIED CLIPBOARD HELPER (BUG-07)
// Single DRY entry point for every «Копировать» button: secure-context
// guard, legacy textarea fallback and a full catch, so click handlers never
// throw (nor unhandled-reject) in non-secure contexts (http over LAN).
// ============================================================================

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard API failed, falling back to execCommand:', e);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textArea);
    return ok;
  } catch (e) {
    console.warn('Failed to copy to clipboard:', e);
    return false;
  }
}
