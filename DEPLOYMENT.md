# Deployment Guide for Coolify

## Prerequisites
1. Coolify server with Docker support
2. PostgreSQL database URL (provided)
3. Domain pointing to your Coolify server

## Environment Variables Required

Set these in Coolify:

```bash
DATABASE_URL=postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres
SESSION_SECRET=generate-a-secure-random-string-here
NODE_ENV=production
PORT=3005
```

## Deployment Steps

### 1. Database Migration (Two Options)

#### Option A: Run migration on server after deployment
```bash
# SSH into your Coolify server after deployment
docker exec -it <container-name> node scripts/migrate-on-server.js

# Or run the script directly in the container
# This will use the existing DATABASE_URL environment variable
```

#### Option B: Manual database setup (if needed)
The database URL you provided might need verification. If the migration fails, manually create the tables using the SQL commands in `scripts/migrate-to-production.ts`.

The migration will:
- Create all necessary database tables
- Insert 3,000 authentic cultural questions
- Set up countries (Cuba & Honduras)
- Verify data integrity

### 2. Coolify Configuration

#### Application Settings:
- **Port**: 3005
- **Build Command**: `npm run build` 
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

#### Required Persistent Volumes:
- Mount: `/app/attached_assets` (for user-generated images/assets)

#### Docker Configuration:
- Uses multi-stage build for optimization
- Production image size: ~200MB
- Includes health checks
- Runs as non-root user for security

### 3. Post-Deployment Verification

Check these endpoints:
- `GET /api/health` - Health check
- `GET /api/countries` - Countries list
- `GET /api/questions/cuba/1` - Sample questions

## File Structure in Production

```
/app/
├── dist/                 # Compiled server code
├── client/dist/         # Built frontend assets
├── attached_assets/     # Persistent user uploads (mounted volume)
├── data/               # Question data (read-only)
└── node_modules/       # Dependencies
```

## Security Notes
- Session secrets must be strong random strings
- Database connections use SSL in production
- All user uploads go to persistent mounted volume
- Non-root container execution

## Monitoring & Logs
- Health checks every 30 seconds
- Request logging to stdout/stderr
- Database connection pooling
- Automatic container restart on failure

## Scaling Considerations
- Stateless application design
- Database connection pooling
- Persistent volume for user assets
- Ready for horizontal scaling

## Troubleshooting

### Common Issues:
1. **Database connection fails**: Check DATABASE_URL format and network access
2. **Session issues**: Verify SESSION_SECRET is set
3. **Port conflicts**: Ensure port 3005 is available
4. **File uploads**: Check mounted volume permissions

### Debug Commands:
```bash
# Check container logs
docker logs <container-id>

# Database connectivity test
docker exec -it <container-id> node -e "console.log(process.env.DATABASE_URL)"

# Health check manual test
curl http://localhost:3005/api/health
```