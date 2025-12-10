# Database Initialization for DigitalOcean

The database user needs permission to create tables. You have two options:

## Option 1: Run SQL in DigitalOcean Console (Recommended)

1. Go to your DigitalOcean dashboard
2. Navigate to **Databases** → Select your database
3. Click on **"Query"** or **"SQL Editor"**
4. Run this SQL to grant permissions:

```sql
-- Grant permissions to the database user
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT CREATE ON SCHEMA public TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO CURRENT_USER;
```

5. Then run the schema from `db/schema.sql`:

```sql
-- Create photos table
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
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_emotion ON photos(emotion);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_service ON usage_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
```

## Option 2: Use doctl to Connect and Run SQL

```powershell
# Get database connection info
.\doctl.exe databases connection 477545af-1067-48fb-ac14-94d85b419f63 --format ConnectionString

# Then connect with psql and run the schema
```

