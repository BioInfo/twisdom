/**
 * TypeScript definitions for Supabase database tables
 * Generated based on the schema defined in docs/supabase-setup.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      twitter_bookmarks: {
        Row: {
          id: string
          tweet_id: string
          tweet_date: string | null
          posted_by: string
          posted_by_profile_pic: string | null
          posted_by_profile_url: string | null
          posted_by_handle: string | null
          tweet_url: string
          content: string | null
          comments: string | null
          media: string | null
          sentiment: string | null
          summary: string | null
          reading_status: string
          priority: string
          reading_time: number | null
          last_read_at: string | null
          progress: number
          notes: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tweet_id: string
          tweet_date?: string | null
          posted_by: string
          posted_by_profile_pic?: string | null
          posted_by_profile_url?: string | null
          posted_by_handle?: string | null
          tweet_url: string
          content?: string | null
          comments?: string | null
          media?: string | null
          sentiment?: string | null
          summary?: string | null
          reading_status?: string
          priority?: string
          reading_time?: number | null
          last_read_at?: string | null
          progress?: number
          notes?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tweet_id?: string
          tweet_date?: string | null
          posted_by?: string
          posted_by_profile_pic?: string | null
          posted_by_profile_url?: string | null
          posted_by_handle?: string | null
          tweet_url?: string
          content?: string | null
          comments?: string | null
          media?: string | null
          sentiment?: string | null
          summary?: string | null
          reading_status?: string
          priority?: string
          reading_time?: number | null
          last_read_at?: string | null
          progress?: number
          notes?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twitter_bookmarks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string | null
          icon: string | null
          description: string | null
          is_ai_generated: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          icon?: string | null
          description?: string | null
          is_ai_generated?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          icon?: string | null
          description?: string | null
          is_ai_generated?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmark_tags: {
        Row: {
          bookmark_id: string
          tag_id: string
        }
        Insert: {
          bookmark_id: string
          tag_id: string
        }
        Update: {
          bookmark_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_tags_bookmark_id_fkey"
            columns: ["bookmark_id"]
            referencedRelation: "twitter_bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmark_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      collections: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          icon: string | null
          color: string | null
          order_position: number | null
          description: string | null
          is_private: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          icon?: string | null
          color?: string | null
          order_position?: number | null
          description?: string | null
          is_private?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          icon?: string | null
          color?: string | null
          order_position?: number | null
          description?: string | null
          is_private?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_bookmarks: {
        Row: {
          collection_id: string
          bookmark_id: string
        }
        Insert: {
          collection_id: string
          bookmark_id: string
        }
        Update: {
          collection_id?: string
          bookmark_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_bookmarks_collection_id_fkey"
            columns: ["collection_id"]
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_bookmarks_bookmark_id_fkey"
            columns: ["bookmark_id"]
            referencedRelation: "twitter_bookmarks"
            referencedColumns: ["id"]
          }
        ]
      }
      highlights: {
        Row: {
          id: string
          bookmark_id: string
          text: string
          color: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: string
          bookmark_id: string
          text: string
          color?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          bookmark_id?: string
          text?: string
          color?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlights_bookmark_id_fkey"
            columns: ["bookmark_id"]
            referencedRelation: "twitter_bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_queue: {
        Row: {
          id: string
          bookmark_id: string
          status: string
          is_favorite: boolean
          favorite_category: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bookmark_id: string
          status?: string
          is_favorite?: boolean
          favorite_category?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bookmark_id?: string
          status?: string
          is_favorite?: boolean
          favorite_category?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_queue_bookmark_id_fkey"
            columns: ["bookmark_id"]
            referencedRelation: "twitter_bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_queue_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}