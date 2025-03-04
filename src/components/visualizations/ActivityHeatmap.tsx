import React from 'react';
import { TwitterBookmark } from '../../types';

interface Props {
  bookmarks: TwitterBookmark[];
}

export function ActivityHeatmap({ bookmarks }: Props) {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);

  const activityData = bookmarks.reduce((acc, bookmark) => {
    const date = bookmark.tweetDate.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Create a grid of months x days
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return date.toLocaleString('default', { month: 'short' });
  }).reverse();

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Heatmap</h3>
      <div className="grid grid-cols-[auto_repeat(31,1fr)] gap-1">
        <div className="col-span-1" /> {/* Empty corner */}
        {days.map(day => (
          <div key={day} className="text-xs text-center text-gray-500">
            {day}
          </div>
        ))}
        
        {months.map(month => (
          <React.Fragment key={month}>
            <div className="text-xs text-gray-500 pr-2">{month}</div>
            {days.map(day => {
              const date = `${today.getFullYear()}-${String(months.indexOf(month) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = activityData[date] || 0;
              return (
                <div
                  key={`${month}-${day}`}
                  className={`w-full aspect-square rounded-sm ${
                    count === 0
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : count < 3
                      ? 'bg-green-200 dark:bg-green-800'
                      : count < 5
                      ? 'bg-green-400 dark:bg-green-600'
                      : 'bg-green-600 dark:bg-green-400'
                  }`}
                  title={`${count} bookmarks on ${date}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}