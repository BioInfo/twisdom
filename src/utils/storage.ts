import { BookmarkStore } from '../types';

const STORAGE_KEY = 'twitter-bookmarks-store';

export const DEFAULT_STORE: BookmarkStore = {
  bookmarks: [],
  filteredBookmarks: [],
  searchTerm: '',
  selectedTags: [],
  sortBy: 'date',
  sortOrder: 'desc',
  theme: 'light',
  collections: {},
  nestedCollections: {},
  readingQueue: {
    unread: [],
    reading: [],
    completed: [],
    favorites: {
      'Quick Access': {
        bookmarks: [],
        color: 'yellow',
        icon: 'star',
        order: 0
      },
      'Must Read': {
        bookmarks: [],
        color: 'red',
        icon: 'bookmark',
        order: 1
      },
      'Reference': {
        bookmarks: [],
        color: 'blue',
        icon: 'book',
        order: 2
      }
    },
    history: []
  },
  filterReadingStatus: 'all',
  viewMode: 'normal',
  settings: {
    aiEnabled: true,
    autoAnalyze: false,
    autoGroupTags: true,
    defaultReadingView: 'normal',
    markReadOnScroll: true,
    progressTrackingEnabled: true,
    notificationsEnabled: false,
    showMedia: false
  }
};

export function saveStore(store: BookmarkStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save store:', error);
  }
}

export function loadStore(): BookmarkStore | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved) as Partial<BookmarkStore>;
    
    // Ensure all required fields exist by merging with defaults
    const store = {
      ...DEFAULT_STORE,
      ...parsed,
      // Ensure nested objects are properly merged
      readingQueue: {
        ...DEFAULT_STORE.readingQueue,
        ...(parsed.readingQueue || {})
      },
      settings: {
        ...DEFAULT_STORE.settings,
        ...(parsed.settings || {})
      },
      nestedCollections: {
        ...DEFAULT_STORE.nestedCollections,
        ...(parsed.nestedCollections || {})
      },
      collections: {
        ...DEFAULT_STORE.collections,
        ...(parsed.collections || {})
      },
    };
    
    // Convert date strings back to Date objects
    if (store.dateRange) {
      if (store.dateRange.start) store.dateRange.start = new Date(store.dateRange.start);
      if (store.dateRange.end) store.dateRange.end = new Date(store.dateRange.end);
    }
    
    return store;
  } catch (error) {
    console.error('Failed to load store:', error);
    return null;
  }
}