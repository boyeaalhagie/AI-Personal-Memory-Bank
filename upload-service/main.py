"""
Photo Upload Service
Accepts image uploads, stores them, and triggers emotion tagging
"""
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys

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

from db_utils import get_db_cursor, log_usage, get_db_connection

app = FastAPI(title="Photo Upload Service")

# Initialize database schema on startup
@app.on_event("startup")
async def init_db():
    """Initialize database schema if tables don't exist"""
    import os
    print(f"🔍 Database connection info:")
    print(f"   DB_HOST: {os.getenv('DB_HOST', 'NOT SET')}")
    print(f"   DB_PORT: {os.getenv('DB_PORT', 'NOT SET')}")
    print(f"   DB_NAME: {os.getenv('DB_NAME', 'NOT SET')}")
    print(f"   DB_USER: {os.getenv('DB_USER', 'NOT SET')}")
    print(f"   DB_PASSWORD: {'SET' if os.getenv('DB_PASSWORD') else 'NOT SET'}")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check what database we're connected to
            cursor.execute("SELECT current_database(), current_user")
            db_name, user = cursor.fetchone()
            print(f"✓ Connected to database: {db_name} as user: {user}")
            
            # Check if tables exist
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            """)
            existing_tables = cursor.fetchall()
            print(f"   Existing tables: {[t[0] for t in existing_tables]}")
            
            # Grant permissions on public schema (may fail if user doesn't have permission, that's ok)
            try:
                cursor.execute("GRANT ALL ON SCHEMA public TO CURRENT_USER")
                cursor.execute("GRANT CREATE ON SCHEMA public TO CURRENT_USER")
            except Exception:
                pass  # User may not have permission to grant, that's ok
            
            # Create photos table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS photos (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    file_path TEXT NOT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    caption TEXT,
                    emotion VARCHAR(50),
                    emotion_confidence FLOAT,
                    emotions_json TEXT,
                    emotion_emojis_json TEXT
                )
            """)
            
            # Create usage_logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id SERIAL PRIMARY KEY,
                    service_name VARCHAR(100) NOT NULL,
                    endpoint VARCHAR(255) NOT NULL,
                    user_id VARCHAR(255),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_emotion ON photos(emotion)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_usage_logs_service ON usage_logs(service_name)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp)")
            
            # Add emotion_emojis_json column if it doesn't exist
            try:
                cursor.execute("ALTER TABLE photos ADD COLUMN emotion_emojis_json TEXT")
            except Exception:
                pass  # Column already exists
            
            conn.commit()
            cursor.close()
            print("✓ Database schema initialized")
    except Exception as e:
        print(f"⚠ Warning: Could not initialize database schema: {e}")
        print("⚠ You may need to manually run the schema SQL in the DigitalOcean database console")
        # Don't fail startup if schema already exists

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - use local storage
# In Docker, use /app/uploads (volume mount), otherwise use project root
if Path("/app/uploads").exists():
    UPLOAD_DIR = Path("/app/uploads")
else:
    project_root = Path(__file__).parent.parent
    UPLOAD_DIR = project_root / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EMOTION_SERVICE_URL = os.getenv("EMOTION_SERVICE_URL", "http://localhost:8002")


class PhotoResponse(BaseModel):
    id: int
    user_id: str
    file_path: str
    uploaded_at: str
    caption: Optional[str] = None
    emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None


