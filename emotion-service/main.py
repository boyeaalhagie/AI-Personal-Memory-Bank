"""
Emotion Tagging Service
Uses OpenAI Vision API to generate captions and classify emotions from photos
"""
import os
import sys
import base64
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from openai import OpenAI

# Add shared directory to path (works for both Docker and local)
shared_paths = [
    '/app/shared',  # Docker path
    str(Path(__file__).parent.parent / 'shared'),  # Local path
]
for path in shared_paths:
    if Path(path).exists():
        sys.path.insert(0, path)
        break

from db_utils import get_db_cursor, log_usage

app = FastAPI(title="Emotion Tagging Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = None

# Emotion categories
EMOTION_CATEGORIES = ["happy", "sad", "calm", "stressed", "excited", "neutral"]


class TagPhotoRequest(BaseModel):
    photo_id: int
    file_path: str


class TagPhotoResponse(BaseModel):
    emotion: str  # Primary emotion (for backward compatibility)
    emotions: list[str]  # List of all detected emotions
    emotion_emojis: dict[str, str]  # Map of emotion name to emoji
    caption: str
    emotion_confidence: Optional[float] = None


def initialize_openai():
    """Initialize OpenAI client"""
    global openai_client
    
    # Get API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key or len(api_key) < 20:
        print("✗ Error: Invalid or missing OpenAI API key")
        openai_client = None
        return False
    
    print(f"Initializing OpenAI client with API key: {api_key[:20]}...")
    try:
        # Initialize with just the API key - let it use defaults for other parameters
        client = OpenAI(api_key=api_key)
        openai_client = client
        print(f"✓ OpenAI client initialized successfully! Client object: {type(openai_client)}")
        print(f"✓ Global openai_client is now: {openai_client is not None}")
        return True
    except Exception as e:
        print(f"✗ Error initializing OpenAI client: {e}")
        print(f"   Error type: {type(e).__name__}")
        if "api key" in str(e).lower() or "authentication" in str(e).lower():
            print("   ⚠ This might be an invalid or expired API key.")
        import traceback
        traceback.print_exc()
        openai_client = None
        return False


def encode_image(image_path: str) -> str:
    """Encode image to base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def analyze_image_with_openai(image_path: str) -> tuple[str, str, list[str], dict[str, str], float]:
    """
    Use OpenAI Vision API to analyze image and extract caption and emotions
    Returns: (caption, primary_emotion, emotions_list, emotion_emojis, confidence)
    """
    try:
        if openai_client is None:
            raise ValueError("OpenAI client not initialized")
        
        # Encode image
        base64_image = encode_image(image_path)
        
        # Prepare the prompt - asking for comprehensive emotion analysis
        prompt = """Analyze this image comprehensively and identify ALL emotions present. Look at:
- Facial expressions of people
- Body language and postures
- Scene atmosphere and mood
- Color tones and lighting
- Context and setting
- Overall emotional resonance

Provide:
1. A brief, descriptive caption (1-2 sentences) describing what's in the image
2. A comprehensive list of ALL emotions you detect (can be multiple emotions, be specific)
   Examples: joyful, melancholic, serene, anxious, euphoric, nostalgic, contemplative, energetic, peaceful, tense, playful, somber, romantic, dramatic, etc.
   Don't restrict yourself - use any emotion words that accurately describe what you see
3. For EACH emotion you detect, provide the most appropriate emoji that represents that emotion
4. The PRIMARY/dominant emotion from your list (the most prominent one)
5. A confidence score (0.0 to 1.0) for the primary emotion classification

Respond in this exact format:
CAPTION: [your caption here]
EMOTIONS: [comma-separated list of all detected emotions, e.g., "joyful, energetic, carefree, warm"]
EMOTION_EMOJIS: [comma-separated list of emojis corresponding to each emotion in the same order, e.g., "😄,⚡,😊,❤️"]
PRIMARY_EMOTION: [the most prominent emotion from your list]
CONFIDENCE: [number between 0.0 and 1.0]

Important: The number of emojis must match the number of emotions, and they must be in the same order."""

        # Call OpenAI Vision API
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.4
        )
        
        # Parse response
        response_text = response.choices[0].message.content
        if not response_text:
            print("Warning: Empty response from OpenAI")
            return "a photo", "neutral", ["neutral"], {"neutral": "😐"}, 0.5
        
        # Extract caption, emotions, emojis, primary emotion, and confidence
        caption = "a photo"
        primary_emotion = "neutral"
        emotions_list = ["neutral"]
        emotion_emojis = {"neutral": "😐"}
        confidence = 0.5
        
        lines = response_text.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('CAPTION:'):
                caption = line.replace('CAPTION:', '').strip()
            elif line.startswith('EMOTIONS:'):
                # Parse comma-separated list of emotions
                emotions_str = line.replace('EMOTIONS:', '').strip()
                # Split by comma and clean up
                emotions_list = [e.strip().lower() for e in emotions_str.split(',') if e.strip()]
                # Remove quotes if present
                emotions_list = [e.strip('"\'') for e in emotions_list]
                if not emotions_list:
                    emotions_list = ["neutral"]
            elif line.startswith('EMOTION_EMOJIS:'):
                # Parse comma-separated list of emojis
                emojis_str = line.replace('EMOTION_EMOJIS:', '').strip()
                # Split by comma and clean up
                emojis_list = [e.strip() for e in emojis_str.split(',') if e.strip()]
                # Remove quotes if present
                emojis_list = [e.strip('"\'') for e in emojis_list]
                
                # Create emotion to emoji mapping
                emotion_emojis = {}
                for i, emotion in enumerate(emotions_list):
                    if i < len(emojis_list):
                        emotion_emojis[emotion] = emojis_list[i]
                    else:
                        # Fallback emoji if not enough emojis provided
                        emotion_emojis[emotion] = "😐"
            elif line.startswith('PRIMARY_EMOTION:'):
                primary_emotion_raw = line.replace('PRIMARY_EMOTION:', '').strip().lower().strip('"\'')
                primary_emotion = primary_emotion_raw
            elif line.startswith('CONFIDENCE:'):
                try:
                    confidence_str = line.replace('CONFIDENCE:', '').strip()
                    confidence = float(confidence_str)
                    # Ensure confidence is between 0 and 1
                    confidence = max(0.0, min(1.0, confidence))
                except ValueError:
                    confidence = 0.5
        
        # If no emotions were parsed but we have primary emotion, use that
        if emotions_list == ["neutral"] and primary_emotion != "neutral":
            emotions_list = [primary_emotion]
        # Ensure primary emotion is in the list
        if primary_emotion not in emotions_list and primary_emotion != "neutral":
            emotions_list.insert(0, primary_emotion)
        
        # Ensure all emotions have emojis (add fallback if missing)
        for emotion in emotions_list:
            if emotion not in emotion_emojis:
                emotion_emojis[emotion] = "😐"
        
        return caption, primary_emotion, emotions_list, emotion_emojis, confidence
        
    except Exception as e:
        print(f"Error analyzing image with OpenAI: {e}")
        import traceback
        traceback.print_exc()
        # Fallback values
        return "a photo", "neutral", ["neutral"], {"neutral": "😐"}, 0.5


@app.on_event("startup")
async def startup_event():
    """Initialize OpenAI client when service starts"""
    print("Starting emotion-service startup...")
    try:
        initialize_openai()
        print("Emotion service ready!")
    except Exception as e:
        print(f"ERROR: Failed to initialize OpenAI: {e}")
        print("Service will start but emotion tagging will fail until API key is set")
        import traceback
        traceback.print_exc()


@app.post("/tag-photo", response_model=TagPhotoResponse)
async def tag_photo(request: TagPhotoRequest):
    """
    Generate caption and emotion for a photo using OpenAI Vision API
    """
    log_usage("emotion-service", "POST /tag-photo", None)
    print(f"\n[EMOTION-SERVICE] Processing photo_id={request.photo_id}, file_path={request.file_path}")
    
    # Try to initialize OpenAI if not already initialized
    global openai_client
    if openai_client is None:
        print("[EMOTION-SERVICE] OpenAI client not initialized, attempting to initialize now...")
        if not initialize_openai():
            raise HTTPException(
                status_code=500, 
                detail="OpenAI client not initialized. Check API key and service logs."
            )
    
    try:
        # Handle local file paths
        # The file_path from request might be like "uploads/filename.png" or "/uploads/filename.png"
        file_path_str = request.file_path.lstrip('/')  # Remove leading slash
        filename = Path(file_path_str).name
        
        # Try different path locations
        possible_paths = [
            Path("/app/uploads") / filename,  # Docker volume mount location
            Path("/app") / file_path_str,  # Full path in Docker
            Path(file_path_str),  # As provided
            Path(request.file_path),  # Original path
        ]
        
        # Also try project root paths (for local development)
        project_root = Path(__file__).parent.parent
        possible_paths.extend([
            project_root / "uploads" / filename,
            project_root / file_path_str,
        ])
        
        file_path = None
        for path in possible_paths:
            if path.exists() and path.is_file():
                file_path = path
                print(f"[EMOTION-SERVICE] Found file at: {file_path}")
                break
        
        # If still not found, try to get from upload-service
        if file_path is None or not file_path.exists():
                import requests
                try:
                    # Try to get the file from upload-service
                    # In Docker, use service name; for local, use localhost
                    upload_path = request.file_path.lstrip('/')
                    # Try Docker service name first, then localhost
                    upload_urls = [
                        f"http://upload-service:8000/{upload_path}",  # Docker internal network
                        f"http://localhost:8001/{upload_path}",  # Local development
                    ]
                    response = None
                    for upload_url in upload_urls:
                        try:
                            print(f"[EMOTION-SERVICE] Attempting to download from: {upload_url}")
                            response = requests.get(upload_url, timeout=10)
                            if response.status_code == 200:
                                break
                        except Exception as e:
                            print(f"[EMOTION-SERVICE] Failed to connect to {upload_url}: {e}")
                            continue
                    
                    if response is None or response.status_code != 200:
                        raise Exception(f"Could not download file from upload-service (tried {upload_urls})")
                    
                    # Save temporarily in /app/uploads (shared volume)
                    temp_path = Path("/app/uploads") / f"temp_{filename}"
                    temp_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(temp_path, 'wb') as f:
                        f.write(response.content)
                    file_path = temp_path
                    print(f"[EMOTION-SERVICE] Downloaded file from upload-service to: {file_path}")
                except Exception as e:
                    print(f"[EMOTION-SERVICE] Could not download file from upload-service: {e}")
                    import traceback
                    traceback.print_exc()
        
        if file_path is None or not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Photo file not found: {request.file_path}")
        
        # Double-check OpenAI client is initialized (already checked at top of function, but verify)
        if openai_client is None:
            print(f"[ERROR] openai_client is None when trying to process photo {request.photo_id}")
            print(f"[DEBUG] Attempting to re-initialize OpenAI client...")
            if not initialize_openai():
                raise HTTPException(status_code=500, detail="OpenAI client not initialized. Check API key and service logs.")
        
        # Analyze image with OpenAI
        caption, primary_emotion, emotions_list, emotion_emojis, confidence = analyze_image_with_openai(str(file_path))
        
        # Store emotions and emojis as JSON strings
        import json
        emotions_json = json.dumps(emotions_list)
        emotion_emojis_json = json.dumps(emotion_emojis)
        
        # Update database - try full update first, fallback if columns don't exist
        try:
            with get_db_cursor() as cursor:
                # Try full update with all columns
                cursor.execute(
                    """
                    UPDATE photos
                    SET caption = %s, emotion = %s, emotion_confidence = %s, emotions_json = %s, emotion_emojis_json = %s
                    WHERE id = %s
                    """,
                    (caption, primary_emotion, confidence, emotions_json, emotion_emojis_json, request.photo_id)
                )
        except Exception as e:
            # If full update fails (columns don't exist), try without JSON columns
            error_msg = str(e).lower()
            if 'emotions_json' in error_msg or 'emotion_emojis_json' in error_msg or 'column' in error_msg:
                print(f"Note: JSON columns not available, using fallback update: {e}")
                try:
                    with get_db_cursor() as cursor:
                        # Fallback: update only basic columns
                        cursor.execute(
                            """
                            UPDATE photos
                            SET caption = %s, emotion = %s, emotion_confidence = %s
                            WHERE id = %s
                            """,
                            (caption, primary_emotion, confidence, request.photo_id)
                        )
                except Exception as e2:
                    print(f"Error updating photo in database: {e2}")
                    raise HTTPException(status_code=500, detail=f"Error updating photo in database: {str(e2)}")
            else:
                # Some other error, re-raise it
                print(f"Error updating photo in database: {e}")
                raise HTTPException(status_code=500, detail=f"Error updating photo in database: {str(e)}")
        
        return TagPhotoResponse(
            emotion=primary_emotion,
            emotions=emotions_list,
            emotion_emojis=emotion_emojis,
            caption=caption,
            emotion_confidence=confidence
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tagging photo: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global openai_client
    # If not initialized, try to initialize now
    if openai_client is None:
        print("[HEALTH CHECK] openai_client is None, attempting to initialize...")
        initialize_openai()
    openai_ready = openai_client is not None
    return {
        "status": "healthy" if openai_ready else "degraded",
        "service": "emotion-service",
        "openai_initialized": openai_ready
    }
