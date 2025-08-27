# Deployment Fix for Coolify

## Fixed Issues ✅
1. **Docker Build Error**: Removed incorrect `/app/client/dist` copy command since vite builds to `/app/dist/public`
2. **Health Check**: Added curl to Alpine image for health checks  
3. **Build Verification**: Added checks to verify build outputs exist
4. **Vite Import Error**: Fixed ERR_MODULE_NOT_FOUND by creating separate production module
5. **Production Bundle**: Custom build script completely eliminates vite dependencies from production bundle
6. **Clean Separation**: Development uses vite.ts, production uses production.ts with same interface

## Current Dockerfile Structure
- **Base Stage**: Node 20 Alpine
- **Deps Stage**: Production dependencies only  
- **Builder Stage**: Full dependencies + build process
- **Runner Stage**: Final production image

## Build Process
1. `vite build` → Outputs client assets to `dist/public/`
2. `esbuild server/index.ts` → Outputs server to `dist/index.js` (excluding vite modules)
3. `cp server/production.ts` → Copy production static server to `dist/production.js`
4. Patch imports to use production.js instead of vite.js in built bundle

**Custom Build Script**: `build-production.js` handles the complete production build process

## Production Ready Features
- Multi-stage build for minimal image size
- Non-root user execution
- Health checks included
- Proper file permissions
- Development dependencies excluded

## Environment Variables for Coolify
```bash
DATABASE_URL=postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres
SESSION_SECRET=your-secure-random-session-secret-here  
NODE_ENV=production
PORT=3005
```

## After Deployment
1. Container should start automatically on port 3005
2. Run migration script: `docker exec -it <container> npx tsx scripts/migrate-on-server.ts`
3. Check health: `curl http://your-domain:3005/api/health`

## File Structure in Container
```
/app/
├── dist/
│   ├── index.js           # Server code
│   └── public/            # Client assets (HTML, CSS, JS, images)
├── node_modules/          # Production dependencies  
├── shared/               # Shared types/schemas
├── data/                 # Question data JSON files
└── attached_assets/      # User uploads (mounted volume)
```