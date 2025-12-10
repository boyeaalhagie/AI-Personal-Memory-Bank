# AI Personal Memory Bank

A microservices-based web application that transforms your photo library into an interactive emotional timeline using AI-powered emotion analysis. Upload photos, and the system automatically analyzes them using OpenAI's Vision API to extract emotions, generate captions, and organize your memories by how you felt.

**🌐 Live Application:** [https://ai-memory-bank-jhli6.ondigitalocean.app/](https://ai-memory-bank-jhli6.ondigitalocean.app/)

## Features

- **📸 Photo Upload** - Drag & drop or select images to upload
- **🤖 AI Emotion Analysis** - Automatic emotion tagging using OpenAI GPT-4 Vision API
- **📊 Emotion Heatmap** - Calendar-style visualization showing emotional patterns over time
- **🔍 Advanced Search** - Find photos by emotion, date range, or user
- **📅 Timeline View** - Chronological view of photos with emotion tags
- **🎨 Emotion Collages** - Grouped photo collections by emotion
- **📈 Analytics Dashboard** - Usage statistics and insights

## Architecture

The system consists of 6 microservices, each running in its own Docker container:

1. **Upload Service** (Port 8000) - Handles photo uploads, file storage, and triggers emotion tagging
2. **Emotion Service** (Port 8000) - Uses OpenAI Vision API to analyze images and extract emotions
3. **Timeline Service** (Port 8000) - Aggregates emotional history over time periods
4. **Search Service** (Port 8000) - Enables searching photos by emotional content and date ranges
5. **Admin Service** (Port 8000) - Provides usage statistics and analytics
6. **Frontend** (Port 5173) - React + TypeScript single-page application

**Technology Stack:**
- **Backend:** Python, FastAPI, PostgreSQL
- **Frontend:** React, TypeScript, Vite
- **AI/ML:** OpenAI GPT-4 Vision API
- **Deployment:** Docker, DigitalOcean App Platform
- **Database:** PostgreSQL 15

## Installation

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and npm (for frontend development)
- PostgreSQL database (or use Docker Compose)
- OpenAI API key (for emotion analysis)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/boyeaalhagie/AI-Personal-Memory-Bank.git
   cd AI-Personal-Memory-Bank
   ```

2. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=memory_bank
   DB_USER=postgres
   DB_PASSWORD=postgres
   
   # OpenAI API Key
   OPENAI_API_KEY=sk-your-api-key-here
   
   # CORS Origins (comma-separated)
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

3. **Start backend services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   
   This will:
   - Build all Docker images
   - Start PostgreSQL database
   - Initialize database schema
   - Start all microservices

4. **Start the frontend:**
   
   Open a new terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Upload Service: http://localhost:8001/health
   - Emotion Service: http://localhost:8002/health
   - Timeline Service: http://localhost:8003/health
   - Search Service: http://localhost:8004/health
   - Admin Service: http://localhost:8005/health

### Production Deployment (DigitalOcean App Platform)

The application is configured for deployment on DigitalOcean App Platform using the `.do/app.yaml` specification file.

**Deployment Steps:**

1. **Push code to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect repository to DigitalOcean:**
   - Go to DigitalOcean App Platform
   - Create new app from GitHub repository
   - Select `boyeaalhagie/AI-Personal-Memory-Bank`
   - DigitalOcean will detect the `app.yaml` file automatically

3. **Configure environment variables in DigitalOcean dashboard:**
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `CORS_ORIGINS` - Your frontend URL (e.g., `https://ai-memory-bank-jhli6.ondigitalocean.app`)

4. **Deploy:**
   - DigitalOcean will automatically build and deploy all services
   - Each service runs in its own container
   - Managed PostgreSQL database is automatically provisioned

**Note:** To prevent automatic deployment on push, set `deploy_on_push: false` in `.do/app.yaml` or disable auto-deploy in the DigitalOcean dashboard.

## API Documentation

All services expose RESTful APIs. In production, services are accessible via:
- Base URL: `https://ai-memory-bank-jhli6.ondigitalocean.app`
- Upload Service: `/api/upload`
- Emotion Service: `/api/emotion`
- Timeline Service: `/api/timeline`
- Search Service: `/api/search`
- Admin Service: `/api/admin`

### Upload Service

#### Upload Photo
```http
POST /api/upload/photos?user_id={user_id}
Content-Type: multipart/form-data
```

**Request:**
- `user_id` (query parameter, required): User identifier
- `file` (form-data, required): Image file (JPEG, PNG, etc.)

**Response:**
```json
{
  "id": 1,
  "user_id": "default",
  "file_path": "uploads/4de56ea8-7978-412a-9be2-7cb2ada8ee0a.JPEG",
  "uploaded_at": "2024-12-10T18:00:00"
}
```

**Example:**
```bash
curl -X POST "https://ai-memory-bank-jhli6.ondigitalocean.app/api/upload/photos?user_id=default" \
  -F "file=@/path/to/photo.jpg"
```

#### Get All Photos
```http
GET /api/upload/photos?user_id={user_id}
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": "default",
    "file_path": "uploads/photo.jpg",
    "uploaded_at": "2024-12-10T18:00:00",
    "caption": "A beautiful sunset over the ocean",
    "emotion": "calm",
    "emotion_confidence": 0.95,
    "emotions_json": "[\"calm\", \"peaceful\"]",
    "emotion_emojis_json": "{\"calm\": \"😌\", \"peaceful\": \"🕊️\"}"
  }
]
```

#### Get Image File
```http
GET /api/upload/uploads/{filename}
```

Returns the image file directly.

### Emotion Service

#### Tag Photo (Internal)
```http
POST /api/emotion/tag-photo
Content-Type: application/json
```

**Request:**
```json
{
  "photo_id": 1,
  "file_path": "uploads/photo.jpg"
}
```

**Response:**
```json
{
  "photo_id": 1,
  "caption": "A beautiful sunset over the ocean",
  "emotion": "calm",
  "emotions": ["calm", "peaceful"],
  "emotion_emojis": {
    "calm": "😌",
    "peaceful": "🕊️"
  },
  "confidence": 0.95
}
```

**Note:** This endpoint is typically called internally by the upload service after a photo is uploaded.

### Timeline Service

#### Get Timeline
```http
GET /api/timeline/timeline?user_id={user_id}&bucket={bucket}
```

**Query Parameters:**
- `user_id` (required): User identifier
- `bucket` (optional): Time aggregation period - `month`, `week`, or `day` (default: `month`)

**Response:**
```json
{
  "user_id": "default",
  "data": [
    {
      "period": "2024-12",
      "emotions": {
        "happy": 15,
        "calm": 8,
        "excited": 5
      }
    },
    {
      "period": "2024-11",
      "emotions": {
        "happy": 12,
        "contemplative": 3,
        "neutral": 10
      }
    }
  ]
}
```

**Example:**
```bash
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/timeline/timeline?user_id=default&bucket=month"
```

### Search Service

#### Search Photos
```http
GET /api/search/search?user_id={user_id}&emotion={emotion}&from_date={YYYY-MM-DD}&to_date={YYYY-MM-DD}
```

**Query Parameters:**
- `user_id` (optional): Filter by user
- `emotion` (optional): Filter by emotion (e.g., "happy", "calm", "contemplative")
- `from_date` (optional): Start date in YYYY-MM-DD format
- `to_date` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "results": [
    {
      "photo_id": 1,
      "emotion": "happy",
      "emotions": ["happy", "joyful"],
      "emotion_emojis": {
        "happy": "😊",
        "joyful": "😄"
      },
      "caption": "Celebrating with friends",
      "file_path": "uploads/photo.jpg",
      "uploaded_at": "2024-12-10T18:00:00",
      "emotion_confidence": 0.92
    }
  ]
}
```

**Example:**
```bash
# Search for happy photos in December 2024
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/search/search?user_id=default&emotion=happy&from_date=2024-12-01&to_date=2024-12-31"
```

### Admin Service

#### Get Usage Statistics
```http
GET /api/admin/admin/usage?days={days}
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response:**
```json
{
  "summary": {
    "total_requests": 1250,
    "by_endpoint": {
      "GET /photos": 450,
      "POST /photos": 200,
      "GET /search": 300,
      "GET /timeline": 300
    },
    "by_service": {
      "upload-service": 650,
      "search-service": 300,
      "timeline-service": 300
    }
  },
  "period_start": "2024-11-10T00:00:00",
  "period_end": "2024-12-10T00:00:00"
}
```

