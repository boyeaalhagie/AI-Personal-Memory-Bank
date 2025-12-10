# Pre-Deployment Checklist

## Before Deploying

### 1. Security
- [ ] Remove hardcoded API keys from `docker-compose.yml` (✅ Done - now uses env vars)
- [ ] Generate strong passwords for:
  - [ ] Database (`POSTGRES_PASSWORD`, `DB_PASSWORD`)
  - [ ] Admin account (`ADMIN_PASSWORD`)
  - [ ] JWT secret (`JWT_SECRET`) - use: `openssl rand -hex 32`
- [ ] Add `.env` to `.gitignore` (✅ Done)
- [ ] Never commit `.env` file to git

### 2. Environment Variables
- [ ] Copy `.env.example` to `.env` and fill in all values
- [ ] Set `OPENAI_API_KEY` in `.env`
- [ ] Update API URLs for production (if using custom domain)

### 3. Configuration Files
- [ ] Update `.do/app.yaml` with your GitHub username/repo name
- [ ] Review `docker-compose.prod.yml` settings
- [ ] Verify all service Dockerfiles exist (✅ All services have Dockerfiles)

### 4. Frontend Configuration
- [ ] API URLs now use environment variables (✅ Done)
- [ ] Build process configured in `frontend/Dockerfile` (✅ Done)
- [ ] Nginx config created for production (✅ Done)

### 5. Database
- [ ] Database schema is in `db/schema.sql` (✅ Present)
- [ ] Migrations are documented if needed

### 6. Testing
- [ ] Test locally with `docker-compose.prod.yml`
- [ ] Verify all services start correctly
- [ ] Test API endpoints
- [ ] Test frontend connects to APIs

### 7. Documentation
- [ ] `DEPLOYMENT.md` created with instructions (✅ Done)
- [ ] `.env.example` created with all required variables (✅ Done)

## Quick Test Commands

```bash
# Test production docker-compose locally
docker compose -f docker-compose.prod.yml up -d

# Check all services are running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Test frontend build
cd frontend
npm install
npm run build
```

## Important Notes

1. **Never commit `.env` file** - it contains secrets
2. **Update `.do/app.yaml`** - Replace `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME`
3. **Set environment variables** in DigitalOcean App Platform dashboard
4. **Use production compose file** - `docker-compose.prod.yml` for deployment
5. **Backup database** regularly after deployment

## Next Steps

1. Review `DEPLOYMENT.md` for detailed instructions
2. Choose deployment method (App Platform or Droplet)
3. Follow deployment guide
4. Test all functionality after deployment
5. Set up monitoring and backups

