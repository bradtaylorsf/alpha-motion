#!/bin/bash

# bump-version.sh - Helper script to bump version and trigger a release
# Usage: ./scripts/bump-version.sh [patch|minor|major]

set -e

BUMP_TYPE=${1:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: $0 [patch|minor|major]"
  echo "  patch - 0.1.0 -> 0.1.1 (default)"
  echo "  minor - 0.1.0 -> 0.2.0"
  echo "  major - 0.1.0 -> 1.0.0"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Bump version using npm (updates package.json)
npm version "$BUMP_TYPE" --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# Commit and push
git add package.json
git commit -m "chore(release): bump version to $NEW_VERSION [release]"
git push origin main

echo ""
echo "✅ Version bumped to $NEW_VERSION"
echo "🚀 Release workflow will start automatically"
echo ""
echo "Monitor the release at:"
echo "https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
