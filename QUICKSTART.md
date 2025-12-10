# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Docker Desktop installed and running
- ✅ At least 4GB RAM available
- ✅ 10GB+ free disk space
- ✅ Internet connection (for downloading ML models on first run)

## Step-by-Step Setup

### 1. Start All Services

Open a terminal in the project directory and run:

```bash
docker-compose up --build
```

**First run will take 5-10 minutes** as it:
- Builds all Docker images
- Downloads ML models (~1-2GB)
- Initializes the database

### 2. Verify Services Are Running

Wait until you see all services showing "Application startup complete". Then test health endpoints:

**Windows (PowerShell):**
```powershell
.\test_api.ps1
```

**Linux/Mac:**
```bash
chmod +x test_api.sh
./test_api.sh
```

Or manually check:
```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health
```

### 3. Test Photo Upload

**Using curl:**
```bash
curl -X POST "http://localhost:8001/photos?user_id=test_user" \
  -F "file=@/path/to/your/photo.jpg"
```

**Using PowerShell:**
```powershell
$uri = "http://localhost:8001/photos?user_id=test_user"
$filePath = "C:\path\to\your\photo.jpg"
$form = @{
    file = Get-Item -Path $filePath
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

### 4. View Timeline

```bash
curl "http://localhost:8003/timeline?user_id=test_user&bucket=month"
```

### 5. Search Photos

```bash
curl "http://localhost:8004/search?user_id=test_user&emotion=happy"
```

### 6. Access Admin Analytics

**Get token:**
```bash
curl -X POST "http://localhost:8005/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Use token to get stats:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:8005/admin/usage?days=30"
```

## Common Issues

### Services Won't Start
- **Check Docker is running**: Ensure Docker Desktop is running
- **Check ports**: Ensure ports 8001-8005 and 5432 are not in use
- **Check logs**: `docker-compose logs <service-name>`

### Emotion Service Slow/Failing
- **First run**: Model download takes time, be patient
- **Memory**: Ensure Docker has at least 4GB RAM allocated
- **Check logs**: `docker-compose logs emotion-service`

### Database Connection Errors
- **Wait for DB**: Database needs to initialize first
- **Check health**: `docker-compose ps` - ensure db shows "healthy"
- **Restart**: `docker-compose restart`

### Photo Upload Fails
- **File size**: Check file isn't too large
- **File type**: Ensure it's a valid image (jpg, png, etc.)
- **Check logs**: `docker-compose logs upload-service`

## Stopping Services

```bash
docker-compose down
```

To also remove volumes (deletes all data):
```bash
docker-compose down -v
```

## Viewing Logs

View all logs:
```bash
docker-compose logs -f
```

View specific service:
```bash
docker-compose logs -f upload-service
docker-compose logs -f emotion-service
```

## Next Steps

1. **Integrate Frontend**: Connect your React frontend to these APIs
2. **Add Authentication**: Implement user authentication for production
3. **Deploy to Cloud**: Use AWS, Azure, or GCP for deployment
4. **Add Monitoring**: Set up logging and monitoring (e.g., Prometheus, Grafana)

## API Documentation

Once services are running, visit:
- Upload Service: http://localhost:8001/docs
- Emotion Service: http://localhost:8002/docs
- Timeline Service: http://localhost:8003/docs
- Search Service: http://localhost:8004/docs
- Admin Service: http://localhost:8005/docs

Each service has interactive Swagger documentation!

