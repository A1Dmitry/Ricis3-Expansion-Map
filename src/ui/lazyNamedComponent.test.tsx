import React, { Suspense } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { lazyNamedComponent } from './lazyNamedComponent';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type GreetingProps = Readonly<{
  readonly name: string;
}>;

function Greeting({ name }: GreetingProps) {
  return React.createElement('p', { 'data-testid': 'named-export-greeting' }, `Hello, ${name}`);
}

let root: Root | undefined;
let container: HTMLDivElement | undefined;

async function render(element: React.ReactNode): Promise<HTMLDivElement> {
  const renderedContainer = document.createElement('div');
  document.body.append(renderedContainer);
  const renderedRoot = createRoot(renderedContainer);
  root = renderedRoot;
  container = renderedContainer;

  await act(async () => {
    renderedRoot.render(element);
  });

  return renderedContainer;
}

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
  }
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('lazyNamedComponent', () => {
  it('adapts a named component export into React lazy shape while preserving the exact props contract', async () => {
    let resolveModule: ((module: { readonly Greeting: typeof Greeting }) => void) | undefined;
    const LazyGreeting = lazyNamedComponent<GreetingProps, 'Greeting'>(
      () => new Promise(resolve => {
        resolveModule = resolve;
      }),
      'Greeting',
    );

    const renderedContainer = await render(
      React.createElement(
        Suspense,
        { fallback: React.createElement('p', { 'data-testid': 'adapter-fallback' }, 'Loading component') },
        React.createElement(LazyGreeting, { name: 'RICIS-III' }),
      ),
    );

    expect(renderedContainer.querySelector('[data-testid="adapter-fallback"]')?.textContent).toBe('Loading component');
    expect(renderedContainer.querySelector('[data-testid="named-export-greeting"]')).toBeNull();

    await act(async () => {
      resolveModule?.({ Greeting });
      await Promise.resolve();
    });

    expect(renderedContainer.querySelector('[data-testid="adapter-fallback"]')).toBeNull();
    expect(renderedContainer.querySelector('[data-testid="named-export-greeting"]')?.textContent).toBe('Hello, RICIS-III');
  });
});
