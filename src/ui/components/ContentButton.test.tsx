import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { ContentButton, ContentLink, SelectionCard } from './ContentButton';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('preserves visible localized content, refs, native button semantics and disabled actions', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const click = vi.fn();
  const ref = React.createRef<HTMLButtonElement>();
  try {
    await act(async () => root.render(<ContentButton ref={ref} onClick={click} aria-expanded={false} aria-controls="panel">Сохранение и экспорт</ContentButton>));
    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('Сохранение и экспорт');
    expect(button.querySelector('.icon-button__label')).toBeNull();
    expect(button.type).toBe('button');
    expect(ref.current).toBe(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    await act(async () => button.click());
    expect(click).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<ContentButton disabled onClick={click}>Änderungen speichern</ContentButton>));
    await act(async () => button.click());
    expect(click).toHaveBeenCalledTimes(1);
    expect(button.textContent).toBe('Änderungen speichern');
  } finally { await act(async () => root.unmount()); }
});

it('keeps an entire selection card clickable and references as native links', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const select = vi.fn();
  try {
    await act(async () => root.render(<><SelectionCard onClick={select}><strong>Task name</strong><span>Task description</span></SelectionCard><ContentLink href="/references">References</ContentLink></>));
    expect(container.querySelectorAll('button')).toHaveLength(1);
    await act(async () => container.querySelector('strong')!.click());
    expect(select).toHaveBeenCalledTimes(1);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/references');
    expect(container.querySelector('a')?.textContent).toBe('References');
  } finally { await act(async () => root.unmount()); }
});
