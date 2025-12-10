# Frontend Integration Guide

This document describes how the frontend integrates with all backend microservices.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Frontend (Port 5173)      │
│  ┌───────────────────────────────────┐  │
│  │      API Service Layer            │  │
│  │    (src/services/api.ts)          │  │
│  └───────┬───────────────────────────┘  │
└──────────┼──────────────────────────────┘
           │ HTTP/REST
           │
    ┌──────┴──────────────────────┐
    │   Backend Microservices      │
    ├──────────┬──────────┬───────┤
    │ Upload   │ Timeline │ Search│
    │ Emotion  │ Admin    │       │
    └──────────┴──────────┴───────┘
```

## Service Integration

### 1. Upload Service Integration

**Component**: `PhotoUpload.tsx`

**API Calls**:
- `POST /photos?user_id={userId}` - Upload photo
- `GET /photos?user_id={userId}` - Get all photos

**Features**:
- File selection with preview
- Upload progress indication
- Automatic refresh of gallery after upload
- Error handling and user feedback

### 2. Photo Gallery Integration

**Component**: `PhotoGallery.tsx`

**API Calls**:
- `GET /photos?user_id={userId}` - Fetch all photos
- `GET /uploads/{filename}` - Serve images

**Features**:
- Grid layout with responsive design
- Emotion badges with color coding
- Caption display
- Upload date and confidence scores
- Auto-refresh on new uploads

### 3. Timeline Service Integration

**Component**: `Timeline.tsx`

**API Calls**:
- `GET /timeline?user_id={userId}&bucket={month|week|day}` - Get timeline data

**Features**:
- Interactive time bucket selector (month/week/day)
- Visual bar charts showing emotion distribution
- Color-coded emotion segments
- Period-based aggregation
- Empty state handling

### 4. Search Service Integration

**Component**: `Search.tsx`

**API Calls**:
- `GET /search?user_id={userId}&emotion={emotion}&from={date}&to={date}` - Search photos

**Features**:
- Multi-filter search (emotion, date range)
- Real-time search results
- Grid display of results
- Clear filters functionality
- Empty state messaging

### 5. Admin Analytics Integration

**Component**: `AdminAnalytics.tsx`

**API Calls**:
- `POST /admin/login` - Authenticate admin
- `GET /admin/usage?days={days}` - Get usage statistics (requires JWT)

**Features**:
- Secure login with JWT tokens
- Usage statistics by service and endpoint
- Configurable time period
- Logout functionality
- Protected routes

## API Service Layer

All API communication is centralized in `src/services/api.ts`:

```typescript
// Example usage
import { uploadService, timelineService } from './services/api';

// Upload photo
const photo = await uploadService.uploadPhoto(userId, file);

// Get timeline
const timeline = await timelineService.getTimeline(userId, 'month');
```

### Type Safety

All API responses are typed with TypeScript interfaces:
- `Photo` - Photo data structure
- `TimelineResponse` - Timeline data structure
- `AnalyticsResponse` - Analytics data structure

## State Management

The app uses React's built-in state management:
- Component-level state for UI state
- Props for data passing
- `useEffect` for data fetching
- Refresh triggers for data synchronization

## Error Handling

All components include:
- Loading states
- Error messages
- Empty states
- User-friendly error messages

## CORS Configuration

All backend services are configured with CORS middleware to allow frontend requests:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Image Serving

Images are served by the Upload Service:
- Endpoint: `GET /uploads/{filename}`
- Automatic MIME type detection
- Proper error handling for missing images

## Authentication Flow

Admin authentication uses JWT tokens:

1. User submits credentials via `POST /admin/login`
2. Backend validates and returns JWT token
3. Frontend stores token in component state
4. Token included in `Authorization: Bearer {token}` header for protected routes
5. Token validated on each request

## Data Flow Examples

### Photo Upload Flow

```
User selects file
  ↓
PhotoUpload component
  ↓
uploadService.uploadPhoto()
  ↓
POST /photos (Upload Service)
  ↓
Upload Service calls Emotion Service
  ↓
Photo processed and stored
  ↓
onUploadSuccess() callback
  ↓
Gallery and Timeline refresh
```

### Timeline Display Flow

```
User selects Timeline tab
  ↓
Timeline component mounts
  ↓
useEffect triggers
  ↓
timelineService.getTimeline()
  ↓
GET /timeline (Timeline Service)
  ↓
Data aggregated from database
  ↓
Timeline rendered with charts
```

## Testing the Integration

1. **Start Backend Services:**
   ```bash
   docker-compose up
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Each Feature:**
   - Upload a photo and verify it appears in gallery
   - Check timeline updates after uploads
   - Search for photos by emotion
   - Login as admin and view analytics

## Troubleshooting

### Images Not Loading
- Check Upload Service is running on port 8001
- Verify image files exist in `/app/uploads` volume
- Check browser console for 404 errors
- Ensure CORS is properly configured

### API Calls Failing
- Verify all backend services are running
- Check service health endpoints
- Review browser network tab for errors
- Ensure correct API URLs in `api.ts`

### CORS Errors
- Verify CORS middleware is added to all services
- Check `allow_origins` configuration
- Ensure frontend URL matches CORS settings

## Future Enhancements

Potential improvements:
- Add React Query for better data fetching
- Implement proper authentication for all users
- Add image optimization and thumbnails
- Implement real-time updates with WebSockets
- Add offline support with service workers
- Implement proper error boundaries
- Add unit and integration tests

