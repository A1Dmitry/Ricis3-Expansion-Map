// ============================================================================
// RICIS-III BOOKMARKS STORAGE SERVICE (SOLID / DRY / RESILIENT LOCAL STORAGE)
// Handles persistence of node bookmarks with safe error fallback & event broadcast.
// ============================================================================

import {
  BOOKMARKS_CHANGE_EVENT,
  BOOKMARKS_STORAGE_KEY,
  type BookmarkItem,
  type BookmarksState,
} from './bookmarks.types';

const INITIAL_BOOKMARKS_STATE: BookmarksState = {
  bookmarkedIds: [],
  bookmarks: {},
};

export function loadBookmarksFromStorage(): BookmarksState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_BOOKMARKS_STATE;
  }
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return INITIAL_BOOKMARKS_STATE;

    const parsed = JSON.parse(raw);
    // Support legacy array of strings or object format
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
      const bookmarks: Record<string, BookmarkItem> = {};
      const now = Date.now();
      for (const id of ids) {
        bookmarks[id] = { nodeId: id, addedAt: now };
      }
      return { bookmarkedIds: ids, bookmarks };
    }

    if (parsed && typeof parsed === 'object') {
      const candidateBookmarks = parsed.bookmarks ?? {};
      const validBookmarks: Record<string, BookmarkItem> = {};
      const ids: string[] = [];

      for (const [key, item] of Object.entries(candidateBookmarks)) {
        if (typeof key === 'string' && item && typeof item === 'object') {
          const rec = item as Partial<BookmarkItem>;
          const nodeId = rec.nodeId || key;
          const addedAt = typeof rec.addedAt === 'number' ? rec.addedAt : Date.now();
          validBookmarks[nodeId] = {
            nodeId,
            addedAt,
            note: typeof rec.note === 'string' ? rec.note : undefined,
          };
          ids.push(nodeId);
        }
      }

      return {
        bookmarkedIds: Array.isArray(parsed.bookmarkedIds) ? parsed.bookmarkedIds.filter((id: any) => validBookmarks[id]) : ids,
        bookmarks: validBookmarks,
      };
    }

    return INITIAL_BOOKMARKS_STATE;
  } catch (error) {
    console.warn('[BookmarksStorage] Failed to read bookmarks from localStorage:', error);
    return INITIAL_BOOKMARKS_STATE;
  }
}

export function saveBookmarksToStorage(state: BookmarksState): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(state));
    // Broadcast change for other components & windows
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_CHANGE_EVENT, { detail: { state } })
    );
  } catch (error) {
    console.warn('[BookmarksStorage] Failed to save bookmarks to localStorage:', error);
  }
}

export function isNodeBookmarked(state: BookmarksState, nodeId: string): boolean {
  if (!nodeId) return false;
  return Boolean(state.bookmarks[nodeId]);
}

export function addBookmarkToState(
  state: BookmarksState,
  nodeId: string,
  note?: string
): BookmarksState {
  if (!nodeId || state.bookmarks[nodeId]) {
    return state;
  }
  const item: BookmarkItem = {
    nodeId,
    addedAt: Date.now(),
    note,
  };
  return {
    bookmarkedIds: [nodeId, ...state.bookmarkedIds],
    bookmarks: {
      ...state.bookmarks,
      [nodeId]: item,
    },
  };
}

export function removeBookmarkFromState(
  state: BookmarksState,
  nodeId: string
): BookmarksState {
  if (!nodeId || !state.bookmarks[nodeId]) {
    return state;
  }
  const nextBookmarks = { ...state.bookmarks };
  delete nextBookmarks[nodeId];
  return {
    bookmarkedIds: state.bookmarkedIds.filter((id) => id !== nodeId),
    bookmarks: nextBookmarks,
  };
}

export function toggleBookmarkInState(
  state: BookmarksState,
  nodeId: string
): { nextState: BookmarksState; isBookmarked: boolean } {
  if (isNodeBookmarked(state, nodeId)) {
    return {
      nextState: removeBookmarkFromState(state, nodeId),
      isBookmarked: false,
    };
  }
  return {
    nextState: addBookmarkToState(state, nodeId),
    isBookmarked: true,
  };
}
