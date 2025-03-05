#!/bin/bash

# Script to stop Supabase server for Twisdom application

echo "Stopping Supabase server for Twisdom..."

# Navigate to the supabase directory relative to the script location
cd "$(dirname "$0")/../supabase" || {
    echo "Error: Could not navigate to the supabase directory."
    exit 1
}

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Attempt to stop Supabase regardless of status check
# as the status command output format may vary

# Stop Supabase
echo "Stopping Supabase server..."
supabase stop

# Check if Supabase stopped successfully
if [ $? -eq 0 ]; then
    echo "Supabase server stopped successfully!"
    echo "All Supabase services have been shut down."
else
    echo "Failed to stop Supabase server."
    echo "Please check the error messages above and try again."
    echo "You may need to manually stop Docker containers if they're still running."
    exit 1
fi

echo "Cleanup complete. Supabase has been shut down."
