import React, { useState, useEffect } from 'react';
import { getCurrentUser, signInWithEmailAndPassword, signUpWithEmailAndPassword, signOut, deleteAllUserData } from '../utils/supabaseStorage';
import { supabase, checkSupabaseStatus } from '../utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface SupabaseAuthProps {
  onClose?: () => void;
}

/**
 * SupabaseAuth component demonstrates how to use Supabase authentication
 * in the Twisdom application. It provides a simple UI for signing up,
 * signing in, and signing out.
 */
const SupabaseAuth: React.FC<SupabaseAuthProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [supabaseRunning, setSupabaseRunning] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Check for existing session on component mount
  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check if Supabase is running
    async function checkStatus() {
      const status = await checkSupabaseStatus();
      setSupabaseRunning(status.isRunning);
      if (!status.isRunning) {
        setStatusMessage(status.message);
        setLoading(false);
      } else {
        loadUser();
      }
    }
    checkStatus();

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { success, user: newUser, error } = await signUpWithEmailAndPassword(email, password);
      
      if (!success || error) {
        throw new Error(error || 'Sign up failed');
      }
      
      setMessage(
        !newUser ? 
          'Account already exists. Please sign in.' :
          'Check your email for the confirmation link.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred during sign up');
      console.error('Error signing up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { success, error } = await signInWithEmailAndPassword(email, password);
      
      if (!success || error) {
        throw new Error(error || 'Sign in failed');
      }
      
      // Close the modal after successful login
      setMessage('Signed in successfully!');
      if (onClose) setTimeout(onClose, 1000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred during sign in');
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      const { success, error } = await signOut();
      
      if (!success || error) {
        throw new Error(error || 'Sign out failed');
      }
      
      setMessage('Signed out successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred during sign out');
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataAndLogout = async () => {
    if (!user) return;
    
    // Check if Supabase is running first
    const status = await checkSupabaseStatus();
    if (!status.isRunning) {
      setSupabaseRunning(false);
      setStatusMessage(status.message);
      return;
    }
    
    try {
      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
        return;
      }
      
      setIsDeleting(true);
      setMessage('Deleting all data...');
      
      console.log('Starting data deletion process');
      const { success, error } = await deleteAllUserData(user.id);
      console.log('Data deletion result:', { success, error });
      
      if (!success || error) {
        throw new Error(error || 'Failed to delete data');
      }
      
      console.log('Data deleted successfully, logging out');
      await handleSignOut();
      setMessage('All data deleted successfully. You have been logged out.');
    } catch (error) {
      console.error('Error in handleDeleteDataAndLogout:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting data';
      setMessage(`Error: ${errorMessage}. Please try again or contact support.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // If loading, show a loading indicator
  if (loading) {
    return <div className="flex justify-center items-center p-4">Loading...</div>;
  }

  // If Supabase is not running, show instructions
  if (!supabaseRunning) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supabase Not Running</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="mb-4">
          <p className="text-red-600 dark:text-red-400 font-bold">Supabase server is not running</p>
          <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded overflow-auto text-sm whitespace-pre-wrap">
            {statusMessage}
          </pre>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={async () => {
              setLoading(true);
              const status = await checkSupabaseStatus();
              setSupabaseRunning(status.isRunning);
              setStatusMessage(status.message);
              setLoading(false);
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Check Again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // If user is signed in, show user info and sign out button
  if (user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user.email}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300">You are signed in!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">User ID: {user.id}</p>
        </div>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleSignOut}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            Sign Out
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Close
            </button>
          )}
        </div>
        <div>
          <button
            onClick={handleDeleteDataAndLogout}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete All Data & Logout'}
          </button>
        </div>
        {message && (
          <div className="mt-4 p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            {message}
          </div>
        )}
      </div>
    );
  }

  // If user is not signed in, show sign in/sign up form
  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Twisdom Authentication</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Email"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Password"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSignIn}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
            type="button"
          >
            Sign Up
          </button>
        </div>
      </form>
      {message && (
        <div className="mt-4 p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default SupabaseAuth;