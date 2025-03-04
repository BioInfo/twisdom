# Twisdom: Twitter Bookmark Manager

**Product Requirements Document**

**Version:** 1.0.0
**Last Updated:** March 4, 2025
**Status:** MVP Implementation

## Executive Summary

Twisdom is a sophisticated Twitter bookmark management application designed to help users organize, analyze, and extract insights from their Twitter bookmarks. The application leverages AI to enhance the user experience by automatically categorizing content, generating summaries, and providing intelligent recommendations.

This document outlines the product requirements, technical specifications, and implementation details for the Twisdom application.

## Product Vision

Twisdom transforms the way users interact with their Twitter bookmarks by providing an intelligent, organized system for knowledge management. By combining powerful organization tools with AI-driven insights, Twisdom helps users extract maximum value from their curated Twitter content.

## User Personas

### Primary Persona: Knowledge Worker
- **Name:** Alex
- **Role:** Digital marketer, researcher, or content creator
- **Goals:** Stay informed on industry trends, organize research, extract insights
- **Pain Points:** Overwhelmed by information, difficulty finding saved content, no system for organizing bookmarks

### Secondary Persona: Casual Reader
- **Name:** Jordan
- **Role:** Twitter enthusiast
- **Goals:** Save interesting content for later reading, organize by topics
- **Pain Points:** Forgets what was saved, no prioritization system, difficulty tracking what has been read

## Core Features

### 1. Bookmark Management
- Import Twitter bookmarks via CSV
- View, filter, sort, and search bookmarks
- Track reading status (unread, reading, completed)
- Assign priority levels (low, medium, high)
- Add notes and highlights to bookmarks

### 2. Organization System
- Tag-based organization with hierarchical tag groups
- Collection-based organization with nested collections
- Reading queue with favorites and priority management
- Date-based filtering and organization

### 3. AI-Enhanced Features
- Automatic content analysis and summarization
- Sentiment analysis (positive, negative, neutral)
- Topic extraction and tag suggestions
- Reading difficulty assessment and time estimation
- Similar content recommendations

### 4. Reading Experience
- Distraction-free reading mode
- Progress tracking
- Highlighting and annotation tools
- Reading history and activity tracking

### 5. Insights and Analytics
- Reading activity visualization
- Content relationship mapping
- Author network visualization
- Tag hierarchy visualization

## User Flows

### Bookmark Import Flow
1. User uploads Twitter bookmark CSV
2. System parses and displays bookmarks
3. Optional: System analyzes bookmarks with AI
4. Bookmarks are stored in local storage

### Reading Flow
1. User browses bookmarks using filters and search
2. User selects a bookmark to read
3. System displays content in reader view
4. User can highlight, annotate, and track progress
5. System updates reading status upon completion

### Organization Flow
1. User creates collections and tags
2. User assigns bookmarks to collections
3. User adds tags to bookmarks
4. System suggests additional tags and collections
5. User organizes reading queue by priority

## Technical Specifications

### Technology Stack
- **Frontend:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **State Management:** React useState (centralized)
- **Data Storage:** Browser localStorage
- **AI Integration:** OpenAI API (GPT-4)

### Data Models

#### TwitterBookmark
```typescript
interface TwitterBookmark {
  id: string;
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
  summary?: string;
  extractedLinks?: {
    url: string;
    title?: string;
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
```

#### BookmarkStore
```typescript
interface BookmarkStore {
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
```

### Component Architecture

#### Page Components
- **BookmarksPage:** Main view for browsing and filtering bookmarks
- **InsightsPage:** Analytics and visualizations
- **CollectionsPage:** Collection management
- **TagsPage:** Tag management and visualization
- **LinksPage:** Link extraction and management
- **ActivityPage:** Reading activity tracking

#### Core UI Components
- **BookmarkCard:** Display individual bookmarks
- **FilterBar:** Search, filter, and sort controls
- **Reader:** Immersive reading experience
- **CollectionsPanel:** Collection management interface
- **CollectionTree:** Hierarchical collection browser
- **ReadingQueue:** Priority-based reading list
- **TagHierarchyVisualizer:** Visual tag relationships
- **Header:** Navigation and global actions
- **SettingsPanel:** Application settings

#### Visualization Components
- **ActivityHeatmap:** Calendar-based activity visualization
- **AuthorNetwork:** Network graph of authors and relationships

### AI Integration

The application integrates with OpenAI's GPT-4 API to provide the following AI-enhanced features:

1. **Content Analysis:**
   - Sentiment detection (positive, negative, neutral)
   - Topic extraction and categorization
   - Summary generation
   - Reading difficulty assessment

2. **Recommendation Engine:**
   - Similar content suggestions
   - Collection suggestions
   - Tag recommendations

3. **Organization Assistance:**
   - Automatic tag grouping
   - Content relationship mapping

## Non-Functional Requirements

### Performance
- Initial load time under 2 seconds
- Smooth scrolling with up to 1000 bookmarks
- AI analysis operations should complete within 5 seconds
- Responsive UI across device sizes

### Security
- Secure handling of API keys
- Content sanitization for user-generated content
- No exposure of sensitive user data

### Reliability
- Graceful error handling for API failures
- Data persistence across browser sessions
- Fallback mechanisms for AI analysis

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## Technical Constraints and Limitations

### Current Limitations
- Client-side only architecture
- LocalStorage limit (~5MB) restricts total bookmark capacity
- No user authentication or multi-device sync
- API key exposed in client-side code
- No offline support

### Future Considerations
- Backend integration for data persistence
- User authentication and multi-device sync
- Improved security for API key handling
- Offline support via service workers
- Performance optimizations for larger datasets

## Implementation Roadmap

### Phase 1: MVP (Current)
- Basic bookmark management
- CSV import functionality
- Simple organization system
- Initial AI integration
- Local storage persistence

### Phase 2: Enhanced Features
- Improved AI analysis
- Advanced visualization tools
- Enhanced reading experience
- Tag hierarchy and relationships
- Performance optimizations

### Phase 3: Architecture Improvements
- Backend integration
- User authentication
- Multi-device sync
- Improved security
- Offline support

## Success Metrics

- User engagement (time spent in app)
- Reading completion rate
- Organization system usage
- AI feature utilization
- User satisfaction with organization and insights

## Appendix

### API Integration Details

#### OpenAI API
- **Endpoint:** https://api.openai.com/v1/chat/completions
- **Model:** gpt-4-turbo-preview
- **Key Features Used:**
  - Chat completions
  - JSON response format
  - System instructions for specialized analysis

### Data Import Format
CSV format with the following columns:
- Tweet Date
- Posted By
- Posted By Profile Pic
- Posted By Profile URL
- Posted By Twitter Handle
- Tweet URL
- Content
- Tags (comma-separated)
- Comments
- Media URL