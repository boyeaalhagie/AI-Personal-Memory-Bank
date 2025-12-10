# Database Initialization Instructions

Your database user doesn't have permission to create tables. You need to run the schema SQL through the DigitalOcean admin console.

## Step 1: Access DigitalOcean Database Console

1. Go to https://cloud.digitalocean.com/databases
2. Click on your database (the one with host `app-ad135b94-0bd1-44bd-be10-4670f57b4eef-do-user-26449281-0.f.db.ondigitalocean.com`)
3. Click on the **"Query"** or **"SQL Editor"** tab

## Step 2: Run This SQL

Copy and paste this entire SQL script into the query editor and run it:

```sql
-- Grant permissions to the db user
GRANT ALL ON SCHEMA public TO db;
GRANT CREATE ON SCHEMA public TO db;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO db;

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

## Step 3: Verify

After running the SQL, verify the tables were created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

You should see:
- `photos`
- `usage_logs`

## Alternative: If GRANT fails

If the GRANT commands fail, the database might be using a different permission model. In that case:

1. Try running just the CREATE TABLE statements (skip the GRANT commands)
2. If that still fails, contact DigitalOcean support to grant CREATE permissions to your database user
3. Or check if there's a "Database Users" section where you can modify user permissions

## After Initialization

Once the tables are created, your application should work. The services will automatically connect and use these tables.

