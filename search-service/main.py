"""
Emotion Search Service
Search photos by emotion, date range, and user
"""
import sys
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add shared directory to path (works for both Docker and local)
from pathlib import Path
shared_paths = [
    '/app/shared',  # Docker path
    str(Path(__file__).parent.parent / 'shared'),  # Local path
]
for path in shared_paths:
    if Path(path).exists():
        sys.path.insert(0, path)
        break

from db_utils import get_db_cursor, log_usage

app = FastAPI(title="Emotion Search Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PhotoResult(BaseModel):
    photo_id: int
    emotion: str
    emotions: Optional[list[str]] = None
    emotion_emojis: Optional[dict[str, str]] = None
    caption: Optional[str] = None
    file_path: str
    uploaded_at: str
    emotion_confidence: Optional[float] = None


class SearchResponse(BaseModel):
    results: list[PhotoResult]


@app.get("/search", response_model=SearchResponse)
async def search_photos(
    user_id: Optional[str] = Query(None, description="User ID filter"),
    emotion: Optional[str] = Query(None, description="Emotion filter"),
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Search photos by emotion, user, and date range
    """
    log_usage("search-service", "GET /search", user_id)
    
    try:
        # Build query
        query = "SELECT id, user_id, file_path, uploaded_at, caption, emotion, emotion_confidence, emotions_json, emotion_emojis_json FROM photos WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = %s"
            params.append(user_id)
        
        if emotion:
            # Search in both emotion field and emotions_json
            query += " AND (emotion = %s OR emotions_json LIKE %s)"
            params.append(emotion)
            params.append(f'%{emotion}%')
        
        if from_date:
            try:
                from_dt = datetime.strptime(from_date, "%Y-%m-%d")
                query += " AND uploaded_at >= %s"
                params.append(from_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")
        
        if to_date:
            try:
                to_dt = datetime.strptime(to_date, "%Y-%m-%d")
                # Include the entire day
                to_dt = to_dt.replace(hour=23, minute=59, second=59)
                query += " AND uploaded_at <= %s"
                params.append(to_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")
        
        query += " ORDER BY uploaded_at DESC"
        
        with get_db_cursor() as cursor:
            # Try to add emotions_json and emotion_emojis_json columns if they don't exist
            try:
                cursor.execute("ALTER TABLE photos ADD COLUMN IF NOT EXISTS emotions_json TEXT")
            except Exception as e:
                print(f"Note: Could not add emotions_json column (may already exist): {e}")
            
            try:
                cursor.execute("ALTER TABLE photos ADD COLUMN IF NOT EXISTS emotion_emojis_json TEXT")
            except Exception as e:
                print(f"Note: Could not add emotion_emojis_json column (may already exist): {e}")
            
            # Try to select with emotions_json and emotion_emojis_json, fallback if columns don't exist
            try:
                # Modify query to include emotions_json and emotion_emojis_json
                if "emotions_json" not in query:
                    query = query.replace(
                        "SELECT id, user_id, file_path, uploaded_at, caption, emotion, emotion_confidence",
                        "SELECT id, user_id, file_path, uploaded_at, caption, emotion, emotion_confidence, emotions_json, emotion_emojis_json"
                    )
                cursor.execute(query, tuple(params))
            except Exception as e:
                # Fallback if columns don't exist
                if "emotion_emojis_json" in query:
                    query = query.replace(", emotion_emojis_json", "")
                if "emotions_json" in query:
                    query = query.replace(", emotions_json", "")
                if "emotions_json LIKE" in query:
                    # Remove the emotions_json search condition
                    query = query.replace(" OR emotions_json LIKE %s", "")
                    params = [p for i, p in enumerate(params) if i != len(params) - 1 or not isinstance(p, str) or emotion not in p]
                cursor.execute(query, tuple(params))
            
            photos = cursor.fetchall()
        
        import json
        results = []
        for photo in photos:
            # Parse emotions_json if present
            emotions_list = []
            if photo.get('emotions_json'):
                try:
                    emotions_list = json.loads(photo['emotions_json'])
                except:
                    pass
            # Fallback to single emotion if no emotions_json
            if not emotions_list and photo.get('emotion'):
                emotions_list = [photo['emotion']]
            
            # Parse emotion_emojis_json if present
            emotion_emojis = {}
            if photo.get('emotion_emojis_json'):
                try:
                    emotion_emojis = json.loads(photo['emotion_emojis_json'])
                except:
                    pass
            
            results.append(PhotoResult(
                photo_id=photo['id'],
                emotion=photo['emotion'] or 'neutral',
                emotions=emotions_list if emotions_list else None,
                emotion_emojis=emotion_emojis if emotion_emojis else None,
                caption=photo['caption'],
                file_path=photo['file_path'],
                uploaded_at=photo['uploaded_at'].isoformat() if photo['uploaded_at'] else None,
                emotion_confidence=photo['emotion_confidence']
            ))
        
        return SearchResponse(results=results)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching photos: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "search-service"}

