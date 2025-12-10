# Architecture Overview

## System Architecture

The AI Emotional Memory Bank is built as a microservices architecture with 5 independent services, each running in its own Docker container.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│              (Not included in this implementation)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    Microservices Layer                       │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   Upload     │   Emotion    │   Timeline   │    Search     │
│   Service    │   Service    │   Service    │   Service     │
│   :8001      │   :8002      │   :8003      │   :8004       │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬────────┘
       │              │               │              │
       │              │               │              │
       └──────────────┴───────────────┴──────────────┘
                      │
                      │ REST API
                      │
              ┌───────┴────────┐
              │   PostgreSQL   │
              │   Database     │
              │   :5432        │
              └────────────────┘
```

## Service Communication Flow

### Photo Upload Flow

```
User → Upload Service → [Store File] → [Save to DB] → Emotion Service
                                                          ↓
                                                    [Generate Caption]
                                                          ↓
                                                    [Classify Emotion]
                                                          ↓
                                                    [Update DB]
```

### Timeline Flow

```
User → Timeline Service → [Query DB] → [Aggregate by Time] → [Return JSON]
```

### Search Flow

```
User → Search Service → [Query DB with Filters] → [Return Results]
```

### Analytics Flow

```
Admin → Admin Service → [Authenticate] → [Query Usage Logs] → [Aggregate] → [Return Stats]
```

## Data Flow

### Photo Processing Pipeline

1. **Upload**: User uploads image → Upload Service stores file and creates DB record
2. **Tagging**: Upload Service calls Emotion Service → Emotion Service processes image
3. **Captioning**: Emotion Service uses BLIP model to generate caption
4. **Classification**: Emotion Service uses text classifier to determine emotion
5. **Storage**: Emotion Service updates photo record with caption and emotion

### Analytics Pipeline

1. **Logging**: Each service logs API calls to `usage_logs` table
2. **Aggregation**: Admin Service queries logs and aggregates by endpoint/service
3. **Reporting**: Admin Service returns statistics to authenticated admin users

## Technology Stack

### Services
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **ML Models**: 
  - BLIP (Image Captioning)
  - DistilRoBERTa (Emotion Classification)

### Communication
- **Inter-service**: REST APIs (HTTP)
- **Database**: PostgreSQL (psycopg2)
- **Authentication**: JWT tokens (Admin Service)

## Database Schema

### photos Table
- `id`: Primary key
- `user_id`: User identifier
- `file_path`: Path to stored image
- `uploaded_at`: Timestamp
- `caption`: AI-generated caption
- `emotion`: Classified emotion
- `emotion_confidence`: Confidence score

### usage_logs Table
- `id`: Primary key
- `service_name`: Name of the service
- `endpoint`: API endpoint called
- `user_id`: User identifier (nullable)
- `timestamp`: When the call was made

## Deployment Architecture

All services are containerized and orchestrated via Docker Compose:

- **Network**: Services communicate via Docker network
- **Volumes**: 
  - `postgres_data`: Database persistence
  - `uploads_data`: Shared photo storage
  - `model_cache`: ML model cache
- **Ports**: Each service exposed on unique port (8001-8005)

## Security Considerations

1. **Admin Authentication**: JWT-based authentication for admin endpoints
2. **File Validation**: Image type validation on upload
3. **Database**: Credentials via environment variables
4. **Network**: Services isolated in Docker network (not directly exposed)

## Scalability Considerations

- Each service can be scaled independently
- Database can be moved to managed service (RDS, etc.)
- File storage can be moved to object storage (S3, etc.)
- ML models can be moved to dedicated GPU instances
- Load balancers can be added for high-traffic services

