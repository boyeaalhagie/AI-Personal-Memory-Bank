"""
Setup local PostgreSQL database for AI Personal Memory Bank
Run this script once to initialize the database schema
"""
import os
import sys
import psycopg2
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'postgres'),  # Connect to default postgres DB first
    'user': os.getenv('DB_USER', 'user'),
    'password': os.getenv('DB_PASSWORD', 'pass')
}

def setup_database():
    """Create database and schema if they don't exist"""
    print("Setting up local database...")
    
    # First, connect to default postgres database to create our database
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        db_name = os.getenv('DB_NAME', 'memorybank')
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        
        if not cursor.fetchone():
            print(f"Creating database '{db_name}'...")
            cursor.execute(f'CREATE DATABASE {db_name}')
            print(f"✓ Database '{db_name}' created")
        else:
            print(f"✓ Database '{db_name}' already exists")
        
        cursor.close()
        conn.close()
        
        # Now connect to our database and create schema
        db_config = DB_CONFIG.copy()
        db_config['database'] = db_name
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Read and execute schema file
        schema_file = Path(__file__).parent / "db" / "schema.sql"
        if schema_file.exists():
            print(f"Reading schema from {schema_file}...")
            with open(schema_file, 'r') as f:
                schema_sql = f.read()
            
            cursor.execute(schema_sql)
            conn.commit()
            print("✓ Schema created successfully")
        else:
            print(f"⚠ Warning: Schema file not found at {schema_file}")
        
        cursor.close()
        conn.close()
        
        print("\n✓ Database setup complete!")
        print(f"  Database: {db_name}")
        print(f"  Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        print(f"  User: {DB_CONFIG['user']}")
        
    except psycopg2.OperationalError as e:
        print(f"✗ Error connecting to database: {e}")
        print("\nMake sure PostgreSQL is running and accessible.")
        print("You can start PostgreSQL with:")
        print("  - Windows: Start PostgreSQL service from Services")
        print("  - Linux/Mac: sudo systemctl start postgresql")
        print("  - Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=memorybank postgres:15-alpine")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error setting up database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    setup_database()



