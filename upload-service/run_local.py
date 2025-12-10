"""
Run upload-service locally (outside Docker)
"""
import os
import sys
from pathlib import Path

# Add shared directory to path
project_root = Path(__file__).parent.parent
shared_path = project_root / "shared"
sys.path.insert(0, str(shared_path))

# Set environment variables for local development
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "memorybank")
os.environ.setdefault("DB_USER", "user")
os.environ.setdefault("DB_PASSWORD", "pass")
os.environ.setdefault("EMOTION_SERVICE_URL", "http://localhost:8002")

# Create uploads directory if it doesn't exist
uploads_path = project_root / "uploads"
if not uploads_path.exists():
    uploads_path.mkdir(parents=True, exist_ok=True)
    print(f"Created uploads directory at {uploads_path}")

# Import and run the app
if __name__ == "__main__":
    import uvicorn
    from main import app
    
    print("Starting upload-service locally...")
    print(f"Database: {os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}")
    print(f"Uploads path: {uploads_path}")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )



