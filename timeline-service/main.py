"""
Timeline Service
Aggregates photos by emotion and time period
"""
import sys
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict

# Add shared directory to path
sys.path.append('/app/shared')
from db_utils import get_db_cursor, log_usage

app = FastAPI(title="Timeline Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Emotion categories
EMOTIONS = ["happy", "sad", "calm", "stressed", "excited", "neutral"]


class TimelineDataPoint(BaseModel):
    period: str
    emotions: dict[str, int] = {}  # Dynamic emotion counts


class TimelineResponse(BaseModel):
    user_id: str
    data: list[TimelineDataPoint]


def format_period(date: datetime, bucket: str) -> str:
    """Format date based on bucket type"""
    if bucket == "month":
        return date.strftime("%Y-%m")
    elif bucket == "week":
        # ISO week format
        year, week, _ = date.isocalendar()
        return f"{year}-W{week:02d}"
    elif bucket == "day":
        return date.strftime("%Y-%m-%d")
    else:
        return date.strftime("%Y-%m")


@app.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    user_id: str = Query(..., description="User ID"),
    bucket: str = Query("month", description="Time bucket: month, week, or day")
):
    """
    Get emotional timeline for a user
    """
    log_usage("timeline-service", "GET /timeline", user_id)
    
    if bucket not in ["month", "week", "day"]:
        raise HTTPException(status_code=400, detail="bucket must be 'month', 'week', or 'day'")
    
    try:
        with get_db_cursor() as cursor:
            # Try to get emotions_json column, fallback if it doesn't exist
            try:
                cursor.execute(
                    """
                    SELECT emotion, emotions_json, uploaded_at
                    FROM photos
                    WHERE user_id = %s AND (emotion IS NOT NULL OR emotions_json IS NOT NULL)
                    ORDER BY uploaded_at ASC
                    """,
                    (user_id,)
                )
            except Exception:
                # Fallback if emotions_json column doesn't exist
                cursor.execute(
                    """
                    SELECT emotion, uploaded_at
                    FROM photos
                    WHERE user_id = %s AND emotion IS NOT NULL
                    ORDER BY uploaded_at ASC
                    """,
                    (user_id,)
                )
            photos = cursor.fetchall()
        
        # Aggregate by period - use dynamic emotions dict
        period_data = defaultdict(lambda: {})
        
        import json
        for photo in photos:
            uploaded_at = photo['uploaded_at']
            period = format_period(uploaded_at, bucket)
            
            # Initialize emotions dict for this period if not exists
            if period not in period_data:
                period_data[period] = {}
            
            # Get emotions from emotions_json if available
            emotions_list = []
            if photo.get('emotions_json'):
                try:
                    emotions_list = json.loads(photo['emotions_json'])
                except:
                    pass
            
            # If no emotions from JSON, use the emotion field
            if not emotions_list and photo.get('emotion'):
                emotions_list = [photo['emotion']]
            
            # If still no emotions, default to neutral
            if not emotions_list:
                emotions_list = ['neutral']
            
            # Count each emotion (keep all emotions, don't filter)
            for emotion in emotions_list:
                emotion_lower = emotion.lower().strip() if emotion else 'neutral'
                if emotion_lower:
                    # Count all emotions dynamically
                    if emotion_lower not in period_data[period]:
                        period_data[period][emotion_lower] = 0
                    period_data[period][emotion_lower] += 1
        
        # Convert to response format
        timeline_data = []
        for period in sorted(period_data.keys()):
            data_point = TimelineDataPoint(
                period=period,
                emotions=period_data[period]
            )
            timeline_data.append(data_point)
        
        return TimelineResponse(
            user_id=user_id,
            data=timeline_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching timeline: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "timeline-service"}

