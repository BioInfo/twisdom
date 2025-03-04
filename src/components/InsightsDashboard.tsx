import React, { useMemo } from 'react';
import { PieChart, BarChart, Activity, Calendar, Users, Clock, TrendingUp, Hash } from 'lucide-react';
import { TwitterBookmark } from '../types';

interface Props {
  bookmarks: TwitterBookmark[];
}

export function InsightsDashboard({ bookmarks }: Props) {
  const insights = useMemo(() => {
    // Sentiment distribution
    const sentimentCounts = bookmarks.reduce(
      (acc, bookmark) => {
        if (bookmark.sentiment) {
          acc[bookmark.sentiment]++;
        }
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    // Reading status distribution
    const readingStatusCounts = bookmarks.reduce(
      (acc, bookmark) => {
        acc[bookmark.readingStatus]++;
        return acc;
      },
      { unread: 0, reading: 0, completed: 0 }
    );

    // Top authors analysis
    const authorCounts = new Map<string, number>();
    bookmarks.forEach(bookmark => {
      authorCounts.set(bookmark.postedBy, (authorCounts.get(bookmark.postedBy) || 0) + 1);
    });

    const topAuthors = Array.from(authorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Tag trends
    const tagTrends = new Map<string, { count: number; recentCount: number }>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    bookmarks.forEach(bookmark => {
      const isRecent = new Date(bookmark.tweetDate) > thirtyDaysAgo;
      bookmark.tags.forEach(tag => {
        const trend = tagTrends.get(tag) || { count: 0, recentCount: 0 };
        trend.count++;
        if (isRecent) trend.recentCount++;
        tagTrends.set(tag, trend);
      });
    });

    const trendingTags = Array.from(tagTrends.entries())
      .map(([tag, { count, recentCount }]) => ({
        tag,
        count,
        recentCount,
        growth: (recentCount / count) * 100
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);

    return {
      sentimentCounts,
      readingStatusCounts,
      topAuthors,
      trendingTags,
      totalBookmarks: bookmarks.length,
      avgReadingTime: bookmarks.length ? Math.round(
        bookmarks.reduce((sum, b) => sum + (b.readingTime || 0), 0) / bookmarks.length
      ) : 0,
      completionRate: bookmarks.length ? Math.round(
        (readingStatusCounts.completed / bookmarks.length) * 100
      ) : 0
    };
  }, [bookmarks]);

  const getProgressBarWidth = (value: number, max: number) => {
    if (!max || !value || max <= 0) return '0%';
    const percentage = Math.min(Math.round((value / max) * 100), 100);
    return `${percentage}%`;
  };

  return (
    <div className="mb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Insights Dashboard</h2>
        <div className="text-sm text-gray-500">
          Updated in real-time • {new Date().toLocaleDateString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Bookmarks</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.totalBookmarks}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Completion Rate</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.completionRate}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Avg. Reading Time</h3>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.avgReadingTime} min</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Active Authors</h3>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{insights.topAuthors.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <PieChart className="w-5 h-5 mr-2 text-blue-500" />
            Sentiment Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(insights.sentimentCounts).map(([sentiment, count]) => (
              <div key={sentiment}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{sentiment}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      sentiment === 'positive'
                        ? 'bg-green-500'
                        : sentiment === 'negative'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: getProgressBarWidth(count || 0, insights.totalBookmarks) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Trending Tags (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {insights.trendingTags.map(({ tag, count, growth }) => (
              <div key={tag}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                  <span className="text-gray-500">
                    {count} posts • {Math.round(growth)}% growth
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: getProgressBarWidth(growth || 0, 100) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}