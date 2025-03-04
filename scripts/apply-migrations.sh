#!/bin/bash

# Script to apply Supabase migrations

# Check if Supabase is running
echo "Checking if Supabase is running..."
supabase status > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Supabase is not running. Starting Supabase..."
  cd supabase
  supabase start
  cd ..
else
  echo "Supabase is already running."
fi

# Apply migrations
echo "Applying migrations..."
cd supabase
supabase db reset
cd ..

echo "Migrations applied successfully!"
echo "Your database now has the latest schema with AI analysis columns."