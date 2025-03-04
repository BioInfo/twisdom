import React from 'react';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';
import { TwitterBookmark, BookmarkStore } from '../types';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  onOpenReader: (bookmark: TwitterBookmark) => void;
}

export function ReadingQueue({ store, onUpdateStore, onOpenReader }: Props) {
  const addToQueue = (bookmarkId: string, status: 'unread' | 'reading' | 'completed') => {
    const newQueue = {
      ...store.readingQueue,
      [status]: [...store.readingQueue[status], bookmarkId],
      history: [
        ...store.readingQueue.history,
        {
          bookmarkId,
          action: status === 'reading' ? 'start' : status === 'completed' ? 'complete' : 'resume',
          timestamp: new Date().toISOString()
        }
      ]
    };

    onUpdateStore({
      ...store,
      readingQueue: newQueue
    });
  };

  const removeFromQueue = (bookmarkId: string, status: 'unread' | 'reading' | 'completed') => {
    const newQueue = {
      ...store.readingQueue,
      [status]: store.readingQueue[status].filter(id => id !== bookmarkId)
    };

    onUpdateStore({
      ...store,
      readingQueue: newQueue
    });
  };

  const getBookmarksByStatus = (status: 'unread' | 'reading' | 'completed') => {
    return store.readingQueue[status]
      .map(id => store.bookmarks.find(b => b.id === id))
      .filter((b): b is TwitterBookmark => b !== undefined);
  };

  const renderQueueSection = (title: string, status: 'unread' | 'reading' | 'completed', icon: React.ReactNode) => {
    const bookmarks = getBookmarksByStatus(status);
    
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-gray-500">({bookmarks.length})</span>
        </div>
        
        <div className="space-y-2">
          {bookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={bookmark.postedByProfilePic}
                  alt={bookmark.postedBy}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{bookmark.postedBy}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {bookmark.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{bookmark.readingTime}m</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onOpenReader(bookmark)}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => removeFromQueue(bookmark.id, status)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          
          {bookmarks.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No bookmarks in this queue
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Reading Queue</h2>
      
      {renderQueueSection(
        'Up Next',
        'unread',
        <BookOpen className="w-5 h-5 text-blue-500" />
      )}
      
      {renderQueueSection(
        'In Progress',
        'reading',
        <Clock className="w-5 h-5 text-yellow-500" />
      )}
      
      {renderQueueSection(
        'Completed',
        'completed',
        <AlertCircle className="w-5 h-5 text-green-500" />
      )}
    </div>
  );
}