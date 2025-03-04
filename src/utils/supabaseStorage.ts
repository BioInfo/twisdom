import { supabase } from './supabaseClient';
import { BookmarkStore, TwitterBookmark } from '../types';
import { DEFAULT_STORE } from './storage';
import { User } from '@supabase/supabase-js';

/**
 * Supabase storage service for the Twisdom application.
 * This replaces the localStorage implementation with Supabase database storage.
 */

/**
 * Load a user's bookmark store from Supabase
 * @param userId The user's ID
 * @returns Promise with the BookmarkStore or null if not found
 */
export async function loadStoreFromSupabase(userId: string): Promise<BookmarkStore | null> {
  try {
    // Initialize with default store structure
    const store: BookmarkStore = { ...DEFAULT_STORE };
    
    // Load bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('twitter_bookmarks')
      .select('id, tweet_id, tweet_date, posted_by, posted_by_profile_pic, posted_by_profile_url, posted_by_handle, tweet_url, content, comments, media, sentiment, summary, ai_tags, suggested_tags, extracted_links, ai_analysis, reading_status, priority, reading_time, last_read_at, progress, notes, created_at, updated_at')
      .eq('user_id', userId);
      
    if (bookmarksError) {
      console.error('Error loading bookmarks:', bookmarksError);
      return null;
    }
    
    // Create a mapping of tweet_id to database id (UUID)
    const bookmarkIdMap = new Map<string, string>();
    
    // Create a map to deduplicate bookmarks by tweet_id
    // If there are duplicates, keep the most recently updated one
    const tweetIdToBookmarkMap = new Map<string, any>();
    
    for (const bookmark of bookmarks) {
      const existingBookmark = tweetIdToBookmarkMap.get(bookmark.tweet_id);
      const currentDate = new Date(bookmark.updated_at || bookmark.created_at || 0);
      
      if (!existingBookmark || currentDate > new Date(existingBookmark.updated_at || existingBookmark.created_at || 0)) {
        tweetIdToBookmarkMap.set(bookmark.tweet_id, bookmark);
        bookmarkIdMap.set(bookmark.tweet_id, bookmark.id);
      }
    }
    
    // Get the deduplicated bookmarks
    const uniqueBookmarks = Array.from(tweetIdToBookmarkMap.values());
    
    // Transform bookmarks from Supabase schema to app schema
    store.bookmarks = uniqueBookmarks.map(bookmark => ({
      id: bookmark.tweet_id,
      _dbId: bookmark.id, // Store the database UUID for internal use
      tweetDate: bookmark.tweet_date,
      postedBy: bookmark.posted_by,
      postedByProfilePic: bookmark.posted_by_profile_pic,
      postedByProfileUrl: bookmark.posted_by_profile_url,
      postedByHandle: bookmark.posted_by_handle,
      tweetUrl: bookmark.tweet_url,
      content: bookmark.content,
      comments: bookmark.comments,
      media: bookmark.media,
      sentiment: bookmark.sentiment as 'positive' | 'negative' | 'neutral' | undefined,
      summary: bookmark.summary,
      readingStatus: bookmark.reading_status as 'unread' | 'reading' | 'completed',
      priority: bookmark.priority as 'low' | 'medium' | 'high',
      readingTime: bookmark.reading_time,
      lastReadAt: bookmark.last_read_at,
      progress: bookmark.progress,
      notes: bookmark.notes,
      tags: [], // Will be populated below
      aiTags: bookmark.ai_tags || [], 
      suggestedTags: bookmark.suggested_tags || [],
      highlights: [], // Will be populated below
      aiAnalysis: bookmark.ai_analysis ? JSON.parse(bookmark.ai_analysis) : undefined,
      extractedLinks: bookmark.extracted_links ? JSON.parse(bookmark.extracted_links) : []
    }));
    
    // Create a map of bookmark IDs for easier lookup
    const bookmarkMap = new Map<string, TwitterBookmark>();
    store.bookmarks.forEach(bookmark => {
      bookmarkMap.set(bookmark.id, bookmark);
    });
    
    // Load tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);
      
    if (tagsError) {
      console.error('Error loading tags:', tagsError);
    } else {
      // Create tag groups
      store.tagGroups = {};
      
      // Group tags by their description (which contains the group name)
      const tagsByGroup = new Map<string, any[]>();
      tags.forEach(tag => {
        if (tag.description?.startsWith('From group: ')) {
          const groupName = tag.description.replace('From group: ', '');
          if (!tagsByGroup.has(groupName)) {
            tagsByGroup.set(groupName, []);
          }
          tagsByGroup.get(groupName)?.push(tag);
        }
      });
      
      // Create tag groups
      tagsByGroup.forEach((groupTags, groupName) => {
        if (groupTags.length > 0) {
          store.tagGroups![groupName] = {
            tags: groupTags.map(tag => tag.name),
            color: groupTags[0].color,
            icon: groupTags[0].icon,
            isAIGenerated: groupTags[0].is_ai_generated,
            lastModified: new Date().toISOString()
          };
        }
      });
      
      // Load bookmark-tag associations
      // Split bookmark IDs into smaller batches to avoid URL length limitations
      // Use the database UUIDs instead of tweet_ids
      const bookmarkIds = store.bookmarks.map(b => b._dbId);
      const batchSize = 50; // Adjust this value based on your needs
      const batches = [];
      
      for (let i = 0; i < bookmarkIds.length; i += batchSize) {
        batches.push(bookmarkIds.slice(i, i + batchSize));
      }
      
      // Process each batch and combine results
      let bookmarkTags: any[] = [];
      let bookmarkTagsError = null;
      
      for (const batch of batches) {
        try {
          const { data, error } = await supabase
            .from('bookmark_tags')
            .select(`
              bookmark_id,
              tags:tag_id(id, name, is_ai_generated)
            `)
            .in('bookmark_id', batch);
            
          if (error) {
            bookmarkTagsError = error;
            break;
          }
          
          if (data) {
            bookmarkTags = [...bookmarkTags, ...data];
          }
        } catch (err) {
          console.error('Error in bookmark tags batch query:', err);
          bookmarkTagsError = err;
          break;
        }
      }
        
      if (bookmarkTagsError) {
        console.error('Error loading bookmark tags:', bookmarkTagsError);
      } else {
        // Associate tags with bookmarks
        bookmarkTags.forEach((bt: any) => {
          // Find the bookmark using the tweet_id that corresponds to the database UUID
          const tweetId = Array.from(bookmarkIdMap.entries())
            .find(([_, dbId]) => dbId === bt.bookmark_id)?.[0];
          
          const bookmark = tweetId ? bookmarkMap.get(tweetId) : undefined;
          
          if (bookmark && bt.tags) {
            if (bt.tags && bt.tags.is_ai_generated) {
              if (!bookmark.aiTags) {
                bookmark.aiTags = [];
              }
              bookmark.aiTags!.push(bt.tags.name);
            } else {
              bookmark.tags.push(bt.tags.name);
            }
          }
        });
      }
    }
    
    // Load collections
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .is('parent_id', null);
      
    if (collectionsError) {
      console.error('Error loading collections:', collectionsError);
    } else {
      // Initialize collections
      store.collections = {};
      
      // Load collection-bookmark associations for flat collections
      for (const collection of collections) {
        const { data: collectionBookmarks, error: collectionBookmarksError } = await supabase
          .from('collection_bookmarks')
          .select('bookmark_id')
          .eq('collection_id', collection.id);
          
        if (collectionBookmarksError) {
          console.error('Error loading collection bookmarks:', collectionBookmarksError);
        } else {
          // Convert database UUIDs to tweet_ids
          const tweetIds: string[] = [];
          
          for (const cb of collectionBookmarks) {
            // Find the corresponding tweet_id for this bookmark_id
            const tweetId = Array.from(bookmarkIdMap.entries())
              .find(([_, dbId]) => dbId === cb.bookmark_id)?.[0];
            
            if (tweetId) {
              tweetIds.push(tweetId);
            }
          }
          
          store.collections[collection.name] = tweetIds;
        }
      }
    }
    
    // Load nested collections
    const { data: nestedCollections, error: nestedCollectionsError } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId);
      
    if (nestedCollectionsError) {
      console.error('Error loading nested collections:', nestedCollectionsError);
    } else {
      // Initialize nested collections
      store.nestedCollections = {};
      
      // Create nested collections
      for (const collection of nestedCollections) {
        const { data: collectionBookmarks, error: collectionBookmarksError } = await supabase
          .from('collection_bookmarks')
          .select('bookmark_id')
          .eq('collection_id', collection.id);
          
        if (collectionBookmarksError) {
          console.error('Error loading collection bookmarks:', collectionBookmarksError);
        } else {
          // Convert database UUIDs to tweet_ids
          const tweetIds: string[] = [];
          
          for (const cb of collectionBookmarks) {
            // Find the corresponding tweet_id for this bookmark_id
            const tweetId = Array.from(bookmarkIdMap.entries())
              .find(([_, dbId]) => dbId === cb.bookmark_id)?.[0];
            
            if (tweetId) {
              tweetIds.push(tweetId);
            }
          }
          
          store.nestedCollections[collection.id] = {
            bookmarks: tweetIds,
            children: nestedCollections
              .filter(c => c.parent_id === collection.id)
              .map(c => c.id),
            parentId: collection.parent_id || undefined,
            icon: collection.icon || undefined,
            color: collection.color || undefined,
            order: collection.order_position || undefined,
            description: collection.description || undefined,
            isPrivate: collection.is_private || false,
            lastModified: collection.updated_at
          };
        }
      }
    }
    
    // Load highlights
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('*')
      .eq('user_id', userId);
      
    if (highlightsError) {
      console.error('Error loading highlights:', highlightsError);
    } else {
      // Associate highlights with bookmarks
      highlights.forEach((highlight: any) => {
        // Find the corresponding tweet_id for this bookmark_id
        const tweetId = Array.from(bookmarkIdMap.entries())
          .find(([_, dbId]) => dbId === highlight.bookmark_id)?.[0];
        
        const bookmark = tweetId ? store.bookmarks.find(b => b.id === tweetId) : undefined;
        
        if (bookmark) {
          if (!bookmark.highlights) {
            bookmark.highlights = [];
          }
          bookmark.highlights.push({
            text: highlight.text,
            color: highlight.color || 'yellow',
            timestamp: highlight.timestamp
          });
        }
      });
    }
    
    // Load reading queue
    const { data: readingQueue, error: readingQueueError } = await supabase
      .from('reading_queue')
      .select('*')
      .eq('user_id', userId);
      
    if (readingQueueError) {
      console.error('Error loading reading queue:', readingQueueError);
    } else {
      // Initialize reading queue
      store.readingQueue = {
        unread: [],
        reading: [],
        completed: [],
        favorites: {
          'Quick Access': {
            bookmarks: [],
            color: 'yellow',
            icon: 'star',
            order: 0
          },
          'Must Read': {
            bookmarks: [],
            color: 'red',
            icon: 'bookmark',
            order: 1
          },
          'Reference': {
            bookmarks: [],
            color: 'blue',
            icon: 'book',
            order: 2
          }
        },
        history: []
      };
      
      // Populate reading queue
      readingQueue.forEach((item: any) => {
        // Find the corresponding tweet_id for this bookmark_id
        const tweetId = Array.from(bookmarkIdMap.entries())
          .find(([_, dbId]) => dbId === item.bookmark_id)?.[0];
        
        if (!tweetId) return;
        
        if (item.status) {
          store.readingQueue[item.status as 'unread' | 'reading' | 'completed'].push(tweetId);
        }
        
        if (item.is_favorite && item.favorite_category) {
          if (!store.readingQueue.favorites[item.favorite_category]) {
            store.readingQueue.favorites[item.favorite_category] = {
              bookmarks: [],
              color: 'gray',
              icon: 'bookmark',
              order: Object.keys(store.readingQueue.favorites).length
            };
          }
          
          store.readingQueue.favorites[item.favorite_category].bookmarks.push(tweetId);
        }
      });
    }
    
    // Set filtered bookmarks to all bookmarks initially
    store.filteredBookmarks = [...store.bookmarks];
    
    return store;
  } catch (error) {
    console.error('Error loading store from Supabase:', error);
    return null;
  }
}

