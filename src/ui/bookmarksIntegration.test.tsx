import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookmarksStore } from '../store/useBookmarksStore';
import { BOOKMARKS_STORAGE_KEY } from '../domain/bookmarks/bookmarks.types';
import { NodeCardDetails } from './NodeCardDetails';
import type { ProblemNode } from '../model/types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Bookmarks Feature Integration', () => {
  const sampleNode: ProblemNode = {
    id: 'node-test-bookmark',
    title: 'Test Singular Node',
    description: 'A test problem node',
    targetFunction: '0/0',
    state: 'unresolved',
    type: 'scientific_task',
    zoneIds: ['zone-1'],
    dependencyIds: [],
    dependentIds: [],
    fractalDepth: 0,
    economic: { costUnresolved: 10, costToSolve: 5, marketGain: 50, riskLoss: 2 },
  };

  beforeEach(() => {
    localStorage.clear();
    useBookmarksStore.getState().clearAllBookmarks();
  });

  it('toggles bookmark from NodeCardDetails context menu and persists to localStorage', async () => {
    const host = document.createElement('div');
    const header = document.createElement('header');
    const body = document.createElement('div');
    host.append(header, body);
    document.body.append(host);
    const root = createRoot(body);

    try {
      await act(async () => {
        root.render(
          <NodeCardDetails
            node={sampleNode}
            map={{ nodes: [sampleNode] }}
            isExpanded={true}
            menuContainer={header}
          />
        );
      });

      expect(useBookmarksStore.getState().isBookmarked(sampleNode.id)).toBe(false);

      // Open menu
      const trigger = header.querySelector<HTMLButtonElement>('[data-testid="node-context-menu-trigger"]')!;
      expect(trigger).not.toBeNull();
      await act(async () => trigger.click());

      // Find bookmark item
      const bookmarkMenuItem = header.querySelector<HTMLButtonElement>('[data-testid="node-context-menu-item-bookmark"]')!;
      expect(bookmarkMenuItem).not.toBeNull();
      expect(bookmarkMenuItem.textContent).toContain('Добавить в закладки');

      // Click to bookmark
      await act(async () => bookmarkMenuItem.click());

      expect(useBookmarksStore.getState().isBookmarked(sampleNode.id)).toBe(true);
      expect(useBookmarksStore.getState().bookmarkedIds).toContain(sampleNode.id);

      // Verify localStorage was updated
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.bookmarkedIds).toContain(sampleNode.id);

      // Open menu again to check state
      await act(async () => trigger.click());
      const updatedMenuItem = header.querySelector<HTMLButtonElement>('[data-testid="node-context-menu-item-bookmark"]')!;
      expect(updatedMenuItem.textContent).toContain('Удалить из закладок');

      // Click again to unbookmark
      await act(async () => updatedMenuItem.click());
      expect(useBookmarksStore.getState().isBookmarked(sampleNode.id)).toBe(false);
      expect(useBookmarksStore.getState().bookmarkedIds).not.toContain(sampleNode.id);
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });

  it('manages multiple bookmarks, provides correct count and handles removal', () => {
    const store = useBookmarksStore.getState();

    store.addBookmark('node-1');
    store.addBookmark('node-2');
    store.addBookmark('node-3');

    expect(useBookmarksStore.getState().bookmarkedIds.length).toBe(3);
    expect(useBookmarksStore.getState().isBookmarked('node-2')).toBe(true);

    store.removeBookmark('node-2');
    expect(useBookmarksStore.getState().bookmarkedIds.length).toBe(2);
    expect(useBookmarksStore.getState().isBookmarked('node-2')).toBe(false);
    expect(useBookmarksStore.getState().bookmarkedIds).toEqual(['node-3', 'node-1']);

    store.clearAllBookmarks();
    expect(useBookmarksStore.getState().bookmarkedIds.length).toBe(0);
  });

  it('renders bookmark item with 2D geometry thumbnail', async () => {
    useBookmarksStore.getState().addBookmark(sampleNode.id);
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);

    const { NodeGeometryThumbnail } = await import('./components/NodeGeometryThumbnail');

    await act(async () => {
      root.render(
        <div data-testid={`bookmark-item-${sampleNode.id}`}>
          <NodeGeometryThumbnail node={sampleNode} size={30} />
          <span>{sampleNode.title}</span>
        </div>
      );
    });

    const item = host.querySelector(`[data-testid="bookmark-item-${sampleNode.id}"]`);
    expect(item).not.toBeNull();
    const thumbnail = item?.querySelector(`[data-testid="node-geometry-thumbnail-${sampleNode.id}"]`);
    expect(thumbnail).not.toBeNull();
    expect(thumbnail?.querySelector('svg')).not.toBeNull();

    await act(async () => root.unmount());
    host.remove();
  });
});
