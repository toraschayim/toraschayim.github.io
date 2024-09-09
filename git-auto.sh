#!/bin/bash

# Default commit message
DEFAULT_MESSAGE="Auto-commit: $(date +'%Y-%m-%d %H:%M:%S')"

# Use provided commit message or default if none is given
COMMIT_MESSAGE=${1:-$DEFAULT_MESSAGE}

# Pull latest changes from the remote repository
echo "Pulling latest changes from 'main' branch..."
git pull origin main

# Add all files (new, modified, deleted)
echo "Adding all files..."
git add .

# Commit with the provided message
echo "Committing with message: '$COMMIT_MESSAGE'"
git commit -m "$COMMIT_MESSAGE"

# Push changes to the remote repository
echo "Pushing changes to the 'main' branch..."
git push origin main

# Display the current status of the working directory
echo "Displaying git status..."
git status

echo "All done!"
