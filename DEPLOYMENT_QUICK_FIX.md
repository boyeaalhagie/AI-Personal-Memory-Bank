# Quick Fix for DigitalOcean Deployment

If DigitalOcean isn't detecting your app spec, try these:

## Option 1: Move app.yaml to Root

The file is now at the root as `app.yaml`. Try refreshing the DigitalOcean page or:
1. Click "Skip" or "Continue" on the current page
2. After app is created, go to Settings → App Spec
3. Click "Edit" and paste the contents from `app.yaml`

## Option 2: Use DigitalOcean CLI

```powershell
# Install doctl from: https://docs.digitalocean.com/reference/doctl/how-to/install/
# Then run:
doctl auth init
doctl apps create --spec app.yaml
```

## Option 3: Manual Component Setup

If auto-detection fails, manually add each component:

1. **Click "Edit Components" or "Add Component"**
2. **Add Database:**
   - Type: Database
   - Engine: PostgreSQL 15
   - Name: db

3. **Add Upload Service:**
   - Type: Web Service
   - Source: GitHub (boyeaalhagie/AI-Personal-Memory-Bank, main branch)
   - Build: Dockerfile
   - Dockerfile Path: `upload-service/Dockerfile`
   - Dockerfile Context: `.`
   - HTTP Port: 8000
   - Environment Variables:
     - DB_HOST: ${db.HOSTNAME}
     - DB_PORT: ${db.PORT}
     - DB_NAME: ${db.DATABASE}
     - DB_USER: ${db.USERNAME}
     - DB_PASSWORD: ${db.PASSWORD}
     - EMOTION_SERVICE_URL: ${emotion-service.PUBLIC_URL}

4. **Repeat for other services** (emotion-service, timeline-service, search-service, admin-service, frontend)

5. **Add Frontend:**
   - Type: Web Service
   - Source: GitHub
   - Build: Dockerfile
   - Dockerfile Path: `frontend/Dockerfile`
   - Dockerfile Context: `.`
   - HTTP Port: 80
   - Routes: `/`
   - Environment Variables (BUILD_TIME):
     - VITE_UPLOAD_SERVICE_URL: ${upload-service.PUBLIC_URL}
     - VITE_EMOTION_SERVICE_URL: ${emotion-service.PUBLIC_URL}
     - VITE_TIMELINE_SERVICE_URL: ${timeline-service.PUBLIC_URL}
     - VITE_SEARCH_SERVICE_URL: ${search-service.PUBLIC_URL}
     - VITE_ADMIN_SERVICE_URL: ${admin-service.PUBLIC_URL}

## Option 4: Create App First, Then Import Spec

1. Click "Skip" to create a basic app
2. Go to your app dashboard
3. Click "Settings" → "App Spec"
4. Click "Edit" 
5. Copy and paste the entire contents of `app.yaml`
6. Click "Save"
7. DigitalOcean will redeploy with the new spec

