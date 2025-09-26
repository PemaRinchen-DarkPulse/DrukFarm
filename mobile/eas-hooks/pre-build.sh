#!/bin/bash

# EAS Build Hook - Pre-install setup
# This script runs before dependencies are installed

echo "🔧 Pre-install setup for EAS build..."

# Ensure we have proper environment
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Clear any npm cache issues
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || echo "NPM cache clean skipped"

echo "✅ Pre-install setup complete"