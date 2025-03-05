import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { deleteAllUserData, signOut } from '../utils/supabaseStorage';
import { checkSupabaseStatus } from '../utils/supabaseClient';

interface ProfilePageProps {
  user: User | null;
  onLogout: () => void;
}

export function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [supabaseRunning, setSupabaseRunning] = useState(true);
  const [deleteProgress, setDeleteProgress] = useState('');

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
      setDeleteProgress('Data deletion completed');
      
      if (!success) {
        throw new Error(error || 'Failed to delete data');
      }
      
      console.log('Data deleted successfully, logging out');
      await signOut();
      
      // Only call onLogout if it exists
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/'; // Fallback to redirect to home page
      }
      setMessage('All data deleted successfully. You have been logged out.');
    } catch (error) {
      console.error('Error in handleDeleteDataAndLogout:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting data';
      setMessage(`Error: ${errorMessage}. Please try again or contact support.`);
    } finally {
      setIsDeleting(false);
      setDeleteProgress('');
    }
  };

  const setStatusMessage = (msg: string) => {
    setMessage(msg);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">User ID:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Last Sign In:</span>
                  <span className="text-gray-900 dark:text-white">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h2>
            <div className="flex flex-col space-y-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Sign Out
              </button>
              
              <button
                onClick={handleDeleteDataAndLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                disabled={isDeleting}
              > 
                {isDeleting ? 'Deleting...' : 'Delete All Data & Sign Out'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              <p className="whitespace-pre-wrap">{message}</p>
            </div>
          )}
          
          {isDeleting && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Deleting data... This may take a moment.</p>
              </div>
              {deleteProgress && <p className="mt-2 text-sm">{deleteProgress}</p>}
              <p className="mt-2 text-sm">Please do not close this page or navigate away.</p>
            </div>
          )}
          
          {!supabaseRunning && (
            <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">
              <h3 className="font-bold mb-2">Supabase Server Not Running</h3>
              <p className="mb-2">The Supabase server is not running. Please start it to use database features.</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto whitespace-pre-wrap">
                {message}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}