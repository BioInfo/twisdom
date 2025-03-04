-- Initial schema for Twisdom Supabase database
-- This script creates all the tables and relationships needed for the Twisdom application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Twitter Bookmarks Table
CREATE TABLE IF NOT EXISTS twitter_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tweet_id TEXT NOT NULL,
  tweet_date TIMESTAMP WITH TIME ZONE,
  posted_by TEXT NOT NULL,
  posted_by_profile_pic TEXT,
  posted_by_profile_url TEXT,
  posted_by_handle TEXT,
  tweet_url TEXT NOT NULL,
  content TEXT,
  comments TEXT,
  media TEXT,
  sentiment TEXT,
  summary TEXT,
  ai_tags TEXT[],
  suggested_tags TEXT[],
  extracted_links JSONB,
  ai_analysis JSONB,
  reading_status TEXT DEFAULT 'unread',
  priority TEXT DEFAULT 'medium',
  reading_time INTEGER,
  last_read_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for tweet_id and user_id
ALTER TABLE twitter_bookmarks ADD CONSTRAINT unique_tweet_user UNIQUE (tweet_id, user_id);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  description TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmark Tags Junction Table
CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);

-- Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES collections(id),
  icon TEXT,
  color TEXT,
  order_position INTEGER,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Bookmarks Junction Table
CREATE TABLE IF NOT EXISTS collection_bookmarks (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, bookmark_id)
);

-- Highlights Table
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  color TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Reading Queue Table
CREATE TABLE IF NOT EXISTS reading_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unread',
  is_favorite BOOLEAN DEFAULT FALSE,
  favorite_category TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE twitter_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for twitter_bookmarks
CREATE POLICY "Users can only view their own bookmarks" 
ON twitter_bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own bookmarks" 
ON twitter_bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own bookmarks" 
ON twitter_bookmarks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own bookmarks" 
ON twitter_bookmarks FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for tags
CREATE POLICY "Users can only view their own tags" 
ON tags FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own tags" 
ON tags FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own tags" 
ON tags FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own tags" 
ON tags FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for bookmark_tags
CREATE POLICY "Users can only view their own bookmark tags" 
ON bookmark_tags FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM twitter_bookmarks
    WHERE twitter_bookmarks.id = bookmark_tags.bookmark_id
    AND twitter_bookmarks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can only insert their own bookmark tags" 
ON bookmark_tags FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM twitter_bookmarks
    WHERE twitter_bookmarks.id = bookmark_tags.bookmark_id
    AND twitter_bookmarks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can only delete their own bookmark tags" 
ON bookmark_tags FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM twitter_bookmarks
    WHERE twitter_bookmarks.id = bookmark_tags.bookmark_id
    AND twitter_bookmarks.user_id = auth.uid()
  )
);

-- Create RLS policies for collections
CREATE POLICY "Users can only view their own collections" 
ON collections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own collections" 
ON collections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own collections" 
ON collections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own collections" 
ON collections FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for collection_bookmarks
CREATE POLICY "Users can only view their own collection bookmarks" 
ON collection_bookmarks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_bookmarks.collection_id
    AND collections.user_id = auth.uid()
  )
);

CREATE POLICY "Users can only insert their own collection bookmarks" 
ON collection_bookmarks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_bookmarks.collection_id
    AND collections.user_id = auth.uid()
  )
);

CREATE POLICY "Users can only delete their own collection bookmarks" 
ON collection_bookmarks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_bookmarks.collection_id
    AND collections.user_id = auth.uid()
  )
);

-- Create RLS policies for highlights
CREATE POLICY "Users can only view their own highlights" 
ON highlights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own highlights" 
ON highlights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own highlights" 
ON highlights FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own highlights" 
ON highlights FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for reading_queue
CREATE POLICY "Users can only view their own reading queue" 
ON reading_queue FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert into their own reading queue" 
ON reading_queue FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own reading queue" 
ON reading_queue FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete from their own reading queue" 
ON reading_queue FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_twitter_bookmarks_user_id ON twitter_bookmarks(user_id);
CREATE INDEX idx_twitter_bookmarks_reading_status ON twitter_bookmarks(reading_status);
CREATE INDEX idx_twitter_bookmarks_priority ON twitter_bookmarks(priority);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_parent_id ON collections(parent_id);
CREATE INDEX idx_highlights_bookmark_id ON highlights(bookmark_id);
CREATE INDEX idx_reading_queue_user_id ON reading_queue(user_id);
CREATE INDEX idx_reading_queue_status ON reading_queue(status);
CREATE INDEX idx_twitter_bookmarks_ai_tags ON twitter_bookmarks USING GIN(ai_tags);
CREATE INDEX idx_twitter_bookmarks_suggested_tags ON twitter_bookmarks USING GIN(suggested_tags);