**Example:**
```bash
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/admin/admin/usage?days=30"
```

### Health Check

All services provide a health check endpoint:
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "upload-service"
}
```

## Use Cases

### Use Case 1: Upload and Analyze a Photo

1. **Upload a photo:**
   ```bash
   curl -X POST "https://ai-memory-bank-jhli6.ondigitalocean.app/api/upload/photos?user_id=default" \
     -F "file=@vacation.jpg"
   ```

2. **The system automatically:**
   - Stores the photo
   - Calls the emotion service to analyze it
   - Tags it with emotions and generates a caption
   - Updates the database

3. **View the result:**
   ```bash
   curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/upload/photos?user_id=default"
   ```

### Use Case 2: Find All Happy Photos from December

```bash
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/search/search?user_id=default&emotion=happy&from_date=2024-12-01&to_date=2024-12-31"
```

### Use Case 3: View Emotional Timeline

```bash
# Get monthly emotional breakdown
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/timeline/timeline?user_id=default&bucket=month"

# Get weekly emotional breakdown
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/timeline/timeline?user_id=default&bucket=week"
```

### Use Case 4: Monitor System Usage

```bash
# Get usage statistics for the last 7 days
curl "https://ai-memory-bank-jhli6.ondigitalocean.app/api/admin/admin/usage?days=7"
```

## Database Schema

The system uses PostgreSQL with the following main tables:

### photos
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (TEXT)
- `file_path` (TEXT)
- `uploaded_at` (TIMESTAMP)
- `caption` (TEXT, nullable)
- `emotion` (TEXT, nullable) - Primary emotion
- `emotion_confidence` (FLOAT, nullable)
- `emotions_json` (TEXT, nullable) - JSON array of all detected emotions
- `emotion_emojis_json` (TEXT, nullable) - JSON object mapping emotions to emojis

### usage_logs
- `id` (INTEGER, PRIMARY KEY)
- `service_name` (TEXT)
- `endpoint` (TEXT)
- `user_id` (TEXT, nullable)
- `timestamp` (TIMESTAMP)

## Project Structure

```
.
├── upload-service/      # Photo upload microservice
│   ├── main.py         # FastAPI application
│   ├── Dockerfile      # Container definition
│   └── requirements.txt
├── emotion-service/    # AI emotion tagging microservice
│   ├── main.py         # OpenAI Vision API integration
│   ├── Dockerfile
│   └── requirements.txt
├── timeline-service/   # Timeline aggregation microservice
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── search-service/     # Photo search microservice
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── admin-service/      # Analytics microservice
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   └── services/   # API service layer
│   ├── Dockerfile
│   └── package.json
├── shared/             # Shared database utilities
│   └── db_utils.py
├── .do/                # DigitalOcean deployment config
│   └── app.yaml        # App Platform specification
├── docker-compose.yml  # Local development orchestration
└── README.md           # This file
```

## Development

### Running Individual Services Locally

Each service can be run independently for development:

```bash
cd upload-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Environment Variables

Key environment variables:

- **Database:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **OpenAI:** `OPENAI_API_KEY`
- **CORS:** `CORS_ORIGINS` (comma-separated list of allowed origins)
- **Service URLs:** `EMOTION_SERVICE_URL` (for upload-service to call emotion-service)

## Troubleshooting

1. **Services not starting:** Check logs with `docker-compose logs <service-name>`
2. **Database connection errors:** Ensure database is healthy before services start
3. **OpenAI API errors:** Verify `OPENAI_API_KEY` is set correctly
4. **CORS errors:** Check `CORS_ORIGINS` environment variable includes your frontend URL
5. **Image upload fails:** Verify upload directory has write permissions

## License

This project is for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
