# AI Emotional Memory Bank - Frontend

React + TypeScript frontend for the AI Emotional Memory Bank application.

## Features

- 📤 **Photo Upload** - Upload photos with automatic emotion tagging
- 🖼️ **Photo Gallery** - Browse all your photos with emotion labels
- 📊 **Timeline** - Visualize your emotional journey over time
- 🔍 **Search** - Find photos by emotion, date range, or user
- 📈 **Admin Analytics** - View usage statistics (admin only)

## Prerequisites

- Node.js 18+ and npm
- Backend services running (see main README.md)

## Installation

```bash
cd frontend
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Configuration

The frontend connects to backend services at these URLs (configured in `src/services/api.ts`):

- Upload Service: `http://localhost:8001`
- Emotion Service: `http://localhost:8002`
- Timeline Service: `http://localhost:8003`
- Search Service: `http://localhost:8004`
- Admin Service: `http://localhost:8005`

To change these URLs, edit `src/services/api.ts`.

## Usage

1. **Set User ID**: Enter a user ID in the header (default: "user1")
2. **Upload Photos**: Go to the Upload tab and select an image file
3. **View Gallery**: See all your photos with emotion labels
4. **Explore Timeline**: View your emotional journey over time
5. **Search Photos**: Filter photos by emotion or date range
6. **View Analytics**: Login as admin to see usage statistics

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── PhotoUpload.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── Timeline.tsx
│   │   ├── Search.tsx
│   │   └── AdminAnalytics.tsx
│   ├── services/          # API service layer
│   │   └── api.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── package.json
└── vite.config.ts
```

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure:
1. Backend services are running
2. Backend services allow requests from `http://localhost:5173`
3. You can add CORS middleware to backend services if needed

### Images Not Loading

Images are served by the Upload Service. Ensure:
1. Upload Service is running on port 8001
2. Photos have been uploaded successfully
3. Check browser console for 404 errors

### API Connection Issues

1. Verify all backend services are running: `docker-compose ps`
2. Check service health: Visit `http://localhost:8001/health` etc.
3. Check browser network tab for failed requests
