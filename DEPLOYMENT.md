# Deployment Guide

This guide covers deploying the AI Personal Memory Bank application to DigitalOcean.

## Prerequisites

- DigitalOcean account
- GitHub repository with your code
- OpenAI API key
- Domain name (optional, but recommended)

## Option 1: DigitalOcean App Platform (Recommended)

### Step 1: Prepare Repository

1. Update `.do/app.yaml` with your GitHub username and repository name
2. Ensure all environment variables are documented in `.env.example`

### Step 2: Create App in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub account
4. Select your repository
5. DigitalOcean will detect `.do/app.yaml` automatically

### Step 3: Configure Environment Variables

In the App Platform dashboard, set these environment variables:

**Required Secrets:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `JWT_SECRET` - Generate a random secret (e.g., `openssl rand -hex 32`)
- `ADMIN_PASSWORD` - Strong password for admin access

**Optional:**
- `ADMIN_USERNAME` - Default is "admin"

### Step 4: Deploy

1. Review the app configuration
2. Click "Create Resources"
3. Wait for deployment to complete (5-10 minutes)

### Step 5: Access Your App

- Frontend: `https://your-app-name.ondigitalocean.app`
- Services will have their own URLs (check App Platform dashboard)

## Option 2: DigitalOcean Droplet

### Step 1: Create Droplet

1. Create a new Droplet (Ubuntu 22.04 LTS)
2. Minimum 2GB RAM (4GB+ recommended)
3. Enable SSH keys

### Step 2: Initial Setup

```bash
# SSH into droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Git
apt install git -y
```

### Step 3: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd AI-Personal-Memory-Bank
```

### Step 4: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

**Required values:**
- `POSTGRES_PASSWORD` - Strong database password
- `DB_PASSWORD` - Same as POSTGRES_PASSWORD
- `OPENAI_API_KEY` - Your OpenAI API key
- `JWT_SECRET` - Random secret
- `ADMIN_PASSWORD` - Admin password

### Step 5: Deploy with Docker Compose

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 6: Configure Firewall

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### Step 7: Set Up Nginx Reverse Proxy

```bash
apt install nginx -y

# Create nginx config
nano /etc/nginx/sites-available/ai-memory-bank
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your_domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Upload Service
    location /api/upload/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Emotion Service
    location /api/emotion/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Timeline Service
    location /api/timeline/ {
        proxy_pass http://localhost:8003/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Search Service
    location /api/search/ {
        proxy_pass http://localhost:8004/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Admin Service
    location /api/admin/ {
        proxy_pass http://localhost:8005/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/ai-memory-bank /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Set Up SSL

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your_domain.com
```

### Step 9: Update Frontend API URLs

Update your frontend environment variables to use your domain:

```bash
# In .env file
VITE_UPLOAD_SERVICE_URL=https://your_domain.com/api/upload
VITE_EMOTION_SERVICE_URL=https://your_domain.com/api/emotion
VITE_TIMELINE_SERVICE_URL=https://your_domain.com/api/timeline
VITE_SEARCH_SERVICE_URL=https://your_domain.com/api/search
VITE_ADMIN_SERVICE_URL=https://your_domain.com/api/admin
```

Rebuild frontend:

```bash
cd frontend
npm run build
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## Post-Deployment

### Database Migrations

If you have any pending migrations:

```bash
# Connect to database
docker compose -f docker-compose.prod.yml exec db psql -U user -d memorybank

# Run migrations
\i /docker-entrypoint-initdb.d/schema.sql
```

### Monitoring

- Check service logs: `docker compose -f docker-compose.prod.yml logs -f [service-name]`
- Monitor resource usage in DigitalOcean dashboard
- Set up alerts for high CPU/memory usage

### Backups

**Database:**
```bash
# Backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U user memorybank > backup.sql

# Restore
docker compose -f docker-compose.prod.yml exec -T db psql -U user memorybank < backup.sql
```

**Uploads:**
```bash
# Backup uploads volume
docker run --rm -v ai-memory-bank_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
```

## Troubleshooting

### Services not starting
- Check logs: `docker compose -f docker-compose.prod.yml logs [service-name]`
- Verify environment variables are set correctly
- Ensure database is healthy: `docker compose -f docker-compose.prod.yml ps`

### Frontend can't connect to APIs
- Verify API URLs in frontend environment variables
- Check CORS settings in backend services
- Ensure services are running and accessible

### Database connection issues
- Verify database credentials in `.env`
- Check database is running: `docker compose -f docker-compose.prod.yml ps db`
- Check database logs: `docker compose -f docker-compose.prod.yml logs db`

## Security Checklist

- [ ] Changed all default passwords
- [ ] Set strong `JWT_SECRET`
- [ ] Set strong `ADMIN_PASSWORD`
- [ ] Set strong database passwords
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Environment variables secured (not in git)
- [ ] Regular backups scheduled
- [ ] Monitoring and alerts set up

## Cost Estimation

**App Platform:**
- Basic services: ~$12-24/month
- Database: ~$15/month
- Total: ~$27-39/month

**Droplet:**
- 4GB RAM Droplet: ~$24/month
- Managed Database (optional): ~$15/month
- Total: ~$24-39/month

## Support

For issues, check:
- Service logs in DigitalOcean dashboard
- Docker logs: `docker compose logs`
- Application health endpoints: `/health`

