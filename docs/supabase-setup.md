# Supabase Setup for Twisdom

This document provides comprehensive information about the local Supabase setup for the Twisdom project.

## Overview

Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, instant APIs, real-time subscriptions, and storage. It addresses several limitations identified in the Twisdom project documentation:

- Backend integration for data persistence
- User authentication and multi-device sync
- Improved security for API key handling
- Storage beyond localStorage limits

## Connection Details

| Service | URL/Endpoint |
|---------|-------------|
| API URL | http://127.0.0.1:54321 |
| GraphQL URL | http://127.0.0.1:54321/graphql/v1 |
| S3 Storage URL | http://127.0.0.1:54321/storage/v1/s3 |
| Database URL | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio URL | http://127.0.0.1:54323 |
| Inbucket URL | http://127.0.0.1:54324 |

## Authentication Information

| Credential | Environment Variable | Default Value for Local Development |
|------------|---------------------|-----------------------------------|
| JWT Secret | N/A (server-side only) | super-secret-jwt-token-with-at-least-32-characters-long |
| Anon Key | VITE_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 |
| Service Role Key | VITE_SUPABASE_SERVICE_ROLE_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU |

## Storage Information

| Credential | Environment Variable | Default Value for Local Development |
|------------|---------------------|-----------------------------------|
| S3 Access Key | VITE_S3_ACCESS_KEY | 625729a08b95bf1b7ff351a663f3a23c |
| S3 Secret Key | VITE_S3_SECRET_KEY | 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907 |
| S3 Region | VITE_S3_REGION | local |

## Database Access

### Direct PostgreSQL Connection

You can connect directly to the PostgreSQL database using any PostgreSQL client with these credentials:

- Host: 127.0.0.1
- Port: 54322
- Database: postgres
- Username: postgres
- Password: postgres

Example connection string:
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Command Line Access

To access the database via command line:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Supabase Studio

Supabase Studio is a web-based admin interface for managing your Supabase project. Access it at:

```
http://127.0.0.1:54323
```

The Studio provides:
- Table editor
- SQL editor
- API documentation
- Authentication management
- Storage management
- Database backups

## Integration with Twisdom

### Installing Supabase Client

Add the Supabase client to the Twisdom project:

```bash
npm install @supabase/supabase-js
```

### Environment Variables Setup

Create a `.env` file in the project root with the following variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenAI Configuration
VITE_OPENAI_API_KEY=your-openai-api-key

# S3 Storage Configuration (if needed)
VITE_S3_ACCESS_KEY=625729a08b95bf1b7ff351a663f3a23c
VITE_S3_SECRET_KEY=850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
VITE_S3_REGION=local
```

A `.env.example` file has been created as a template. Copy this file to `.env` and update the values as needed.

### Client Initialization

Create a Supabase client in your project using environment variables:

```typescript
import { createClient } from '@supabase/supabase-js';

// Get Supabase connection details from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

This approach ensures that sensitive information is not hardcoded in the source code and can be easily changed between environments.

### Database Schema for Twisdom

Based on the Twisdom data models, here's a recommended database schema:

#### Twitter Bookmarks Table

```sql
CREATE TABLE twitter_bookmarks (
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
```

#### Tags Table

```sql
CREATE TABLE tags (
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
```

#### Bookmark Tags Junction Table

```sql
CREATE TABLE bookmark_tags (
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);
```

#### Collections Table

```sql
CREATE TABLE collections (
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
```

#### Collection Bookmarks Junction Table

```sql
CREATE TABLE collection_bookmarks (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, bookmark_id)
);
```

#### Highlights Table

```sql
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  color TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

#### Reading Queue Table

```sql
CREATE TABLE reading_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID REFERENCES twitter_bookmarks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'unread',
  is_favorite BOOLEAN DEFAULT FALSE,
  favorite_category TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security Policies

To secure your data, implement Row Level Security (RLS) policies:

```sql
-- Enable RLS on all tables
ALTER TABLE twitter_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_queue ENABLE ROW LEVEL SECURITY;

-- Create policies that only allow users to see their own data
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

-- Similar policies should be created for all tables
```

## Managing Supabase Locally

### Starting Supabase

```bash
cd supabase
supabase start
```

### Stopping Supabase

```bash
cd supabase
supabase stop
```

### Resetting Supabase

To reset the database to its initial state:

```bash
cd supabase
supabase db reset
```

### Applying Migrations

Twisdom now includes a dedicated script for applying database migrations. This script will:
1. Check if Supabase is running, and start it if necessary
2. Apply all migrations in order
3. Reset the database (warning: this will delete all data)

To apply migrations using the script:

```bash
./scripts/apply-migrations.sh
```

#### Migration Files

The migration files are located in the `supabase/migrations` directory:

- `20250304_initial_schema.sql`: Initial schema with tables for bookmarks, tags, collections, etc.
- `20250305_add_ai_columns.sql`: Adds columns for AI analysis data, suggested tags, and extracted links.

#### Manual Migration

If you prefer to apply migrations manually:

```bash
# Navigate to the supabase directory
cd supabase 

# Reset the database and apply migrations
supabase db reset
```
This will apply all migrations in the `supabase/migrations` directory in alphabetical order.

## Migrating from localStorage

To migrate data from localStorage to Supabase:

1. Create a migration script that:
   - Reads data from localStorage
   - Transforms it to match the Supabase schema
   - Inserts it into the appropriate Supabase tables
   - Handles user authentication and associates data with the correct user

2. Update application code to use Supabase instead of localStorage:
   - Replace localStorage read/write operations with Supabase queries
   - Implement authentication flow
   - Update UI to reflect new data structure

## Security Considerations

1. **API Keys**: The anon and service role keys should be treated as sensitive. In production:
   - Use environment variables to store keys (as implemented)
   - Never expose the service role key to the client
   - Consider using server-side functions for sensitive operations

2. **JWT Secret**: In production, use a strong, unique JWT secret.

3. **Database Credentials**: Change the default database password in production.

4. **Environment Variables**: 
   - Never commit `.env` files to version control
   - Use `.env.example` as a template without real values
   - Consider using a secrets management service for production

## Next Steps

1. Create the database schema in Supabase Studio
2. Implement authentication in the Twisdom application
3. Migrate existing data from localStorage to Supabase ✅
4. Update the application to use Supabase for data persistence ✅
5. Implement multi-device synchronization ✅