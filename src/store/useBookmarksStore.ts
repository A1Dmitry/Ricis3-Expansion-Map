// ============================================================================
// RICIS-III BOOKMARKS STORE (ZUSTAND / MVVM / REACTIVE PERSISTENCE)
// Global reactive store for managing node bookmarks with localStorage synchronization.
// ============================================================================

import { create } from 'zustand';
import {
  BOOKMARKS_CHANGE_EVENT,
  type BookmarkItem,
  type BookmarksState,
} from '../domain/bookmarks/bookmarks.types';
import {
  addBookmarkToState,
  isNodeBookmarked,
  loadBookmarksFromStorage,
  removeBookmarkFromState,
  saveBookmarksToStorage,
  toggleBookmarkInState,
} from '../domain/bookmarks/bookmarksStorage';

export interface BookmarksStore extends BookmarksState {
  readonly isBookmarked: (nodeId: string) => boolean;
  readonly toggleBookmark: (nodeId: string) => boolean;
  readonly addBookmark: (nodeId: string, note?: string) => void;
  readonly removeBookmark: (nodeId: string) => void;
  readonly clearAllBookmarks: () => void;
  readonly refreshFromStorage: () => void;
}

export const useBookmarksStore = create<BookmarksStore>((set, get) => {
  // Listen for storage events (e.g. from other tabs or components)
  if (typeof window !== 'undefined') {
    window.addEventListener(BOOKMARKS_CHANGE_EVENT, () => {
      set(loadBookmarksFromStorage());
    });
    window.addEventListener('storage', (event) => {
      if (event.key === 'ricis_bookmarked_nodes') {
        set(loadBookmarksFromStorage());
      }
    });
  }

  const initial = loadBookmarksFromStorage();

  return {
    bookmarkedIds: initial.bookmarkedIds,
    bookmarks: initial.bookmarks,

    isBookmarked: (nodeId: string): boolean => {
      return isNodeBookmarked(get(), nodeId);
    },

    toggleBookmark: (nodeId: string): boolean => {
      const current = get();
      const { nextState, isBookmarked: result } = toggleBookmarkInState(current, nodeId);
      set({
        bookmarkedIds: nextState.bookmarkedIds,
        bookmarks: nextState.bookmarks,
      });
      saveBookmarksToStorage(nextState);
      return result;
    },

    addBookmark: (nodeId: string, note?: string): void => {
      const current = get();
      const nextState = addBookmarkToState(current, nodeId, note);
      set({
        bookmarkedIds: nextState.bookmarkedIds,
        bookmarks: nextState.bookmarks,
      });
      saveBookmarksToStorage(nextState);
    },

    removeBookmark: (nodeId: string): void => {
      const current = get();
      const nextState = removeBookmarkFromState(current, nodeId);
      set({
        bookmarkedIds: nextState.bookmarkedIds,
        bookmarks: nextState.bookmarks,
      });
      saveBookmarksToStorage(nextState);
    },

    clearAllBookmarks: (): void => {
      const emptyState: BookmarksState = {
        bookmarkedIds: [],
        bookmarks: {},
      };
      set(emptyState);
      saveBookmarksToStorage(emptyState);
    },

    refreshFromStorage: (): void => {
      set(loadBookmarksFromStorage());
    },
  };
});
