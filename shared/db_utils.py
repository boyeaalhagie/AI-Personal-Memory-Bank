"""
Shared database utilities for all microservices
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from typing import Optional, Dict, Any

# Database connection parameters
DB_CONFIG = {
    'host': os.getenv('DB_HOST', os.getenv('POSTGRES_HOST', 'localhost')),
    'port': os.getenv('DB_PORT', os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('DB_NAME', os.getenv('POSTGRES_DB', 'memorybank')),
    'user': os.getenv('DB_USER', os.getenv('POSTGRES_USER', 'user')),
    'password': os.getenv('DB_PASSWORD', os.getenv('POSTGRES_PASSWORD', 'pass'))
}


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def get_db_cursor():
    """Context manager for database cursors with dict-like results"""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
        finally:
            cursor.close()


def log_usage(service_name: str, endpoint: str, user_id: Optional[str] = None):
    """Log API usage to the usage_logs table"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO usage_logs (service_name, endpoint, user_id) VALUES (%s, %s, %s)",
                (service_name, endpoint, user_id)
            )
            conn.commit()
            cursor.close()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error logging usage: {e}")

