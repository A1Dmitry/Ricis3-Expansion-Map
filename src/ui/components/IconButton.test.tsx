import { SelectionCard } from './ContentButton';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Play, Pause, Save } from 'lucide-react';
import { IconButton, IconLink } from './IconButton';
import { ActionTooltip } from './ActionTooltip';
import { ActionButton } from '../ActionButton';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
async function render(node: React.ReactNode) {
  if (!container) {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  }
  await act(async () => root.render(node));
  return container.querySelector('button')!;
}
afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  container = undefined!;
});

describe('Icon commands', () => {
  it.each(['Сохранить', 'Save changes', 'Änderungen dauerhaft speichern', 'Enregistrer les modifications', 'परिवर्तन सहेजें', 'Simpan semua perubahan'])('keeps %s out of the visual glyph surface', async label => {
    const button = await render(<IconButton fallbackIcon={Save} className="w-full px-8 flex-1">{label}</IconButton>);
    expect(button.getAttribute('aria-label')).toBe(label);
    expect(button.title).toBe(label);
    expect(button.classList.contains('icon-button')).toBe(true);
    expect(button.querySelector('.icon-button__glyph')?.textContent).toBe('');
    expect(button.querySelectorAll('svg')).toHaveLength(1);
    expect(button.querySelector('.icon-button__label')?.textContent).toBe(label);
  });

  it('updates translated labels and conditional icons without altering the command contract', async () => {
    const click = vi.fn();
    const button = await render(<IconButton onClick={click}><Play />Запуск</IconButton>);
    await act(async () => button.click());
    expect(click).toHaveBeenCalledTimes(1);
    await render(<IconButton onClick={click} aria-pressed><Pause />Pause</IconButton>);
    expect(button.querySelector('.lucide-pause')).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Pause');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows portal tooltips on hover and keyboard focus, dismisses with Escape and cleans up', async () => {
    const button = await render(<IconButton><Play />Run</IconButton>);
    await act(async () => button.dispatchEvent(new MouseEvent('pointerover', { bubbles: true })));
    const tooltip = document.body.querySelector('[role="tooltip"]')!;
    expect(tooltip.textContent).toBe('Run');
    expect(container.contains(tooltip)).toBe(false);
    expect(button.getAttribute('aria-describedby')).toBe(tooltip.id);
    await act(async () => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    await act(async () => button.focus());
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    await act(async () => button.blur());
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('retains disabled state, disabled reason and caller event handlers', async () => {
    const click = vi.fn();
    const hover = vi.fn();
    const button = await render(<IconButton disabled onClick={click} onPointerEnter={hover} title="No connection">Save</IconButton>);
    await act(async () => {
      button.click();
      button.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
    });
    expect(click).not.toHaveBeenCalled();
    expect(hover).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain('No connection');
  });

  it('preserves submit buttons and refs', async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const ref = React.createRef<HTMLButtonElement>();
    const button = await render(<form onSubmit={submit}><IconButton ref={ref} type="submit">Save</IconButton></form>);
    expect(ref.current).toBe(button);
    await act(async () => button.click());
    expect(submit).toHaveBeenCalledOnce();
  });

  it('keeps the entire labelled card selectable without hiding its disclosures', async () => {
    const button = await render(<SelectionCard><p>Research only. Not a safety controller.</p></SelectionCard>);
    expect(container.querySelector('p')?.closest('button')).toBe(button);
    expect(button.querySelector('.icon-button__label')).toBeNull();
    expect(button.textContent).toContain('Not a safety controller');
  });

  it('preserves navigation semantics and uses the same icon layout for action links', async () => {
    await render(<IconLink href="https://example.com" target="_blank" rel="noopener noreferrer">Open source</IconLink>);
    const link = container.querySelector('a')!;
    expect(link.href).toBe('https://example.com/');
    expect(link.target).toBe('_blank');
    expect(link.getAttribute('aria-label')).toBe('Open source');
    expect(link.querySelector('svg')).not.toBeNull();
    await act(async () => link.focus());
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Open source');
  });

  it('uses one tooltip with existing command descriptions and shortcuts', async () => {
    const button = await render(<ActionTooltip title="Run" description="Execute command" shortcut="Alt+R"><IconButton><Play />Run</IconButton></ActionTooltip>);
    await act(async () => button.focus());
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain('Alt+R');
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain('Execute command');
  });

  it('keeps progress visible and prevents duplicate execution', async () => {
    const click = vi.fn();
    const button = await render(<ActionButton isLoading progressPercent={42} onClick={click}>Save</ActionButton>);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.animate-spin')).not.toBeNull();
    expect(button.textContent).toContain('42%');
    await act(async () => button.click());
    expect(click).not.toHaveBeenCalled();
  });
});
