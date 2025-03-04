import React, { useState } from 'react';
import { Search, SortAsc, SortDesc, BookOpen, ThumbsUp, ThumbsDown, MinusCircle, Calendar, Hash, X } from 'lucide-react';
import { BookmarkStore } from '../types';

interface Props {
  store: BookmarkStore;
  onSearchChange: (term: string) => void;
  onTagSelect: (tag: string) => void;
  onSortChange: (sort: { by: 'date' | 'author' | 'sentiment'; order: 'asc' | 'desc' }) => void;
  availableTags: string[];
  onReadingStatusChange: (status: BookmarkStore['filterReadingStatus']) => void;
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
}

export function FilterBar({
  store,
  onSearchChange,
  onTagSelect,
  onSortChange,
  availableTags,
  onReadingStatusChange,
  onDateRangeChange
}: Props) {
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({
    start: store.dateRange?.start?.toISOString().split('T')[0],
    end: store.dateRange?.end?.toISOString().split('T')[0]
  });

  const handleDateChange = (type: 'start' | 'end', date: string) => {
    const newRange = {
      ...dateRange,
      [type]: date ? new Date(date) : undefined
    };
    setDateRange(newRange);
    onDateRangeChange({
      start: newRange.start ? new Date(newRange.start) : undefined,
      end: newRange.end ? new Date(newRange.end) : undefined
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search content, authors, tags..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={store.searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Tags:</span>
          </div>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                store.selectedTags.includes(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4 flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Date Range</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => {
                    setDateRange({ start: undefined, end: undefined });
                    onDateRangeChange({ start: undefined, end: undefined });
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={store.sortBy}
            onChange={(e) => onSortChange({ by: e.target.value as 'date' | 'author' | 'sentiment', order: store.sortOrder })}
          >
            <option value="date">Sort by Date</option>
            <option value="author">Sort by Author</option>
            <option value="sentiment">Sort by Sentiment</option>
          </select>
          
          <button
            onClick={() =>
              onSortChange({ by: store.sortBy, order: store.sortOrder === 'asc' ? 'desc' : 'asc' })
            }
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {store.sortOrder === 'asc' ? (
              <SortAsc className="w-5 h-5" />
            ) : (
              <SortDesc className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gray-500" />
            <select
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={store.filterReadingStatus}
              onChange={(e) => onReadingStatusChange(e.target.value as BookmarkStore['filterReadingStatus'])}
            >
              <option value="all">All Items</option>
              <option value="unread">Unread</option>
              <option value="reading">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSortChange({ by: 'sentiment', order: store.sortOrder })}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                store.sortBy === 'sentiment'
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <ThumbsDown className="w-4 h-4" />
              <MinusCircle className="w-4 h-4" />
              Sentiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}