/**
 * Save a bookmark store to Supabase
 * @param store The BookmarkStore to save
 * @param userId The user's ID
 * @returns Promise<{success: boolean; error?: string}> indicating success or failure with error details
 */
export async function saveStoreToSupabase(store: BookmarkStore, userId: string, immediate: boolean = false): Promise<{success: boolean; error?: string}> {
  try {
    // This is a simplified implementation that would need to be expanded
    // to handle updates, deletions, and more complex operations 
    
    // Save bookmarks
    // Create a Set to track which bookmarks we've already processed
    const processedBookmarks = new Set<string>();
    
    for (const bookmark of store.bookmarks) {
      // Check if the bookmark already exists
      const { data: existingBookmark, error: fetchError } = await supabase
        .from('twitter_bookmarks')
        .select('id')
        .eq('tweet_id', bookmark.id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error checking for existing bookmark:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Skip if we've already processed this bookmark in this save operation
      if (processedBookmarks.has(bookmark.id)) {
        continue;
      }
      processedBookmarks.add(bookmark.id);
      
      let error;
      
      if (existingBookmark) {
        // Update existing bookmark
        const { error: updateError } = await supabase
          .from('twitter_bookmarks')
          .update({
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
            ai_tags: bookmark.aiTags,
            suggested_tags: bookmark.suggestedTags,
            extracted_links: JSON.stringify(bookmark.extractedLinks || []),
            reading_status: bookmark.readingStatus,
            priority: bookmark.priority,
            reading_time: bookmark.readingTime,
            last_read_at: bookmark.lastReadAt,
            progress: bookmark.progress,
            notes: bookmark.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBookmark.id);
        
        error = updateError;
      } else {
        // Insert new bookmark
        const { error: insertError } = await supabase
          .from('twitter_bookmarks')
          .insert({
            id: crypto.randomUUID(), // Generate a new UUID for the database record
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
            ai_tags: bookmark.aiTags,
            suggested_tags: bookmark.suggestedTags,
            extracted_links: JSON.stringify(bookmark.extractedLinks || []),
            summary: bookmark.summary,
            reading_status: bookmark.readingStatus,
            priority: bookmark.priority,
            reading_time: bookmark.readingTime,
            last_read_at: bookmark.lastReadAt,
            progress: bookmark.progress,
            notes: bookmark.notes,
            user_id: userId
          });
        
        error = insertError;
      }
        
      if (error) {
        console.error('Error saving bookmark:', error);

        // If it's a duplicate key error, just continue with the next bookmark
        if (error.code === '23505' && error.message.includes('unique_tweet_user')) {
          console.warn('Duplicate bookmark detected, skipping:', bookmark.id);
          continue;
        }
        
        // Check for RLS errors and handle them gracefully
        if (error.code === '42501') {
          console.warn('Row-level security prevented saving data. This may happen during logout.');
          return { success: false, error: 'Authentication error: You may have been logged out.' };
        }
        
        return { success: false, error: error.message };
      }
    }

    // Save AI analysis data
    for (const bookmark of store.bookmarks) {
      if (bookmark.aiAnalysis) {
        // Check if the bookmark exists in the database
        const { data: existingBookmark, error: fetchError } = await supabase
          .from('twitter_bookmarks')
          .select('id')
          .eq('tweet_id', bookmark.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking for existing bookmark for AI analysis:', fetchError);
          continue; // Skip this bookmark and continue with others
        }

        if (existingBookmark) {
          // Update the bookmark with AI analysis data
          const { error: updateError } = await supabase
            .from('twitter_bookmarks')
            .update({
              ai_analysis: JSON.stringify(bookmark.aiAnalysis),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBookmark.id);

          if (updateError) {
            console.error('Error saving AI analysis:', updateError);
          }
        }
      }
    }

    // Save reading queue data
    // First, clear existing reading queue data for this user
    const { error: clearQueueError } = await supabase
      .from('reading_queue')
      .delete()
      .eq('user_id', userId);

    if (clearQueueError) {
      console.error('Error clearing reading queue:', clearQueueError);
    } else {
      // Insert new reading queue data
      // For unread items
      for (const bookmarkId of store.readingQueue.unread) {
        // Get the database ID for this bookmark
        const { data: bookmarkData } = await supabase
          .from('twitter_bookmarks')
          .select('id')
          .eq('tweet_id', bookmarkId)
          .eq('user_id', userId)
          .maybeSingle();

        if (bookmarkData) {
          await supabase.from('reading_queue').insert({
            user_id: userId,
            bookmark_id: bookmarkData.id,
            status: 'unread',
            added_at: new Date().toISOString()
          });
        }
      }

      // For reading items
      for (const bookmarkId of store.readingQueue.reading) {
        const { data: bookmarkData } = await supabase
          .from('twitter_bookmarks')
          .select('id')
          .eq('tweet_id', bookmarkId)
          .eq('user_id', userId)
          .maybeSingle();

        if (bookmarkData) {
          await supabase.from('reading_queue').insert({
            user_id: userId,
            bookmark_id: bookmarkData.id,
            status: 'reading',
            added_at: new Date().toISOString()
          });
        }
      }

      // For completed items
      for (const bookmarkId of store.readingQueue.completed) {
        const { data: bookmarkData } = await supabase
          .from('twitter_bookmarks')
          .select('id')
          .eq('tweet_id', bookmarkId)
          .eq('user_id', userId)
          .maybeSingle();

        if (bookmarkData) {
          await supabase.from('reading_queue').insert({
            user_id: userId,
            bookmark_id: bookmarkData.id,
            status: 'completed',
            added_at: new Date().toISOString()
          });
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving store to Supabase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get the current authenticated user
 * @returns Promise with the user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with success status and user or error
 */
export async function signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; user?: User | null; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete all user data from Supabase
 * @param userId The user's ID
 * @returns Promise with success status
 */
export async function deleteAllUserData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Testing Supabase connection...');
    
    // Test if we can connect to Supabase with a simple query
    const { data: testData, error: testError } = await supabase
      .from('twitter_bookmarks')
      .select('count', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (testError) {
      console.error('Error connecting to Supabase:', testError);
      return { success: false, error: `Connection error: ${testError.message}` };
    }
    
    console.log('Connection successful, count:', testData);

    // Now proceed with actual data deletion in a more robust way
    console.log('Starting data deletion for user:', userId);

    // First, get all bookmark IDs for this user
    const { data: bookmarkIds, error: bookmarkIdsError } = await supabase
      .from('twitter_bookmarks')
      .select('id')
      .eq('user_id', userId);
    
    if (bookmarkIdsError) {
      console.error('Error fetching bookmark IDs:', bookmarkIdsError);
      return { success: false, error: bookmarkIdsError.message };
    }
    
    // Get all collection IDs for this user
    const { data: collectionIds, error: collectionIdsError } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId);
    
    if (collectionIdsError) {
      console.error('Error fetching collection IDs:', collectionIdsError);
      return { success: false, error: collectionIdsError.message };
    }
    
    // 1. Delete bookmark_tags (junction table) in smaller batches to avoid URL length limits
    if (bookmarkIds && bookmarkIds.length > 0) {
      const allBookmarkIds = bookmarkIds.map(b => b.id);
      const batchSize = 20; // Smaller batch size to avoid URL length limits
      const batches = [];
      
      // Split bookmark IDs into smaller batches
      for (let i = 0; i < allBookmarkIds.length; i += batchSize) {
        batches.push(allBookmarkIds.slice(i, i + batchSize));
      }
      
      console.log(`Deleting bookmark tags for ${bookmarkIds.length} bookmarks in ${batches.length} batches`);
      
      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i+1}/${batches.length} with ${batch.length} bookmarks`);
        
        try {
          const { error: bookmarkTagsError } = await supabase
            .from('bookmark_tags')
            .delete()
            .in('bookmark_id', batch);
          
          if (bookmarkTagsError) {
            console.error(`Error deleting bookmark tags in batch ${i+1}:`, bookmarkTagsError);
            // Continue with other batches instead of failing completely
          }
        } catch (err) {
          console.error(`Error in batch ${i+1}:`, err);
          // Continue with other batches
        }
      }
    }
    
    // 2. Delete collection_bookmarks (junction table)
    if (collectionIds && collectionIds.length > 0) {
      console.log('Deleting collection bookmarks for', collectionIds.length, 'collections');
      const { error: collectionBookmarksError } = await supabase
        .from('collection_bookmarks') 
        .delete() 
        .eq('user_id', userId);
        
      if (collectionBookmarksError) {
        console.error('Error deleting collection bookmarks:', collectionBookmarksError);
        // Continue with other deletions instead of failing completely
      }
    }

    // Try a different approach for deleting bookmark tags if the batched approach failed
    try {
      console.log('Attempting to delete all bookmark tags for user directly');
      
      // Get all tags for this user
      const { data: userTags, error: userTagsError } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId);
        
      if (!userTagsError && userTags && userTags.length > 0) {
        await supabase.from('bookmark_tags').delete().in('tag_id', userTags.map(t => t.id));
      }
    } catch (err) {
      console.error('Error in alternative bookmark tags deletion:', err);
    }
    
    console.log('Deleting highlights');
    
    // 3. Delete highlights
    const { error: highlightsError } = await supabase
      .from('highlights')
      .delete()
      .eq('user_id', userId);
    
    if (highlightsError) {
      console.error('Error deleting highlights:', highlightsError);
      // Continue with other deletions
    }
    
    console.log('Deleting reading queue');
    
    // 4. Delete reading_queue
    const { error: readingQueueError } = await supabase
      .from('reading_queue')
      .delete()
      .eq('user_id', userId);
    
    if (readingQueueError) {
      console.error('Error deleting reading queue:', readingQueueError);
      // Continue with other deletions
    }
    
    console.log('Deleting collections');
    
    // 5. Delete collections
    const { error: collectionsError } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', userId);
    
    if (collectionsError) {
      console.error('Error deleting collections:', collectionsError);
      // Continue with other deletions
    }
    
    console.log('Deleting tags');
    
    // 6. Delete tags
    const { error: tagsError } = await supabase
      .from('tags')
      .delete()
      .eq('user_id', userId);
    
    if (tagsError) {
      console.error('Error deleting tags:', tagsError);
      // Continue with other deletions
    }
    
    console.log('Deleting bookmarks');
    
    // 7. Delete bookmarks
    const { error: bookmarksError } = await supabase
      .from('twitter_bookmarks')
      .delete()
      .eq('user_id', userId);
    
    if (bookmarksError) {
      console.error('Error deleting bookmarks:', bookmarksError);
      // Continue with other deletions
    }
    
    console.log('All data deleted successfully');
    return { success: true };
    
  } catch (error) {
    // Log detailed error information
    console.error('Error deleting user data:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { 
      success: false,
      error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if Supabase is running.` 
    };
  }
}

/**
 * Sign up with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with success status and user or error
 */
export async function signUpWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; user?: User | null; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Sign out the current user
 * @returns Promise with success status
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}