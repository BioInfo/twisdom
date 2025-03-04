import React, { useState } from 'react';
import { BookmarkCard } from '../components/BookmarkCard';
import { FilterBar } from '../components/FilterBar';
import { Reader } from '../components/Reader';
import { ReadingQueue } from '../components/ReadingQueue';
import { Sparkles, X } from 'lucide-react';
import { TwitterBookmark, BookmarkStore } from '../types';
import { analyzeBookmark, findSimilarBookmarks } from '../utils/aiAnalyzer';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  onSearch: (term: string) => void;
  onTagSelect: (tag: string) => void;
  onSortChange: (sort: { by: 'date' | 'author' | 'sentiment'; order: 'asc' | 'desc' }) => void;
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
  onReadingStatusChange: (status: BookmarkStore['filterReadingStatus']) => void;
  onUpdateReadingStatus: (id: string, status: TwitterBookmark['readingStatus']) => void;
  onUpdatePriority: (id: string, priority: TwitterBookmark['priority']) => void;
  onToggleFavorite: (id: string, category: string) => void;
  availableTags: string[];
  filteredAndSortedBookmarks: TwitterBookmark[];
}

export function BookmarksPage({
  store,
  onUpdateStore,
  onSearch,
  onTagSelect,
  onSortChange,
  onReadingStatusChange,
  onDateRangeChange,
  onUpdateReadingStatus,
  onUpdatePriority,
  availableTags,
  filteredAndSortedBookmarks,
}: Props) {
  const [activeBookmark, setActiveBookmark] = useState<TwitterBookmark | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [similarBookmarks, setSimilarBookmarks] = useState<TwitterBookmark[]>([]);
  const [showingSimilarFor, setShowingSimilarFor] = useState<string | null>(null);

  const handleToggleFavorite = (bookmarkId: string, category: string) => {
    const favorites = store.readingQueue.favorites[category];
    const isCurrentlyFavorited = favorites.bookmarks.includes(bookmarkId);
    
    onUpdateStore({
      ...store,
      readingQueue: {
        ...store.readingQueue,
        favorites: {
          ...store.readingQueue.favorites,
          [category]: {
            ...favorites,
            bookmarks: isCurrentlyFavorited
              ? favorites.bookmarks.filter(id => id !== bookmarkId)
              : [...favorites.bookmarks, bookmarkId]
          }
        }
      }
    });
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    onUpdateStore({
      ...store,
      bookmarks: store.bookmarks.map(b =>
        b.id === id ? { ...b, progress } : b
      )
    });
  };

  const handleAddHighlight = (id: string, highlight: { text: string; color: string; timestamp: string }) => {
    onUpdateStore({
      ...store,
      bookmarks: store.bookmarks.map(b =>
        b.id === id ? {
          ...b,
          highlights: [...(b.highlights || []), highlight]
        } : b
      )
    });
  };

  const handleAddNote = (id: string, note: string) => {
    onUpdateStore({
      ...store,
      bookmarks: store.bookmarks.map(b =>
        b.id === id ? {
          ...b,
          notes: b.notes ? `${b.notes}\n\n${note}` : note
        } : b
      )
    });
  };

  const handleAnalyzeBookmark = async (bookmark: TwitterBookmark, updateTags = false) => {
    if (isAnalyzing) return;
    setIsAnalyzing(bookmark.id);
    
    const bookmarkElement = document.getElementById(`bookmark-${bookmark.id}`);
    if (bookmarkElement) {
      bookmarkElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    try {
      const analysis = await analyzeBookmark(bookmark);
      if (!analysis) {
        throw new Error('Analysis failed - no results returned');
      }

      // Combine existing tags with AI-generated tags if updateTags is true
      const updatedTags = updateTags && analysis.aiTags
        ? [...new Set([...bookmark.tags, ...analysis.aiTags])]
        : bookmark.tags;

      // Create updated bookmark with combined data
      const updatedBookmark: TwitterBookmark = {
        ...bookmark,
        ...analysis,
        // Ensure we keep existing tags and add new ones
        tags: [...new Set([...bookmark.tags, ...(analysis.aiTags || [])])],
      };
      
      onUpdateStore({
        ...store,
        bookmarks: store.bookmarks.map(b =>
          b.id === bookmark.id
            ? updatedBookmark
            : b
        )
      });
    } catch (error) {
      console.error('Analysis failed:', error instanceof Error ? error.message : error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleShowSimilar = async (bookmark: TwitterBookmark) => {
    setShowingSimilarFor(bookmark.id);
    try {
      const similarIndices = await findSimilarBookmarks(bookmark, store.bookmarks);
      const similar = similarIndices
        .map(i => store.bookmarks[i])
        .filter((b): b is TwitterBookmark => b !== undefined && b.id !== bookmark.id);
      setSimilarBookmarks(similar);
    } catch (error) {
      console.error('Failed to find similar bookmarks:', error);
    }
  };

  if (store.bookmarks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500 mt-12">
          <p>Upload a CSV file to get started</p>
          <p className="text-sm mt-2">
            Format: Tweet Date, Posted By, Profile Pic, Profile URL, Handle, Tweet URL, Content, Tags, Comments, Media
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <FilterBar
            store={store}
            onSearchChange={onSearch}
            onTagSelect={onTagSelect}
            onSortChange={onSortChange}
            onReadingStatusChange={onReadingStatusChange}
            onDateRangeChange={onDateRangeChange || (() => {})}
            availableTags={availableTags}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedBookmarks.map((bookmark) => (
              <BookmarkCard
                id={`bookmark-${bookmark.id}`}
                key={bookmark.id}
                bookmark={bookmark}
                onUpdateReadingStatus={onUpdateReadingStatus}
                onUpdatePriority={onUpdatePriority}
                onToggleFavorite={handleToggleFavorite}
                store={store}
                onOpenReader={setActiveBookmark}
                onAnalyze={handleAnalyzeBookmark}
                onShowSimilar={handleShowSimilar}
                isAnalyzing={isAnalyzing === bookmark.id}
                showMedia={store.settings.showMedia}
                viewMode={store.viewMode === 'normal' || store.viewMode === 'compact' ? store.viewMode : 'normal'}
              />
            ))}
            
            {showingSimilarFor && similarBookmarks.length > 0 && (
              <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    Similar Bookmarks
                  </h3>
                  <button
                    onClick={() => {
                      setShowingSimilarFor(null);
                      setSimilarBookmarks([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {similarBookmarks.map(bookmark => (
                    <BookmarkCard
                      key={bookmark.id}
                      id={`similar-${bookmark.id}`}
                      bookmark={bookmark}
                      onUpdateReadingStatus={onUpdateReadingStatus}
                      onUpdatePriority={onUpdatePriority}
                      onToggleFavorite={handleToggleFavorite}
                      store={store}
                      onOpenReader={setActiveBookmark}
                      onAnalyze={handleAnalyzeBookmark}
                      onShowSimilar={handleShowSimilar}
                      isAnalyzing={isAnalyzing === bookmark.id}
                      showMedia={store.settings.showMedia}
                      viewMode="compact"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ReadingQueue
          store={store}
          onUpdateStore={onUpdateStore}
          onOpenReader={setActiveBookmark}
        />
      </div>
      
      {activeBookmark && (
        <Reader
          bookmark={activeBookmark}
          onClose={() => setActiveBookmark(null)}
          onUpdateProgress={handleUpdateProgress}
          onAddHighlight={handleAddHighlight}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
}