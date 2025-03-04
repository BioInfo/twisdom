#!/bin/bash

# Script to start Supabase server for Twisdom application

echo "Starting Supabase server for Twisdom..."
echo "This script will navigate to the supabase directory and start the Supabase server."

# Navigate to the supabase directory
cd "$(dirname "$0")/supabase"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed."
    echo "Would you like to install it now? (y/n)"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        echo "Installing Supabase CLI..."
        npm install -g supabase
    else
        echo "Please install Supabase CLI manually and try again."
        echo "You can install it with: npm install -g supabase"
        exit 1
    fi
fi

# Start Supabase
echo "Starting Supabase server..."
supabase start

# Check if Supabase started successfully
if [ $? -eq 0 ]; then
    echo "Supabase server started successfully!"
    echo "You can now use the Twisdom application with Supabase."
    echo "Supabase Studio is available at: http://127.0.0.1:54323"
    echo ""
    echo "To stop Supabase, run: cd supabase && supabase stop"
else
    echo "Failed to start Supabase server."
    echo "Please check the error messages above and try again."
    exit 1
fi