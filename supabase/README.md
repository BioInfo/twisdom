# Supabase Integration for Twisdom

This directory contains the Supabase configuration and migration files for the Twisdom project. Supabase provides a PostgreSQL database, authentication, instant APIs, real-time subscriptions, and storage.

## Quick Start

### Starting Supabase Locally

```bash
cd supabase
supabase start
```

This will start all Supabase services locally using Docker.

### Stopping Supabase

```bash
cd supabase
supabase stop
```

### Accessing Supabase Studio

Supabase Studio is available at [http://127.0.0.1:54323](http://127.0.0.1:54323) when running locally.

## Connection Details

| Service | URL/Endpoint |
|---------|-------------|
| API URL | http://127.0.0.1:54321 |
| GraphQL URL | http://127.0.0.1:54321/graphql/v1 |
| S3 Storage URL | http://127.0.0.1:54321/storage/v1/s3 |
| Database URL | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio URL | http://127.0.0.1:54323 |
| Inbucket URL | http://127.0.0.1:54324 |

## Authentication

Supabase provides built-in authentication with multiple providers. For the Twisdom project, we're using email/password authentication.

### Environment Variables

Authentication keys and other sensitive information should be stored in environment variables. The project includes a `.env.example` file that you can use as a template:

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

Copy this file to `.env` and update the values as needed. **Never commit the `.env` file to version control.**

## Database Schema

The database schema is defined in the `migrations` directory. The initial schema creates the following tables:

- `twitter_bookmarks`: Stores Twitter bookmarks
- `tags`: Stores tags for bookmarks
- `bookmark_tags`: Junction table for bookmark-tag relationships
- `collections`: Stores collections of bookmarks
- `collection_bookmarks`: Junction table for collection-bookmark relationships
- `highlights`: Stores highlights for bookmarks
- `reading_queue`: Stores reading queue information

### Applying Migrations

To apply database migrations:

```bash
cd supabase
supabase db push
```

## Row Level Security (RLS)

All tables have Row Level Security enabled to ensure that users can only access their own data. The RLS policies are defined in the migration files.

## Storage

Supabase provides S3-compatible storage. The storage configuration is defined in the `config.toml` file.

## Integration with Twisdom

The Twisdom application integrates with Supabase using the following files:

- `src/utils/supabaseClient.ts`: Initializes the Supabase client using environment variables
- `src/types/supabase.ts`: TypeScript definitions for the database schema
- `src/utils/migrateToSupabase.ts`: Utility to migrate data from localStorage to Supabase
- `src/components/SupabaseAuth.tsx`: Example authentication component

## Migration from localStorage

To migrate data from localStorage to Supabase, use the `migrateLocalStorageToSupabase` function from `src/utils/migrateToSupabase.ts`. This function will:

1. Load data from localStorage
2. Transform it to match the Supabase schema
3. Insert it into the appropriate Supabase tables
4. Associate data with the authenticated user

Example usage:

```typescript
import { migrateLocalStorageToSupabase } from '../utils/migrateToSupabase';

// After user authentication
const userId = user.id;
const result = await migrateLocalStorageToSupabase(userId);
console.log('Migration result:', result);
```

## Security Best Practices

1. **Environment Variables**: Store sensitive information like API keys in environment variables
2. **API Keys**: Never hardcode API keys in your source code
3. **Service Role Key**: Never expose the service role key to the client
4. **JWT Secret**: Use a strong, unique JWT secret in production
5. **Database Credentials**: Change the default database password in production

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)