// ============================================================================
// DRY JSON FILE DOWNLOAD HELPER (BUG-02: seed ledger & QA report commands)
// Browser-side Blob download used by export/ledger actions.
// ============================================================================

export function downloadJsonFile(fileName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
