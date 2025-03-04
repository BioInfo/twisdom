import { supabase } from './supabaseClient';
import { BookmarkStore, TwitterBookmark } from '../types';

/**
 * Utility to migrate data from localStorage to Supabase
 * This script helps transition the Twisdom application from using
 * localStorage to using Supabase for data persistence.
 */

/**
 * Main migration function to transfer all data from localStorage to Supabase
 * @param userId The authenticated user's ID to associate data with
 * @returns Promise with migration results
 */
export async function migrateLocalStorageToSupabase(userId: string) {
  try {
    // Load data from localStorage
    const localData = loadFromLocalStorage();
    if (!localData) {
      return { success: false, message: 'No data found in localStorage' };
    }

    // Start a transaction for all operations
    const results = {
      bookmarks: await migrateBookmarks(localData.bookmarks, userId),
      tags: await migrateTags(localData, userId),
      collections: await migrateCollections(localData, userId),
      readingQueue: await migrateReadingQueue(localData, userId),
    };

    return {
      success: true,
      message: 'Migration completed successfully',
      results
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
}

/**
 * Load data from localStorage
 * @returns The BookmarkStore data or null if not found
 */
function loadFromLocalStorage(): BookmarkStore | null {
  try {
    const data = localStorage.getItem('bookmarkStore');
    if (!data) return null;
    return JSON.parse(data) as BookmarkStore;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return null;
  }
}

/**
 * Migrate bookmarks to Supabase
 * @param bookmarks Array of TwitterBookmark objects
 * @param userId The authenticated user's ID
 * @returns Promise with migration results
 */
async function migrateBookmarks(bookmarks: TwitterBookmark[], userId: string) {
  const results = {
    total: bookmarks.length,
    skipped: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as any[]
  };

  for (const bookmark of bookmarks) {
    try {
      // Check if bookmark already exists
      const { data: existingBookmark } = await supabase
        .from('twitter_bookmarks')
        .select('id')
        .eq('tweet_id', bookmark.id)
        .eq('user_id', userId)
        .maybeSingle();
      
      // Skip if bookmark already exists
      if (existingBookmark) {
        results.skipped++;
        continue;
      }
      
      // Map localStorage bookmark to Supabase schema
      const supabaseBookmark = {
        tweet_id: bookmark.id,
        tweet_date: bookmark.tweetDate,
        posted_by: bookmark.postedBy,
        posted_by_profile_pic: bookmark.postedByProfilePic,
        posted_by_profile_url: bookmark.postedByProfileUrl,
        posted_by_handle: bookmark.postedByHandle,
        tweet_url: bookmark.tweetUrl,
        content: bookmark.content,
        comments: bookmark.comments,
        media: bookmark.media,
        sentiment: bookmark.sentiment,
        summary: bookmark.summary,
        reading_status: bookmark.readingStatus,
        priority: bookmark.priority,
        reading_time: bookmark.readingTime,
        last_read_at: bookmark.lastReadAt,
        progress: bookmark.progress,
        notes: bookmark.notes,
        user_id: userId
      };

      // Insert bookmark into Supabase
      const { data, error } = await supabase
        .from('twitter_bookmarks')
        .insert(supabaseBookmark)
        .select('id');

      if (error) throw error;
      
      // If bookmark has highlights, migrate them
      if (bookmark.highlights && bookmark.highlights.length > 0) {
        await migrateHighlights(bookmark.highlights, data[0].id, userId);
      }

      results.succeeded++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        bookmark: bookmark.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return results;
}

/**
 * Migrate highlights to Supabase
 * @param highlights Array of highlight objects
 * @param bookmarkId The Supabase bookmark ID
 * @param userId The authenticated user's ID
 */
async function migrateHighlights(
  highlights: { text: string; color: string; timestamp: string }[],
  bookmarkId: string,
  userId: string
) {
  for (const highlight of highlights) {
    await supabase.from('highlights').insert({
      bookmark_id: bookmarkId,
      text: highlight.text,
      color: highlight.color,
      timestamp: highlight.timestamp,
      user_id: userId
    });
  }
}

/**
 * Migrate tags to Supabase
 * @param localData The BookmarkStore data
 * @param userId The authenticated user's ID
 * @returns Promise with migration results
 */
async function migrateTags(localData: BookmarkStore, userId: string) {
  const results = {
    tagGroups: 0,
    tags: 0,
    bookmarkTags: 0,
    errors: [] as any[]
  };

  try {
    // Extract all unique tags from bookmarks
    const allTags = new Set<string>();
    localData.bookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        bookmark.tags.forEach(tag => allTags.add(tag));
      }
      if (bookmark.aiTags) {
        bookmark.aiTags.forEach(tag => allTags.add(tag));
      }
    });

    // Process tag groups if they exist
    if (localData.tagGroups) {
      for (const [groupName, groupData] of Object.entries(localData.tagGroups)) {
        // Insert each tag in the group
        for (const tag of groupData.tags) {
          const { error } = await supabase.from('tags').insert({
            name: tag,
            color: groupData.color,
            icon: groupData.icon,
            description: `From group: ${groupName}`,
            is_ai_generated: groupData.isAIGenerated || false,
            user_id: userId
          });

          if (error) {
            results.errors.push({
              tag,
              error: error.message
            });
          } else {
            results.tags++;
          }
        }
        results.tagGroups++;
      }
    }

    // Insert any remaining tags not in groups
    for (const tag of allTags) {
      // Check if tag already exists (might have been added from a group)
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tag)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingTag) {
        const { error } = await supabase.from('tags').insert({
          name: tag,
          user_id: userId,
          is_ai_generated: false
        });

        if (error) {
          results.errors.push({
            tag,
            error: error.message
          });
        } else {
          results.tags++;
        }
      }
    }

    // Associate tags with bookmarks
    for (const bookmark of localData.bookmarks) {
      if (!bookmark.tags && !bookmark.aiTags) continue;

      // Get the Supabase bookmark ID
      const { data: bookmarkData } = await supabase
        .from('twitter_bookmarks')
        .select('id')
        .eq('tweet_id', bookmark.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!bookmarkData) continue;

      const allBookmarkTags = [
        ...(bookmark.tags || []),
        ...(bookmark.aiTags || [])
      ];

      for (const tagName of allBookmarkTags) {
        // Get tag ID
        const { data: tagData } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', userId)
          .maybeSingle();

        if (tagData) {
          // Associate tag with bookmark
          const { error } = await supabase.from('bookmark_tags').insert({
            bookmark_id: bookmarkData.id,
            tag_id: tagData.id
          });

          if (!error) {
            results.bookmarkTags++;
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error migrating tags:', error);
    results.errors.push({
      general: error instanceof Error ? error.message : String(error)
    });
    return results;
  }
}

/**
 * Migrate collections to Supabase
 * @param localData The BookmarkStore data
 * @param userId The authenticated user's ID
 * @returns Promise with migration results
 */
async function migrateCollections(localData: BookmarkStore, userId: string) {
  const results = {
    collections: 0,
    nestedCollections: 0,
    bookmarkAssociations: 0,
    errors: [] as any[]
  };

  try {
    // Migrate flat collections
    if (localData.collections) {
      for (const [collectionName, bookmarkIds] of Object.entries(localData.collections)) {
        // Create collection
        const { data: collectionData, error } = await supabase
          .from('collections')
          .insert({
            name: collectionName,
            user_id: userId
          })
          .select('id');

        if (error) {
          results.errors.push({
            collection: collectionName,
            error: error.message
          });
          continue;
        }

        results.collections++;
        const collectionId = collectionData[0].id;

        // Associate bookmarks with collection
        for (const bookmarkId of bookmarkIds) {
          // Get Supabase bookmark ID
          const { data: bookmarkData } = await supabase
            .from('twitter_bookmarks')
            .select('id')
            .eq('tweet_id', bookmarkId)
            .eq('user_id', userId)
            .maybeSingle();

          if (bookmarkData) {
            const { error: assocError } = await supabase
              .from('collection_bookmarks')
              .insert({
                collection_id: collectionId,
                bookmark_id: bookmarkData.id
              });

            if (!assocError) {
              results.bookmarkAssociations++;
            }
          }
        }
      }
    }

    // Migrate nested collections
    if (localData.nestedCollections) {
      // First pass: create all collections
      const collectionMap = new Map<string, string>(); // Map old ID to new ID

      for (const [oldId, collection] of Object.entries(localData.nestedCollections)) {
        const { data: collectionData, error } = await supabase
          .from('collections')
          .insert({
            name: oldId, // Use the ID as name if no better name is available
            icon: collection.icon,
            color: collection.color,
            order_position: collection.order,
            description: collection.description,
            is_private: collection.isPrivate || false,
            user_id: userId
          })
          .select('id');

        if (error) {
          results.errors.push({
            collection: oldId,
            error: error.message
          });
          continue;
        }

        collectionMap.set(oldId, collectionData[0].id);
        results.nestedCollections++;
      }

      // Second pass: update parent relationships
      for (const [oldId, collection] of Object.entries(localData.nestedCollections)) {
        if (collection.parentId && collectionMap.has(collection.parentId)) {
          const newId = collectionMap.get(oldId);
          const newParentId = collectionMap.get(collection.parentId);

          if (newId && newParentId) {
            await supabase
              .from('collections')
              .update({ parent_id: newParentId })
              .eq('id', newId);
          }
        }

        // Associate bookmarks with collection
        if (collection.bookmarks && collection.bookmarks.length > 0) {
          const newCollectionId = collectionMap.get(oldId);
          if (!newCollectionId) continue;

          for (const bookmarkId of collection.bookmarks) {
            // Get Supabase bookmark ID
            const { data: bookmarkData } = await supabase
              .from('twitter_bookmarks')
              .select('id')
              .eq('tweet_id', bookmarkId)
              .eq('user_id', userId)
              .maybeSingle();

            if (bookmarkData) {
              const { error: assocError } = await supabase
                .from('collection_bookmarks')
                .insert({
                  collection_id: newCollectionId,
                  bookmark_id: bookmarkData.id
                });

              if (!assocError) {
                results.bookmarkAssociations++;
              }
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error migrating collections:', error);
    results.errors.push({
      general: error instanceof Error ? error.message : String(error)
    });
    return results;
  }
}

/**
 * Migrate reading queue to Supabase
 * @param localData The BookmarkStore data
 * @param userId The authenticated user's ID
 * @returns Promise with migration results
 */
async function migrateReadingQueue(localData: BookmarkStore, userId: string) {
  const results = {
    queueItems: 0,
    favorites: 0,
    history: 0,
    errors: [] as any[]
  };

  try {
    if (!localData.readingQueue) return results;

    // Migrate unread, reading, and completed queues
    const queueTypes = ['unread', 'reading', 'completed'] as const;
    for (const queueType of queueTypes) {
      const bookmarkIds = localData.readingQueue[queueType] || [];
      
      for (const bookmarkId of bookmarkIds) {
        // Get Supabase bookmark ID
        const { data: bookmarkData } = await supabase
          .from('twitter_bookmarks')
          .select('id')
          .eq('tweet_id', bookmarkId)
          .eq('user_id', userId)
          .maybeSingle();

        if (bookmarkData) {
          const { error } = await supabase
            .from('reading_queue')
            .insert({
              bookmark_id: bookmarkData.id,
              status: queueType,
              user_id: userId
            });

          if (!error) {
            results.queueItems++;
          } else {
            results.errors.push({
              bookmark: bookmarkId,
              queue: queueType,
              error: error.message
            });
          }
        }
      }
    }

    // Migrate favorites
    if (localData.readingQueue.favorites) {
      for (const [category, favoriteData] of Object.entries(localData.readingQueue.favorites)) {
        for (const bookmarkId of favoriteData.bookmarks) {
          // Get Supabase bookmark ID
          const { data: bookmarkData } = await supabase
            .from('twitter_bookmarks')
            .select('id')
            .eq('tweet_id', bookmarkId)
            .eq('user_id', userId)
            .maybeSingle();

          if (bookmarkData) {
            const { error } = await supabase
              .from('reading_queue')
              .insert({
                bookmark_id: bookmarkData.id,
                is_favorite: true,
                favorite_category: category,
                user_id: userId
              });

            if (!error) {
              results.favorites++;
            } else {
              results.errors.push({
                bookmark: bookmarkId,
                favorite: category,
                error: error.message
              });
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error migrating reading queue:', error);
    results.errors.push({
      general: error instanceof Error ? error.message : String(error)
    });
    return results;
  }
}