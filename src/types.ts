export interface TwitterBookmark {
  id: string;
  _dbId?: string; // Database UUID for internal use
  tweetDate: string;
  postedBy: string;
  postedByProfilePic: string;
  postedByProfileUrl: string;
  postedByHandle: string;
  tweetUrl: string;
  content: string;
  tags: string[];
  comments: string;
  media: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  aiTags?: string[];
  suggestedTags?: string[];
  summary?: string;
  extractedLinks?: {
    url: string;
    title?: string;
    context?: string;
    type: 'article' | 'image' | 'video' | 'other';
    lastChecked: string;
  }[];
  aiAnalysis?: {
    summary: string;
    keyTopics: string[];
    suggestedCollections: string[];
    relatedBookmarks?: string[];
    readingDifficulty: 'easy' | 'medium' | 'hard';
    estimatedReadTime: number;
  };
  readingStatus: 'unread' | 'reading' | 'completed';
  priority: 'low' | 'medium' | 'high';
  readingTime?: number;
  lastReadAt?: string;
  progress?: number; // 0-100
  notes?: string;
  highlights?: {
    text: string;
    color: string;
    timestamp: string;
  }[];
}

export interface BookmarkStore {
  bookmarks: TwitterBookmark[];
  filteredBookmarks: TwitterBookmark[];
  searchTerm: string;
  selectedTags: string[];
  sortBy: 'date' | 'author' | 'sentiment';
  sortOrder: 'asc' | 'desc';
  theme: 'light' | 'dark';
  collections: { [key: string]: string[] };
  tagGroups?: {
    [key: string]: {
      tags: string[];
      color?: string;
      icon?: string;
      description?: string;
      relatedTags?: string[];
      isAIGenerated?: boolean;
      lastModified: string;
    };
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  nestedCollections: {
    [key: string]: {
      bookmarks: string[];
      name?: string;
      children: string[];
      parentId?: string;
      icon?: string;
      color?: string;
      order?: number;
      description?: string;
      isPrivate?: boolean;
      lastModified: string;
      sharing?: {
        type: 'view' | 'edit';
        users: string[];
        link?: string;
      };
    }
  };
  readingQueue: {
    unread: string[];
    reading: string[];
    completed: string[];
    favorites: {
      [category: string]: {
        bookmarks: string[];
        color?: string;
        icon?: string;
        order: number;
      };
    };
    history: {
      bookmarkId: string;
      action: 'start' | 'resume' | 'complete';
      timestamp: string;
    }[];
  };
  filterReadingStatus: 'all' | 'unread' | 'reading' | 'completed';
  viewMode: 'normal' | 'compact' | 'reader' | 'grid';
  settings: {
    aiEnabled: boolean;
    autoAnalyze: boolean;
    autoGroupTags: boolean;
    defaultReadingView: 'normal' | 'reader';
    markReadOnScroll: boolean;
    progressTrackingEnabled: boolean;
    notificationsEnabled: boolean;
    showMedia: boolean;
    autoArchiveAfterDays?: number;
  };
}