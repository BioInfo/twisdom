#!/bin/bash

# Script to help set up a GitHub repository for Twisdom

echo "Twisdom GitHub Setup Script"
echo "==========================="
echo
echo "This script will help you set up a GitHub repository for Twisdom."
echo "Before running this script, you should have already:"
echo "  1. Created a GitHub account"
echo "  2. Created a new repository on GitHub named 'twisdom'"
echo
echo "Do you want to continue? (y/n)"
read -r continue

if [[ ! "$continue" =~ ^[Yy]$ ]]; then
    echo "Setup aborted."
    exit 0
fi

echo
echo "Please enter your GitHub username:"
read -r username

if [ -z "$username" ]; then
    echo "Username cannot be empty. Aborting."
    exit 1
fi

echo
echo "Adding GitHub repository as remote..."
git remote add origin "https://github.com/$username/twisdom.git"

if [ $? -ne 0 ]; then
    echo "Failed to add remote. Please check your username and try again."
    exit 1
fi

echo
echo "Remote added successfully."
echo
echo "Would you like to push your code to GitHub now? (y/n)"
read -r push

if [[ "$push" =~ ^[Yy]$ ]]; then
    echo
    echo "Pushing code to GitHub..."
    git push -u origin main

    if [ $? -ne 0 ]; then
        echo
        echo "Push failed. This could be due to:"
        echo "  1. Authentication issues (you need to be logged in to GitHub)"
        echo "  2. The repository doesn't exist"
        echo "  3. The repository already has content"
        echo
        echo "You can try pushing manually with:"
        echo "  git push -u origin main"
        exit 1
    fi

    echo
    echo "Code pushed successfully!"
    echo "Your Twisdom repository is now available at: https://github.com/$username/twisdom"
else
    echo
    echo "You can push your code to GitHub later with:"
    echo "  git push -u origin main"
fi

echo
echo "GitHub setup complete!"
echo
echo "Next steps:"
echo "  1. Set up GitHub Pages for documentation (optional)"
echo "  2. Configure GitHub Actions for CI/CD (optional)"
echo "  3. Add collaborators to your repository (optional)"
echo
echo "Thank you for using Twisdom!"