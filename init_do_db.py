"""
Initialize DigitalOcean database schema
Run this script to create all necessary tables
"""
import psycopg2
import sys

# Database connection from DigitalOcean
# Set these as environment variables or pass as command line arguments
import os
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'db'),
    'user': os.getenv('DB_USER', 'db'),
    'password': os.getenv('DB_PASSWORD', ''),
    'sslmode': 'require'
}

def init_database():
    """Initialize database schema"""
    print("Connecting to DigitalOcean database...")
    
    try:
        # Connect with SSL
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            sslmode='require'
        )
        
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✓ Connected to database")
        
        # Check current user and permissions
        print("\nChecking database user and permissions...")
        cursor.execute("SELECT current_user, current_database()")
        user, db = cursor.fetchone()
        print(f"  User: {user}")
        print(f"  Database: {db}")
        
        # Check if we're a superuser
        cursor.execute("SELECT usesuper FROM pg_user WHERE usename = current_user")
        is_super = cursor.fetchone()[0]
        print(f"  Is superuser: {is_super}")
        
        # Check schema permissions
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        """)
        schemas = cursor.fetchall()
        print(f"  Available schemas: {[s[0] for s in schemas]}")
        
        # Try to create a custom schema if we can't use public
        print("\nAttempting to create tables in public schema...")
        print("  (If this fails, you may need to contact DigitalOcean support")
        print("   or use the database admin panel to grant CREATE permissions)")
        
        # Create photos table
        print("\nCreating photos table...")
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
        print("✓ Photos table created")
        
        # Create usage_logs table
        print("\nCreating usage_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usage_logs (
                id SERIAL PRIMARY KEY,
                service_name VARCHAR(100) NOT NULL,
                endpoint VARCHAR(255) NOT NULL,
                user_id VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Usage_logs table created")
        
        # Create indexes
        print("\nCreating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_emotion ON photos(emotion)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usage_logs_service ON usage_logs(service_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp)")
        print("✓ Indexes created")
        
        # Add emotion_emojis_json column if it doesn't exist
        print("\nChecking for emotion_emojis_json column...")
        try:
            cursor.execute("ALTER TABLE photos ADD COLUMN emotion_emojis_json TEXT")
            print("✓ emotion_emojis_json column added")
        except Exception:
            print("✓ emotion_emojis_json column already exists")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*50)
        print("✓ Database schema initialized successfully!")
        print("="*50)
        
    except psycopg2.OperationalError as e:
        print(f"✗ Error connecting to database: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    init_database()

