// ============================================================================
// RICIS-III BOOKMARKS DOMAIN CONTRACTS (DDD / CLEAN ARCHITECTURE)
// Typed representation of node bookmarks saved to local storage.
// ============================================================================

export interface BookmarkItem {
  readonly nodeId: string;
  readonly addedAt: number;
  readonly note?: string;
}

export interface BookmarksState {
  readonly bookmarkedIds: readonly string[];
  readonly bookmarks: Readonly<Record<string, BookmarkItem>>;
}

export const BOOKMARKS_STORAGE_KEY = 'ricis_bookmarked_nodes';
export const BOOKMARKS_CHANGE_EVENT = 'ricis:bookmarks:changed';
