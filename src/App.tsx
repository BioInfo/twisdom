import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { BookmarksPage } from './pages/BookmarksPage';
import { InsightsPage } from './pages/InsightsPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TagsPage } from './pages/TagsPage';
import { LinksPage } from './pages/LinksPage';
import { parseCSV, saveCSV, loadSavedCSV } from './utils/bookmarkParser';
import { analyzeBookmark } from './utils/aiAnalyzer';
import { TwitterBookmark, BookmarkStore } from './types';
import { loadStore, saveStore, DEFAULT_STORE } from './utils/storage';
import { loadStoreFromSupabase, saveStoreToSupabase, getCurrentUser, signInWithEmailAndPassword, signUpWithEmailAndPassword, signOut } from './utils/supabaseStorage';
import { User } from '@supabase/supabase-js';
import SupabaseAuth from './components/SupabaseAuth';
import { migrateLocalStorageToSupabase } from './utils/migrateToSupabase';

// Define future flags for React Router
const FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

export default function App() {
  const [store, setStore] = useState<BookmarkStore>(DEFAULT_STORE);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    inProgress: boolean;
    success?: boolean;
    message?: string;
  }>({ inProgress: false });

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', store.theme === 'dark');
  }, [store.theme]);

  // Check for authenticated user on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          // User is authenticated, load data from Supabase
          const supabaseStore = await loadStoreFromSupabase(currentUser.id);
          if (supabaseStore) {
            setStore(supabaseStore);
          } else {
            // No data in Supabase yet, check localStorage
            const localStore = loadStore();
            if (localStore) {
              setStore(localStore);
              // Offer to migrate data
              setAuthModalOpen(true);
            }
          }
        } else {
          // No authenticated user, load from localStorage
          const localStore = loadStore();
          if (localStore) {
            setStore(localStore);
          } else {
            // No localStorage data, try to load from CSV
            loadSavedCSV().then(bookmarks => {
              if (bookmarks) {
                Promise.all(bookmarks.map(async bookmark => ({
                  ...bookmark,
                  ...(await analyzeBookmark(bookmark))
                }))).then(analyzedBookmarks => {
                  const newStore: BookmarkStore = {
                    ...DEFAULT_STORE,
                    bookmarks: analyzedBookmarks,
                    filteredBookmarks: analyzedBookmarks,
                  };
                  setStore(newStore);
                  saveStore(newStore);
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Save store whenever it changes
  useEffect(() => {
    if (store && !loading) {
      // Skip saving during logout process
      if (isLoggingOut) {
        return;
      }
      
      // Deduplicate bookmarks based on tweet_id before saving
      const uniqueBookmarks = Array.from(
        new Map(store.bookmarks.map(bookmark => [bookmark.id, bookmark])).values()
      );
      
      if (uniqueBookmarks.length !== store.bookmarks.length) {
        setStore(prev => ({
          ...prev,
          bookmarks: uniqueBookmarks,
          filteredBookmarks: uniqueBookmarks
        }));
        return; // Skip saving this time, will save on next effect trigger
      }
      
      if (user) {
        // Save to Supabase if user is authenticated
        try {
          saveStoreToSupabase(store, user.id)
            .then(result => {
              if (!result.success) {
                // Handle RLS errors gracefully
                if (result.error?.includes('Authentication error')) {
                  console.warn('Authentication issue during save:', result.error);
                } else {
                  console.error('Error saving to Supabase:', result.error);
                }
              }
            })
            .catch(error => {
              console.error('Exception in saveStoreToSupabase:', error);
            });
        } catch (error) {
          console.error('Error in saveStoreToSupabase:', error);
        }
      } else {
        // Save to localStorage if no user
        saveStore(store);
      }
    }
  }, [store, user, loading, isLoggingOut]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { success, user: authUser, error } = await signInWithEmailAndPassword(email, password);
      if (success && authUser) {
        setUser(authUser);
        
        // Load user's data from Supabase
        const supabaseStore = await loadStoreFromSupabase(authUser.id);
        if (supabaseStore) {
          setStore(supabaseStore);
        }
        
        setAuthModalOpen(false);
      } else {
        console.error('Login failed:', error);
        return { success: false, error };
      }
      return { success, error };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const { success, user: authUser, error } = await signUpWithEmailAndPassword(email, password);
      if (success && authUser) {
        setUser(authUser);
        setAuthModalOpen(false);
      } else {
        console.error('Sign up failed:', error);
        return { success: false, error };
      }
      return { success, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const handleLogout = async () => {
    try {
      // Set logging out flag to prevent Supabase saves during logout
      setIsLoggingOut(true);
      
      await signOut();
      setUser(null);
      
      // Load data from localStorage after logout
      const localStore = loadStore();
      if (localStore) {
        setStore(localStore);
      } else {
        setStore(DEFAULT_STORE);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMigrateData = async () => {
    if (!user) return;
    
    setMigrationStatus({ inProgress: true, message: 'Migration in progress...' });
    
    try {
      const result = await migrateLocalStorageToSupabase(user.id);
      
      if (result.success) {
        setMigrationStatus({ 
          inProgress: false, 
          success: true, 
          message: 'Data successfully migrated to Supabase!' 
        });
        
        // Load the migrated data
        const supabaseStore = await loadStoreFromSupabase(user.id);
        if (supabaseStore) {
          setStore(supabaseStore);
        }
      } else {
        setMigrationStatus({ 
          inProgress: false, 
          success: false, 
          message: `Migration failed: ${result.message}` 
        });
      }
    } catch (error) {
      setMigrationStatus({ 
        inProgress: false, 
        success: false, 
        message: `Migration error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const toggleTheme = useCallback(() => {
    setStore(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  }, []);

  const toggleViewMode = useCallback(() => {
    setStore(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'normal' ? 'compact' : 'normal'
    }));
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const bookmarks = await parseCSV(file);
      await saveCSV(file);
      setStore((prev) => ({
        ...prev,
        bookmarks,
        filteredBookmarks: bookmarks,
      }));
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
    }
  };

  const handleSearch = useCallback((term: string) => {
    setStore((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const handleTagSelect = useCallback((tag: string) => {
    setStore((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  }, []);

  const handleSort = useCallback(
    ({ by, order }: { by: 'date' | 'author' | 'sentiment'; order: 'asc' | 'desc' }) => {
      setStore((prev) => ({ ...prev, sortBy: by, sortOrder: order }));
    },
    []
  );

  const handleReadingStatusChange = useCallback((status: BookmarkStore['filterReadingStatus']) => {
    setStore(prev => ({ ...prev, filterReadingStatus: status }));
  }, []);

  const updateBookmarkReadingStatus = useCallback((id: string, status: TwitterBookmark['readingStatus']) => {
    setStore(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.map(bookmark =>
        bookmark.id === id
          ? { ...bookmark, readingStatus: status, lastReadAt: status === 'completed' ? new Date().toISOString() : bookmark.lastReadAt }
          : bookmark
      )
    }));
  }, []);

  const updateBookmarkPriority = useCallback((id: string, priority: TwitterBookmark['priority']) => {
    setStore(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.map(bookmark =>
        bookmark.id === id
          ? { ...bookmark, priority }
          : bookmark
      )
    }));
  }, []);

  const handleToggleFavorite = useCallback((id: string, category: string) => {
    setStore(prev => {
      const favorites = prev.readingQueue.favorites[category];
      const isCurrentlyFavorited = favorites.bookmarks.includes(id);
      
      return {
        ...prev,
        readingQueue: {
          ...prev.readingQueue,
          favorites: {
            ...prev.readingQueue.favorites,
            [category]: {
              ...favorites,
              bookmarks: isCurrentlyFavorited
                ? favorites.bookmarks.filter(bookmarkId => bookmarkId !== id)
                : [...favorites.bookmarks, id]
            }
          }
        }
      };
    });
  }, []);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    store.bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [store.bookmarks]);

  const filteredAndSortedBookmarks = useMemo(() => {
    let result = [...store.bookmarks];

    // Apply full-text search
    if (store.searchTerm) {
      result = result.filter(bookmark => 
        bookmark.content.toLowerCase().includes(store.searchTerm.toLowerCase()) ||
        bookmark.postedBy.toLowerCase().includes(store.searchTerm.toLowerCase())
      );
    }

    // Apply tag filter
    if (store.selectedTags.length > 0) {
      result = result.filter((bookmark) =>
        store.selectedTags.every((tag) => bookmark.tags.includes(tag))
      );
    }

    // Apply reading status filter
    if (store.filterReadingStatus !== 'all') {
      result = result.filter(bookmark => bookmark.readingStatus === store.filterReadingStatus);
    }

    // Apply date range filter
    if (store.dateRange?.start || store.dateRange?.end) {
      result = result.filter(bookmark => {
        const date = new Date(bookmark.tweetDate);
        if (store.dateRange?.start && date < store.dateRange.start) return false;
        if (store.dateRange?.end && date > store.dateRange.end) return false;
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = store.sortBy === 'date' ? a.tweetDate : a.postedBy;
      const bValue = store.sortBy === 'date' ? b.tweetDate : b.postedBy;
      
      if (store.sortBy === 'sentiment') {
        const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
        return store.sortOrder === 'asc'
          ? (sentimentOrder[a.sentiment || 'neutral'] - sentimentOrder[b.sentiment || 'neutral'])
          : (sentimentOrder[b.sentiment || 'neutral'] - sentimentOrder[a.sentiment || 'neutral']);
      }
      
      return store.sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return result;
  }, [store.bookmarks, store.searchTerm, store.selectedTags, store.sortBy, store.sortOrder, store.filterReadingStatus, store.dateRange]);

  // Show authentication modal if not authenticated
  const renderAuthModal = () => {
    if (!authModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="mb-4">Sign in or create an account to use Supabase for data storage.</p>
          
          {user ? (
            <div>
              <p className="mb-4">You are signed in as {user.email}</p>
              
              {migrationStatus.inProgress ? (
                <div className="mb-4">
                  <p>{migrationStatus.message}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <>
                  {migrationStatus.message && (
                    <div className={`mb-4 p-2 rounded ${migrationStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {migrationStatus.message}
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleMigrateData}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Migrate Data to Supabase
                    </button>
                    
                    <button
                      onClick={() => setAuthModalOpen(false)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <SupabaseAuth onClose={() => setAuthModalOpen(false)} />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={FUTURE_FLAGS as any}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <Header
          store={store}
          onUpdateStore={setStore}
          onFileUpload={handleFileUpload}
          onThemeToggle={toggleTheme}
          onViewModeToggle={toggleViewMode}
          bookmarkCount={store.bookmarks.length}
          user={user}
          onLogin={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/bookmarks" replace />} />
          <Route
            path="/bookmarks"
            element={
              <BookmarksPage
                store={store}
                onUpdateStore={setStore}
                onSearch={handleSearch}
                onTagSelect={handleTagSelect}
                onSortChange={handleSort}
                onReadingStatusChange={handleReadingStatusChange}
                onToggleFavorite={handleToggleFavorite}
                onUpdateReadingStatus={updateBookmarkReadingStatus}
                onUpdatePriority={updateBookmarkPriority}
                availableTags={availableTags}
                filteredAndSortedBookmarks={filteredAndSortedBookmarks}
              />
            }
          />
          <Route
            path="/insights"
            element={<InsightsPage bookmarks={store.bookmarks} />}
          />
          <Route
            path="/collections"
            element={
              <CollectionsPage
                store={store}
                onUpdateStore={setStore}
                bookmarks={store.bookmarks}
              />
            }
          />
          <Route
            path="/links"
            element={<LinksPage bookmarks={store.bookmarks} />}
          />
          <Route
            path="/tags"
            element={
              <TagsPage
                store={store}
                onUpdateStore={setStore}
                bookmarks={store.bookmarks}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                user={user}
                onLogout={handleLogout}
              />
            }
          />
        </Routes>
        
        {renderAuthModal()}
      </div>
    </BrowserRouter>
  );
}