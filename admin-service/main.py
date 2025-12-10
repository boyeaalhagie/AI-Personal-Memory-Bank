"""
Admin Analytics Service
Aggregates and exposes usage metrics (admin-only)
"""
import os
import sys
from typing import Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
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

app = FastAPI(title="Admin Analytics Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UsageSummary(BaseModel):
    total_requests: int
    by_endpoint: dict[str, int]
    by_service: dict[str, int]


class AnalyticsResponse(BaseModel):
    summary: UsageSummary
    period_start: str
    period_end: str


@app.get("/admin/usage", response_model=AnalyticsResponse)
async def get_usage_stats(days: Optional[int] = 30):
    """
    Get aggregated usage statistics (public)
    """
    log_usage("admin-service", "GET /admin/usage", None)
    
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        with get_db_cursor() as cursor:
            # Get all logs in date range
            cursor.execute(
                """
                SELECT service_name, endpoint, COUNT(*) as count
                FROM usage_logs
                WHERE timestamp >= %s AND timestamp <= %s
                GROUP BY service_name, endpoint
                ORDER BY count DESC
                """,
                (start_date, end_date)
            )
            logs = cursor.fetchall()
            
            # Aggregate by endpoint
            by_endpoint = {}
            by_service = {}
            total_requests = 0
            
            for log in logs:
                endpoint_key = f"{log['endpoint']}"
                service_name = log['service_name']
                count = log['count']
                
                by_endpoint[endpoint_key] = by_endpoint.get(endpoint_key, 0) + count
                by_service[service_name] = by_service.get(service_name, 0) + count
                total_requests += count
        
        return AnalyticsResponse(
            summary=UsageSummary(
                total_requests=total_requests,
                by_endpoint=by_endpoint,
                by_service=by_service
            ),
            period_start=start_date.isoformat(),
            period_end=end_date.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching usage stats: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "admin-service"}

