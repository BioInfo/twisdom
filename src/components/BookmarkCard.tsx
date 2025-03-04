import { useState } from 'react';
import { ExternalLink, Calendar, Tag, MessageCircle, ImageIcon, BookOpen, Clock, ThumbsUp, ThumbsDown, MinusCircle, BookOpenCheck, Brain, Sparkles, Star, StarOff } from 'lucide-react';
import { TwitterBookmark, BookmarkStore } from '../types';

interface Props {
  bookmark: TwitterBookmark;
  onUpdateReadingStatus: (id: string, status: TwitterBookmark['readingStatus']) => void;
  onUpdatePriority: (id: string, priority: TwitterBookmark['priority']) => void;
  onToggleFavorite: (id: string, category: string) => void;
  store: BookmarkStore;
  onOpenReader: (bookmark: TwitterBookmark) => void;
  onAnalyze: (bookmark: TwitterBookmark, updateTags?: boolean) => void;
  onShowSimilar: (bookmark: TwitterBookmark) => void;
  isAnalyzing: boolean;
  id: string;
  showMedia?: boolean; 
  viewMode?: 'normal' | 'compact';
}

export function BookmarkCard({ 
  bookmark, 
  onUpdateReadingStatus, 
  onUpdatePriority, 
  onToggleFavorite,
  onOpenReader, 
  onAnalyze,
  onShowSimilar,
  isAnalyzing,
  id,
  showMedia = false,
  viewMode = 'normal',
  store
}: Props) {
  const [showFavoriteMenu, setShowFavoriteMenu] = useState(false);


  const isFavorite = (category: string) =>
    store.readingQueue.favorites[category]?.bookmarks.includes(bookmark.id);

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
      viewMode === 'compact' ? 'p-4' : 'p-6'
    }`} id={id}>
      <div className="flex items-start gap-3 mb-2">
        <div className="rounded-full bg-gray-100 overflow-hidden flex-shrink-0 w-8 h-8">
          <img
            src={bookmark.postedByProfilePic}
            alt={bookmark.postedBy}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
            }}
            loading="lazy"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{bookmark.postedBy}</span>
            <span className="text-gray-500">@{bookmark.postedByHandle}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(bookmark.tweetDate).toLocaleDateString()}
          </div>
        </div>
        <a
          href={bookmark.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 ml-4"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
        <button
          onClick={() => onAnalyze(bookmark, true)}
          disabled={isAnalyzing}
          className={`ml-2 transition-colors ${
            isAnalyzing 
              ? 'text-purple-400 cursor-wait' 
              : 'text-purple-500 hover:text-purple-600'
          }`}
          title={bookmark.aiAnalysis ? "Re-run AI Analysis" : "Run AI Analysis"}
        >
          <div className="relative">
            <Brain className={`w-5 h-5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            {bookmark.aiAnalysis && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full shadow-sm" />
            )}
            {isAnalyzing && (
              <div className="absolute -top-1 -right-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                <div className="w-2 h-2 bg-purple-500 rounded-full absolute top-0 left-0" />
              </div>
            )}
          </div>
        </button>
      </div>
      
      <div className={`flex items-center gap-4 ${viewMode === 'compact' ? 'mb-2' : 'mb-4'} flex-wrap`}>
        <div className="relative">
          <button
            onClick={() => setShowFavoriteMenu(!showFavoriteMenu)}
            className={`p-2 rounded-lg transition-colors ${
              Object.keys(store.readingQueue.favorites).some(cat => isFavorite(cat))
                ? 'text-yellow-500 hover:bg-yellow-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Star className="w-5 h-5" />
          </button>
          
          {showFavoriteMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[150px] z-10">
              {Object.entries(store.readingQueue.favorites).map(([category, { color }]) => (
                <button
                  key={category}
                  onClick={() => {
                    onToggleFavorite(bookmark.id, category);
                    setShowFavoriteMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <span>{category}</span>
                  {isFavorite(category) ? (
                    <Star className={`w-4 h-4 text-${color}-500`} />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onOpenReader(bookmark)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-blue-500"
        >
          {bookmark.progress ? (
            <div className="relative">
              <BookOpenCheck className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 text-xs bg-blue-100 text-blue-800 rounded-full px-1">
                {bookmark.progress}%
              </span>
            </div>
          ) : (
            <BookOpen className="w-5 h-5" />
          )}
        </button>

        <select
          value={bookmark.readingStatus}
          onChange={(e) => onUpdateReadingStatus(bookmark.id, e.target.value as TwitterBookmark['readingStatus'])}
          className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="unread">Unread</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={bookmark.priority}
          onChange={(e) => onUpdatePriority(bookmark.id, e.target.value as TwitterBookmark['priority'])}
          className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">{bookmark.readingTime} min</span>
        </div>
      </div>

      <div className={`flex flex-col gap-2 ${viewMode === 'compact' ? 'mb-2' : 'mb-4'}`}>
        {/* AI Analysis Results */}
        {bookmark.aiAnalysis && (
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-600">AI Analysis</span>
              </div>
              <span className={`text-sm px-2 py-0.5 rounded ${
                bookmark.aiAnalysis.readingDifficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : bookmark.aiAnalysis.readingDifficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {bookmark.aiAnalysis.readingDifficulty} read
              </span>
            </div>
            
            {bookmark.aiAnalysis.keyTopics && bookmark.aiAnalysis.keyTopics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bookmark.aiAnalysis.keyTopics.map(topic => (
                  <span key={topic} className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
        {bookmark.sentiment === 'positive' && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <ThumbsUp className="w-4 h-4" />
            Positive
          </span>
        )}
        {bookmark.sentiment === 'negative' && (
          <span className="flex items-center gap-1 text-red-600 text-sm">
            <ThumbsDown className="w-4 h-4" />
            Negative
          </span>
        )}
        {bookmark.sentiment === 'neutral' && (
          <span className="flex items-center gap-1 text-gray-600 text-sm">
            <MinusCircle className="w-4 h-4" />
            Neutral
          </span>
        )}
        </div>
        
        <button
          onClick={() => onShowSimilar(bookmark)}
          className="mt-2 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4" />
          Find Similar
        </button>
      </div>
      
      <div className={`space-y-2 ${viewMode === 'compact' ? 'mb-2' : 'mb-4'}`}>
        <p className={`text-gray-700 dark:text-gray-300 ${
          viewMode === 'compact' ? 'text-sm line-clamp-2' : ''
        }`}>
          {bookmark.aiAnalysis?.summary || bookmark.content}
        </p>
        {bookmark.aiAnalysis?.summary && viewMode !== 'compact' && (
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="font-medium mb-1">Original Tweet</div>
            {bookmark.content}
          </div>
        )}
      </div>
      
      {bookmark.media && showMedia && viewMode === 'normal' && (
        <div className={`mb-4 relative bg-gray-100 rounded-lg overflow-hidden ${
          'aspect-[16/9]'
        }`}>
          <img
            src={bookmark.media}
            alt="Tweet media"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400';
            }}
            loading="lazy"
          />
        </div>
      )}

      <div className={`flex items-center gap-4 text-gray-500 text-sm ${viewMode === 'compact' ? 'mb-2' : 'mb-4'}`}>
        {bookmark.comments && (
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {bookmark.comments}
          </div>
        )}
        {bookmark.media && !showMedia && (
          <div className="flex items-center">
            <ImageIcon className="w-4 h-4 mr-1" />
            <span className="text-blue-500">
              Show Media
            </span>
          </div>
        )}
      </div>
      
      <div className={`flex flex-wrap gap-2 ${viewMode === 'compact' ? 'text-xs' : ''}`}>
        {bookmark.tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center rounded-full bg-blue-100 text-blue-800 ${
              viewMode === 'compact' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
            }`}
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}