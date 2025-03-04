-- Add new columns to twitter_bookmarks table for AI analysis data
ALTER TABLE twitter_bookmarks ADD COLUMN IF NOT EXISTS ai_tags TEXT[];
ALTER TABLE twitter_bookmarks ADD COLUMN IF NOT EXISTS suggested_tags TEXT[];
ALTER TABLE twitter_bookmarks ADD COLUMN IF NOT EXISTS extracted_links JSONB;
ALTER TABLE twitter_bookmarks ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Add column for storing when a bookmark was added to the reading queue
ALTER TABLE reading_queue ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_twitter_bookmarks_ai_tags ON twitter_bookmarks USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_twitter_bookmarks_suggested_tags ON twitter_bookmarks USING GIN(suggested_tags);