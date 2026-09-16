// ============================================================================
// BUG-12 REGRESSION: interactive controls in Map3D must be real <button>
// elements (keyboard operable + exposed to screen readers), never
// clickable <span onClick>.
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(resolve(import.meta.dirname, 'Map3D.tsx'), 'utf8');

describe('BUG-12: Map3D accessibility', () => {
  it('no interactive <span onClick> remains anywhere in the file', () => {
    expect(src).not.toMatch(/<span[^>]*\bonClick=/);
  });

  it('zone-hide control is a real button with an aria-label', () => {
    expect(src).toMatch(/<button type="button" aria-label={`Скрыть сферу «\$\{z\.name\}»`}/);
  });

  it('deselect-node control is a real button with an aria-label', () => {
    expect(src).toMatch(/<button type="button" aria-label="Снять выделение с узла"/);
  });
});
