import React from 'react';
import { Activity } from 'lucide-react';
import { TwitterBookmark } from '../types';
import { ActivityHeatmap } from '../components/visualizations/ActivityHeatmap';
import { AuthorNetwork } from '../components/visualizations/AuthorNetwork';

interface Props {
  bookmarks: TwitterBookmark[];
}

export function ActivityPage({ bookmarks }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Activity className="w-7 h-7 mr-3 text-blue-500" />
            Activity Overview
          </h2>
        </div>

        <div className="space-y-8">
          <ActivityHeatmap bookmarks={bookmarks} />
          
          <div className="border-t pt-8">
            <h3 className="text-xl font-semibold mb-4">Author Interactions</h3>
            <AuthorNetwork bookmarks={bookmarks} />
          </div>
        </div>
      </div>
    </div>
  );
}