@app.post("/photos")
async def upload_photo(
    background_tasks: BackgroundTasks,
    user_id: str = Query(..., description="User ID"),
    file: UploadFile = File(..., description="Image file to upload")
):
    """
    Upload a photo and trigger emotion tagging
    """
    log_usage("upload-service", "POST /photos", user_id)
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix or ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Store relative path for database (use relative path for local storage)
        relative_path = f"uploads/{unique_filename}"
        
        # Insert into database
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO photos (user_id, file_path, uploaded_at)
                VALUES (%s, %s, %s)
                RETURNING id, uploaded_at
                """,
                (user_id, relative_path, datetime.now())
            )
            result = cursor.fetchone()
            photo_id = result['id']
            uploaded_at = result['uploaded_at'].isoformat()
        
        # Call Emotion Tagging Service asynchronously (fire and forget)
        async def tag_photo_async():
            try:
                print(f"Calling emotion service at {EMOTION_SERVICE_URL}/tag-photo for photo {photo_id}")
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{EMOTION_SERVICE_URL}/tag-photo",
                        json={
                            "photo_id": photo_id,
                            "file_path": relative_path  # Use relative path, not absolute
                        }
                    )
                    if response.status_code == 200:
                        result = response.json()
                        print(f"✓ Successfully tagged photo {photo_id}: emotion={result.get('emotion')}, caption={result.get('caption', '')[:50]}")
                    else:
                        print(f"✗ Emotion service returned status {response.status_code}: {response.text}")
            except Exception as e:
                print(f"✗ Error calling emotion service: {e}")
                import traceback
                traceback.print_exc()
        
        # Add emotion tagging as background task
        background_tasks.add_task(tag_photo_async)
        
        # Return immediately with photo info
        return PhotoResponse(
            id=photo_id,
            user_id=user_id,
            file_path=relative_path,
            uploaded_at=uploaded_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading photo: {str(e)}")


@app.get("/photos")
async def get_photos(user_id: str = Query(..., description="User ID")):
    """
    Get all photos for a user
    """
    log_usage("upload-service", "GET /photos", user_id)
    
    try:
        with get_db_cursor() as cursor:
            # First, try to add emotions_json column if it doesn't exist
            try:
                cursor.execute("ALTER TABLE photos ADD COLUMN IF NOT EXISTS emotions_json TEXT")
            except Exception as e:
                print(f"Note: Could not add emotions_json column (may already exist): {e}")
            
            # Try to select with emotions_json and emotion_emojis_json, fallback if columns don't exist
            try:
                cursor.execute(
                    """
                    SELECT id, user_id, file_path, uploaded_at, caption, emotion, emotion_confidence, emotions_json, emotion_emojis_json
                    FROM photos
                    WHERE user_id = %s
                    ORDER BY uploaded_at DESC
                    """,
                    (user_id,)
                )
            except Exception as e:
                # Fallback if columns don't exist yet
                print(f"Note: Some columns not found, using fallback query: {e}")
                try:
                    cursor.execute(
                        """
                        SELECT id, user_id, file_path, uploaded_at, caption, emotion, emotion_confidence, emotions_json
                        FROM photos
                        WHERE user_id = %s
                        ORDER BY uploaded_at DESC
                        """,
                        (user_id,)
                    )
                except Exception as e2:
                    # Final fallback
                    print(f"Note: Using minimal query: {e2}")
                    cursor.execute(
                        """
                        SELECT id, user_id, file_path, uploaded_at, caption, emotion, emotion_confidence
                        FROM photos
                        WHERE user_id = %s
                        ORDER BY uploaded_at DESC
                        """,
                        (user_id,)
                    )
            
            photos = cursor.fetchall()
            # Parse emotions_json if it exists
            import json
            result_photos = []
            for photo in photos:
                photo_dict = dict(photo)
                # Parse emotions_json if present
                if photo_dict.get('emotions_json'):
                    try:
                        photo_dict['emotions'] = json.loads(photo_dict['emotions_json'])
                    except:
                        photo_dict['emotions'] = [photo_dict.get('emotion', 'neutral')] if photo_dict.get('emotion') else []
                else:
                    # Backward compatibility: if no emotions_json, use emotion field
                    photo_dict['emotions'] = [photo_dict.get('emotion')] if photo_dict.get('emotion') else []
                
                # Parse emotion_emojis_json if present
                if photo_dict.get('emotion_emojis_json'):
                    try:
                        photo_dict['emotion_emojis'] = json.loads(photo_dict['emotion_emojis_json'])
                    except:
                        photo_dict['emotion_emojis'] = {}
                else:
                    photo_dict['emotion_emojis'] = {}
                
                result_photos.append(photo_dict)
            return {"photos": result_photos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching photos: {str(e)}")


@app.get("/uploads/{filename:path}")
async def serve_image(filename: str):
    """
    Serve uploaded images
    """
    import mimetypes
    
    file_path = UPLOAD_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/jpeg"  # Default fallback
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(file_path),
        media_type=mime_type
    )


@app.get("/emotions")
async def get_emotions():
    """
    Get all distinct emotions from the database
    Returns both primary emotions and emotions from emotions_json
    Includes emoji mapping for each emotion
    """
    log_usage("upload-service", "GET /emotions", None)
    
    # Emotion to emoji mapping
    emotion_emoji_map = {
        'happy': '😊',
        'sad': '😢',
        'calm': '😌',
        'stressed': '😰',
        'excited': '🎉',
        'neutral': '😐',
        'angry': '😠',
        'anxious': '😟',
        'content': '😊',
        'disappointed': '😞',
        'energetic': '⚡',
        'frustrated': '😤',
        'grateful': '🙏',
        'joyful': '😄',
        'lonely': '😔',
        'peaceful': '☮️',
        'proud': '😎',
        'relaxed': '😌',
        'surprised': '😲',
        'tired': '😴',
        'worried': '😟',
    }
    
    try:
        with get_db_cursor() as cursor:
            # Get distinct primary emotions
            cursor.execute("SELECT DISTINCT emotion FROM photos WHERE emotion IS NOT NULL")
            primary_emotions = [row['emotion'] for row in cursor.fetchall() if row['emotion']]
            
            # Get distinct emotions from emotions_json
            import json
            cursor.execute("SELECT DISTINCT emotions_json FROM photos WHERE emotions_json IS NOT NULL")
            emotions_from_json = []
            for row in cursor.fetchall():
                try:
                    emotions_list = json.loads(row['emotions_json'])
                    emotions_from_json.extend(emotions_list)
                except:
                    pass
            
            # Combine and deduplicate
            all_emotions = list(set(primary_emotions + emotions_from_json))
            # Sort alphabetically
            all_emotions.sort()
            
            # Build response with emoji data
            emotions_with_emoji = [
                {
                    "name": emotion,
                    "emoji": emotion_emoji_map.get(emotion.lower(), '😐')
                }
                for emotion in all_emotions
            ]
            
            return {
                "emotions": all_emotions,
                "emotions_with_emoji": emotions_with_emoji,
                "emoji_map": emotion_emoji_map
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching emotions: {str(e)}")


@app.delete("/photos/{photo_id}")
async def delete_photo(photo_id: int, user_id: str = Query(..., description="User ID")):
    """
    Delete a photo by ID
    """
    log_usage("upload-service", f"DELETE /photos/{photo_id}", user_id)
    
    try:
        with get_db_cursor() as cursor:
            # First, get the photo to verify ownership and get file path
            cursor.execute(
                """
                SELECT id, user_id, file_path
                FROM photos
                WHERE id = %s AND user_id = %s
                """,
                (photo_id, user_id)
            )
            photo = cursor.fetchone()
            
            if not photo:
                raise HTTPException(status_code=404, detail="Photo not found or access denied")
            
            # Delete from database
            cursor.execute(
                """
                DELETE FROM photos
                WHERE id = %s AND user_id = %s
                """,
                (photo_id, user_id)
            )
            
            # Try to delete the file (but don't fail if file doesn't exist)
            try:
                file_path = UPLOAD_DIR / Path(photo['file_path']).name
                if file_path.exists():
                    file_path.unlink()
                    print(f"Deleted file: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete file {file_path}: {e}")
            
            return {"message": "Photo deleted successfully", "photo_id": photo_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting photo: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "upload-service"}

