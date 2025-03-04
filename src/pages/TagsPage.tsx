import React, { useState, useMemo } from 'react';
import { Tag as TagIcon, Plus, Edit2, Trash2, Check, X, Brain, Sparkles, ArrowDown } from 'lucide-react';
import { TagHierarchyVisualizer } from '../components/TagHierarchyVisualizer';
import { TwitterBookmark, BookmarkStore } from '../types';
import { suggestTags, generateTagGroups } from '../services/aiService';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  bookmarks: TwitterBookmark[];
}

interface TagGroup {
  name: string;
  tags: string[];
  color?: string;
  description?: string;
}

export function TagsPage({ store, onUpdateStore, bookmarks }: Props) {
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [showTagVisualizer, setShowTagVisualizer] = useState(true);

  const tagStats = useMemo(() => {
    const stats = new Map<string, {
      count: number;
      bookmarks: TwitterBookmark[];
      aiTopics: Set<string>;
      sentiment: {
        total: number;
        positive: number;
        negative: number;
        neutral: number;
      };
    }>();

    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => {
        if (!stats.has(tag)) {
          stats.set(tag, {
            count: 0,
            bookmarks: [],
            aiTopics: new Set(),
            sentiment: { total: 0, positive: 0, negative: 0, neutral: 0 }
          });
        }
        const tagStat = stats.get(tag)!;
        tagStat.count++;
        tagStat.bookmarks.push(bookmark);
        if (bookmark.aiAnalysis?.keyTopics) {
          bookmark.aiAnalysis.keyTopics.forEach(topic => tagStat.aiTopics.add(topic));
        }
        if (bookmark.sentiment) {
          tagStat.sentiment.total++;
          tagStat.sentiment[bookmark.sentiment]++;
        }
      });
    });

    return stats;
  }, [bookmarks]);

  // Collect all AI-suggested tags
  const aiSuggestedTags = useMemo(() => {
    const tagMap = new Map<string, {
      count: number;
      bookmarks: TwitterBookmark[];
    }>();
    
    bookmarks.forEach(bookmark => {
      bookmark.suggestedTags?.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, { count: 0, bookmarks: [] });
        }
        const tagStat = tagMap.get(tag)!;
        tagStat.count++;
        tagStat.bookmarks.push(bookmark);
      });
    });
    return tagMap;
  }, [bookmarks]);

  const tagGroups = useMemo(() => {
    const groups: TagGroup[] = [
      { name: 'Popular', tags: [], color: 'blue' },
      { name: 'Technical', tags: [], color: 'purple' },
      { name: 'News & Updates', tags: [], color: 'green' },
      { name: 'Resources', tags: [], color: 'orange' },
      { name: 'Discussions', tags: [], color: 'yellow' }
    ];

    Array.from(tagStats.entries()).forEach(([tag, stats]) => {
      // Categorize based on AI topics and patterns
      if (stats.count > 5) {
        groups[0].tags.push(tag);
      }
      if (Array.from(stats.aiTopics).some(topic => 
        /\b(code|programming|dev|tech|api|framework|library)\b/i.test(topic)
      )) {
        groups[1].tags.push(tag);
      }
      if (Array.from(stats.aiTopics).some(topic => 
        /\b(news|update|release|announcement)\b/i.test(topic)
      )) {
        groups[2].tags.push(tag);
      }
      if (Array.from(stats.aiTopics).some(topic => 
        /\b(tutorial|guide|documentation|learn|resource)\b/i.test(topic)
      )) {
        groups[3].tags.push(tag);
      }
      if (Array.from(stats.aiTopics).some(topic => 
        /\b(discussion|thread|debate|question)\b/i.test(topic)
      )) {
        groups[4].tags.push(tag);
      }
    });

    return groups;
  }, [tagStats]);

  const handleCreateTag = () => {
    if (!newTag.trim()) return;
    
    onUpdateStore({
      ...store,
      tagGroups: {
        ...store.tagGroups,
        uncategorized: store.tagGroups?.uncategorized ? {
          ...store.tagGroups.uncategorized,
          tags: [...store.tagGroups.uncategorized.tags, newTag.trim()]
        } : {
          tags: [newTag.trim()],
          color: 'gray',
          lastModified: new Date().toISOString()
        }
      }
    });
    setNewTag('');
  };

  const handleDeleteTag = (tag: string) => {
    onUpdateStore({
      ...store,
      bookmarks: store.bookmarks.map(bookmark => ({
        ...bookmark,
        tags: bookmark.tags.filter(t => t !== tag)
      }))
    });
  };

  const handleRenameTag = (oldTag: string) => {
    if (!editedName.trim() || editedName === oldTag) {
      setEditingTag(null);
      return;
    }

    onUpdateStore({
      ...store,
      bookmarks: store.bookmarks.map(bookmark => ({
        ...bookmark,
        tags: bookmark.tags.map(t => t === oldTag ? editedName : t)
      }))
    });
    setEditingTag(null);
  };
  
  const handleAddTagToBookmarks = (tag: string, bookmarkIds: string[]) => {
    onUpdateStore({
      ...store,
      bookmarks: store.bookmarks.map(bookmark => {
        if (bookmarkIds.includes(bookmark.id)) {
          return {
            ...bookmark,
            tags: [...new Set([...bookmark.tags, tag])],
            suggestedTags: bookmark.suggestedTags?.filter(t => t !== tag)
          };
        }
        return bookmark;
      })
    });
  };

  const handleGenerateAITags = async () => {
    setIsGeneratingTags(true);
    try {
      const suggestions = await suggestTags(bookmarks);
      if (suggestions) {
        onUpdateStore({
          ...store,
          bookmarks: store.bookmarks.map(bookmark => ({
            ...bookmark,
            tags: [...new Set([...bookmark.tags, ...(bookmark.aiAnalysis?.keyTopics || [])])]
          }))
        });
      }
    } catch (error) {
      console.error('Failed to generate tags:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateTagGroups = async () => {
    setIsGeneratingGroups(true);
    try {
      const groups = await generateTagGroups(bookmarks);
      if (groups) {
        onUpdateStore({
          ...store,
          tagGroups: groups.reduce((acc, group) => ({
            ...acc,
            [group.name]: {
              tags: group.tags,
              color: group.color,
              icon: group.icon,
              description: group.description,
              isAIGenerated: true,
              lastModified: new Date().toISOString()
            }
          }), {})
        });
      }
    } catch (error) {
      console.error('Failed to generate tag groups:', error);
    } finally {
      setIsGeneratingGroups(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => setShowTagVisualizer(!showTagVisualizer)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-2"
        >
          <ArrowDown className={`w-5 h-5 transform ${showTagVisualizer ? 'rotate-180' : ''}`} />
          {showTagVisualizer ? 'Hide Tag Visualization' : 'Show Tag Visualization'}
        </button>
        
        {showTagVisualizer && (
          <TagHierarchyVisualizer store={store} onUpdateStore={onUpdateStore} />
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <TagIcon className="w-7 h-7 mr-3 text-blue-500" />
            Tag Management
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateAITags}
              disabled={isGeneratingTags}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isGeneratingTags
                  ? 'bg-blue-100 text-blue-400 cursor-wait'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Sparkles className="w-5 h-5" /> {isGeneratingTags ? 'Generating...' : 'Generate Tags'}
            </button>
            <button
              onClick={handleGenerateTagGroups}
              disabled={isGeneratingGroups}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isGeneratingGroups
                  ? 'bg-purple-100 text-purple-400 cursor-wait'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              <Brain className="w-5 h-5" />
              {isGeneratingGroups ? 'Generating...' : 'Generate Tag Groups'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag name"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Tag
            </button>
          </div>
        </div>
        
        {/* AI Suggested Tags Section */}
        {aiSuggestedTags.size > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Suggested Tags
              </h3>
              <div className="px-2 py-0.5 rounded text-sm bg-purple-100 text-purple-800">
                {aiSuggestedTags.size} tags
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(aiSuggestedTags.entries()).map(([tag, stats]) => (
                <div key={tag} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-purple-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      {tag}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const bookmarkIds = stats.bookmarks.map(b => b.id);
                          handleAddTagToBookmarks(tag, bookmarkIds);
                        }}
                        className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add to all
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Suggested for</span>
                      <span className="font-medium">{stats.count} bookmarks</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {stats.bookmarks.slice(0, 2).map(b => (
                        <div key={b.id} className="truncate">
                          {b.postedBy}: {b.content.substring(0, 40)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tagGroups.map(group => (
          <div key={group.name} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {group.name}
              </h3>
              <div className={`px-2 py-0.5 rounded text-sm bg-${group.color}-100 text-${group.color}-800`}>
                {group.tags.length} tags
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tags.map(tag => {
                const stats = tagStats.get(tag)!;
                return (
                  <div key={tag} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {editingTag === tag ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameTag(tag)}
                          className="p-1 text-green-500 hover:text-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="p-1 text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <TagIcon className="w-4 h-4" />
                          {tag}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingTag(tag);
                              setEditedName(tag);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="p-1 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Bookmarks</span>
                        <span className="font-medium">{stats.count}</span>
                      </div>

                      {stats.aiTopics.size > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(stats.aiTopics).slice(0, 3).map(topic => (
                            <span
                              key={topic}
                              className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${stats.sentiment.total > 0 ? (stats.sentiment.positive / stats.sentiment.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-green-600">{stats.sentiment.positive}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}