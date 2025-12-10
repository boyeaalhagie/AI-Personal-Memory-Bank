# AI Emotional Memory Bank

A containerized microservices application that transforms a user's photo library into an interactive emotional timeline using AI-powered emotion analysis.

## Architecture

The system consists of 5 microservices, each running in its own Docker container:

1. **Upload Service** (Port 8001) - Handles photo uploads and triggers emotion tagging
2. **Emotion Tagging Service** (Port 8002) - Uses AI models to generate captions and classify emotions
3. **Timeline Service** (Port 8003) - Aggregates emotional history over time
4. **Emotion Search Service** (Port 8004) - Enables searching photos by emotional content
5. **Admin Analytics Service** (Port 8005) - Provides usage statistics (admin-only)

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of RAM (for ML models)
- 10GB+ free disk space (for models and images)

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd AI-Personal-Memory-Bank
   ```

2. **Start all backend services:**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build all Docker images
   - Download ML models (~1-2GB)
   - Initialize the database

3. **Wait for services to be ready** (especially emotion-service, which loads ML models)

4. **Verify services are running:**
   - Upload Service: http://localhost:8001/health
   - Emotion Service: http://localhost:8002/health
   - Timeline Service: http://localhost:8003/health
   - Search Service: http://localhost:8004/health
   - Admin Service: http://localhost:8005/health

### Frontend Application

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Frontend: http://localhost:5173
   - The frontend will automatically connect to backend services

## API Endpoints

### Upload Service (Port 8001)

- `POST /photos?user_id=<user_id>` - Upload a photo
  - Body: multipart/form-data with image file
  - Returns: Photo info with emotion (after processing)

- `GET /photos?user_id=<user_id>` - Get all photos for a user

### Emotion Tagging Service (Port 8002)

- `POST /tag-photo` - Tag a photo with emotion (called internally)
  - Body: `{"photo_id": 1, "file_path": "/app/uploads/..."}`

### Timeline Service (Port 8003)

- `GET /timeline?user_id=<user_id>&bucket=month` - Get emotional timeline
  - `bucket` can be: `month`, `week`, or `day`
  - Returns: Aggregated emotion counts by time period

### Search Service (Port 8004)

- `GET /search?user_id=<user_id>&emotion=happy&from=2024-01-01&to=2024-12-31` - Search photos
  - All query parameters are optional
  - Returns: List of matching photos

### Admin Analytics Service (Port 8005)

- `POST /admin/login` - Get admin token
  - Body: `{"username": "admin", "password": "admin123"}`
- `GET /admin/usage?days=30` - Get usage statistics (requires Bearer token)
  - Header: `Authorization: Bearer <token>`

## Example Usage

### 1. Upload a Photo

```bash
curl -X POST "http://localhost:8001/photos?user_id=user1" \
  -F "file=@/path/to/photo.jpg"
```

### 2. Get Timeline

```bash
curl "http://localhost:8003/timeline?user_id=user1&bucket=month"
```

### 3. Search Photos

```bash
curl "http://localhost:8004/search?user_id=user1&emotion=happy"
```

### 4. Get Admin Analytics

```bash
# First, login to get token
TOKEN=$(curl -X POST "http://localhost:8005/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Then use token to get stats
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8005/admin/usage?days=30"
```

## Database Schema

The system uses PostgreSQL with two main tables:

- **photos**: Stores photo metadata, captions, and emotions
- **usage_logs**: Tracks API usage for analytics

See `db/schema.sql` for the complete schema.

## Development

### Running Individual Services

Each service can be run independently for development:

```bash
cd upload-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Environment Variables

Key environment variables (set in docker-compose.yml):

- Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Admin: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`

## ML Models

The Emotion Tagging Service uses:

- **Image Captioning**: BLIP (Salesforce/blip-image-captioning-base)
- **Emotion Classification**: j-hartmann/emotion-english-distilroberta-base

Models are downloaded automatically on first run and cached in a Docker volume.

## Troubleshooting

1. **Services not starting**: Check logs with `docker-compose logs <service-name>`
2. **Database connection errors**: Ensure database is healthy before services start
3. **Model loading slow**: First run downloads models (~1-2GB), subsequent runs are faster
4. **Out of memory**: Increase Docker memory limit or use smaller models

## Project Structure

```
.
├── upload-service/      # Photo upload microservice
├── emotion-service/     # AI emotion tagging microservice
├── timeline-service/    # Timeline aggregation microservice
├── search-service/      # Photo search microservice
├── admin-service/       # Analytics microservice
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API service layer
│   └── package.json
├── shared/              # Shared database utilities
├── db/                  # Database schema
├── docker-compose.yml   # Container orchestration
└── README.md           # This file
```

## Frontend Features

The React frontend provides a complete user interface for all backend services:

- **📤 Photo Upload** - Drag & drop or select images to upload
- **🖼️ Photo Gallery** - Browse all photos with emotion labels and captions
- **📊 Timeline Visualization** - Interactive charts showing emotional journey
- **🔍 Advanced Search** - Filter photos by emotion, date range, or user
- **📈 Admin Dashboard** - Usage analytics with authentication

See `frontend/README.md` and `INTEGRATION.md` for detailed frontend documentation.

## Frontend Features

The React frontend provides a complete user interface for all backend services:

- **📤 Photo Upload** - Drag & drop or select images to upload
- **🖼️ Photo Gallery** - Browse all photos with emotion labels and captions
- **📊 Timeline Visualization** - Interactive charts showing emotional journey
- **🔍 Advanced Search** - Filter photos by emotion, date range, or user
- **📈 Admin Dashboard** - Usage analytics with authentication

See `frontend/README.md` for detailed frontend documentation.

## License

This project is for educational purposes.

