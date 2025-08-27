# Multi-stage build for production deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Make build script executable
RUN chmod +x build-production.js

# Build the application using custom production script
RUN node build-production.js

# Verify build outputs exist  
RUN ls -la /app/dist/
RUN ls -la /app/dist/public/ || echo "No dist/public directory"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005

# Install curl for health checks and create system users
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application (server + client assets)
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Create directories for persistent data
RUN mkdir -p /app/attached_assets && chown -R nextjs:nodejs /app/attached_assets

USER nextjs

EXPOSE 3005

# Health check  
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/api/health || exit 1

CMD ["node", "dist/server/index.js"]