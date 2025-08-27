#!/bin/bash

# Push deployment fixes to git repository

echo "🚀 Preparing deployment fixes for push..."

# Add all changed files
git add .

# Commit with deployment message
git commit -m "🐳 Fix Docker deployment issues for Coolify

- Remove direct vite import from server bundle 
- Use dynamic import for vite in development only
- Add curl to production image for health checks
- Verify build structure generates dist/public correctly
- Update SESSION_SECRET generation for production

Fixes:
✓ ERR_MODULE_NOT_FOUND for vite package
✓ Health check dependencies 
✓ Multi-stage Docker build optimization

Ready for production deployment on port 3005"

# Push to main branch
git push origin main

echo "✅ Deployment fixes pushed to repository!"
echo "🔄 Coolify should auto-deploy the new version"