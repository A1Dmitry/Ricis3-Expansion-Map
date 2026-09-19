import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from './SettingsModal';
import type { AdaptiveRole } from '../hooks/useAdaptiveUI';
import { useI18nStore } from '../store/useI18nStore';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function render(element: React.ReactElement): Promise<HTMLDivElement> {
  const renderedContainer = container!;
  await act(async () => {
    root?.render(element);
  });
  return renderedContainer;
}

beforeEach(() => {
  useI18nStore.getState().setLocale('ru');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  container = null;
  root = null;
});

const mockRoles: AdaptiveRole[] = [
  {
    id: 'researcher',
    name: 'Исследователь',
    weights: { e1: 1 },
    clickCount: 10,
    visibleOrder: ['e1'],
  },
  {
    id: 'student',
    name: 'Студент',
    weights: { e1: 1 },
    clickCount: 5,
    visibleOrder: ['e1'],
  },
];

describe('SettingsModal Component', () => {
  it('does not render when isOpen is false', async () => {
    const onClose = vi.fn();
    const onSelectRole = vi.fn();
    const onCreateRole = vi.fn();

    const rendered = await render(
      <SettingsModal
        isOpen={false}
        onClose={onClose}
        roles={mockRoles}
        currentRoleId="researcher"
        onSelectRole={onSelectRole}
        onCreateRole={onCreateRole}
      />
    );
    expect(rendered.textContent).toBe('');
  });

  it('renders modal with role selection and database hosting options when isOpen is true', async () => {
    const onClose = vi.fn();
    const onSelectRole = vi.fn();
    const onCreateRole = vi.fn();

    const rendered = await render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        roles={mockRoles}
        currentRoleId="researcher"
        onSelectRole={onSelectRole}
        onCreateRole={onCreateRole}
      />
    );

    expect(rendered.textContent).toContain('Настройки');
    expect(rendered.textContent).toContain('Исследователь');
    expect(rendered.textContent).toContain('Студент');
  });

  it('triggers onSelectRole when a role card is clicked', async () => {
    const onClose = vi.fn();
    const onSelectRole = vi.fn();
    const onCreateRole = vi.fn();

    const rendered = await render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        roles={mockRoles}
        currentRoleId="researcher"
        onSelectRole={onSelectRole}
        onCreateRole={onCreateRole}
      />
    );

    const buttons = Array.from(rendered.querySelectorAll('button'));
    const studentBtn = buttons.find(b => b.textContent?.includes('Студент'));
    expect(studentBtn).toBeDefined();

    await act(async () => {
      studentBtn?.click();
    });

    expect(onSelectRole).toHaveBeenCalledWith('student');
  });
});
