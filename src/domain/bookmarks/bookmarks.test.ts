import { beforeEach, describe, expect, it } from 'vitest';
import {
  addBookmarkToState,
  isNodeBookmarked,
  loadBookmarksFromStorage,
  removeBookmarkFromState,
  saveBookmarksToStorage,
  toggleBookmarkInState,
} from './bookmarksStorage';
import { BOOKMARKS_STORAGE_KEY } from './bookmarks.types';
import { useBookmarksStore } from '../../store/useBookmarksStore';

describe('Bookmarks Domain & Storage Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    useBookmarksStore.getState().clearAllBookmarks();
  });

  it('initializes with empty bookmarks when storage is empty', () => {
    const state = loadBookmarksFromStorage();
    expect(state.bookmarkedIds).toEqual([]);
    expect(state.bookmarks).toEqual({});
  });

  it('adds and checks bookmarks correctly in state', () => {
    let state = loadBookmarksFromStorage();
    expect(isNodeBookmarked(state, 'node-1')).toBe(false);

    state = addBookmarkToState(state, 'node-1', 'Important singularity');
    expect(isNodeBookmarked(state, 'node-1')).toBe(true);
    expect(state.bookmarkedIds).toContain('node-1');
    expect(state.bookmarks['node-1']?.note).toBe('Important singularity');
  });

  it('does not duplicate bookmark when adding same nodeId twice', () => {
    let state = loadBookmarksFromStorage();
    state = addBookmarkToState(state, 'node-1');
    state = addBookmarkToState(state, 'node-1');
    expect(state.bookmarkedIds).toHaveLength(1);
  });

  it('removes bookmark from state', () => {
    let state = loadBookmarksFromStorage();
    state = addBookmarkToState(state, 'node-1');
    state = addBookmarkToState(state, 'node-2');
    expect(state.bookmarkedIds).toHaveLength(2);

    state = removeBookmarkFromState(state, 'node-1');
    expect(isNodeBookmarked(state, 'node-1')).toBe(false);
    expect(isNodeBookmarked(state, 'node-2')).toBe(true);
    expect(state.bookmarkedIds).toEqual(['node-2']);
  });

  it('toggles bookmarks between added and removed states', () => {
    let state = loadBookmarksFromStorage();
    const toggle1 = toggleBookmarkInState(state, 'node-3');
    expect(toggle1.isBookmarked).toBe(true);
    expect(isNodeBookmarked(toggle1.nextState, 'node-3')).toBe(true);

    const toggle2 = toggleBookmarkInState(toggle1.nextState, 'node-3');
    expect(toggle2.isBookmarked).toBe(false);
    expect(isNodeBookmarked(toggle2.nextState, 'node-3')).toBe(false);
  });

  it('persists and reloads bookmarks from localStorage', () => {
    let state = loadBookmarksFromStorage();
    state = addBookmarkToState(state, 'riemann-hypothesis');
    saveBookmarksToStorage(state);

    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('riemann-hypothesis');

    const loaded = loadBookmarksFromStorage();
    expect(isNodeBookmarked(loaded, 'riemann-hypothesis')).toBe(true);
  });

  it('zustand store executes reactive operations and syncs with storage', () => {
    const store = useBookmarksStore.getState();
    expect(store.isBookmarked('p-vs-np')).toBe(false);

    const added = store.toggleBookmark('p-vs-np');
    expect(added).toBe(true);
    expect(useBookmarksStore.getState().isBookmarked('p-vs-np')).toBe(true);
    expect(useBookmarksStore.getState().bookmarkedIds).toContain('p-vs-np');

    // Storage is updated
    const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY) || '{}');
    expect(saved.bookmarkedIds).toContain('p-vs-np');

    // Toggle off
    const removed = store.toggleBookmark('p-vs-np');
    expect(removed).toBe(false);
    expect(useBookmarksStore.getState().isBookmarked('p-vs-np')).toBe(false);
  });
});
