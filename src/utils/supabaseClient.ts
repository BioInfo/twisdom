import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get Supabase connection details from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Creates and exports a Supabase client instance for use throughout the application.
 * 
 * Connection details are loaded from environment variables:
 * - VITE_SUPABASE_URL: The URL of your Supabase instance
 * - VITE_SUPABASE_ANON_KEY: The anonymous key for your Supabase instance
 * 
 * For local development, the URL defaults to http://127.0.0.1:54321 if not provided.
 */
export const supabase: SupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to check if Supabase is connected and accessible
 * @returns Promise<boolean> - True if connected, false otherwise
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Attempt to make a simple query to verify connection
    const { data, error } = await supabase.from('twitter_bookmarks').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful:', data);
    return true;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
}

/**
 * Helper function to check if Supabase is running and provide instructions if not
 * @returns Promise with a message indicating the status and instructions if needed
 */
export async function checkSupabaseStatus(): Promise<{ isRunning: boolean; message: string }> {
  try {
    const isConnected = await checkSupabaseConnection();
    
    if (isConnected) {
      return { 
        isRunning: true, 
        message: 'Supabase is running correctly.' 
      };
    } else {
      return { 
        isRunning: false, 
        message: `
          Supabase server is not running. Please start it with the following steps:
          
          1. Open a new terminal
          2. Navigate to the supabase directory: cd ${window.location.pathname.includes('/apps/twisdom') ? '/Users/bioinfo/apps/twisdom/supabase' : 'supabase'}
          3. Run: supabase start
          4. Wait for all services to start
          5. Try again
          
          If you don't have Supabase CLI installed, please install it first:
          npm install -g supabase
        `
      };
    }
  } catch (error) {
    return { 
      isRunning: false, 
      message: `Error checking Supabase status: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Helper function to get the current authenticated user
 * @returns Promise with the user object or null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Helper function to sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with the session or error
 */
export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
}

/**
 * Helper function to sign up with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with the session or error
 */
export async function signUpWithEmail(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password
  });
}

/**
 * Helper function to sign out the current user
 * @returns Promise<void>
 */
export async function signOut() {
  return await supabase.auth.signOut();
}