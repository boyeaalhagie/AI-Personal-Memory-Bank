# Running AI Personal Memory Bank Locally (Without Docker)

This guide explains how to run all services locally without Docker, using local storage.

## Prerequisites

1. **Python 3.8+** installed
2. **PostgreSQL** installed and running locally
   - Windows: Install from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian) or `sudo yum install postgresql` (RHEL/CentOS)
   - Mac: `brew install postgresql` or install from [postgresql.org](https://www.postgresql.org/download/macosx/)

3. **All Python dependencies** installed (see Installation section)

## Installation

### 1. Install Python Dependencies

Install dependencies for each service:

```bash
# Install shared dependencies
pip install -r shared/requirements.txt

# Install service dependencies
pip install -r upload-service/requirements.txt
pip install -r emotion-service/requirements.txt
pip install -r timeline-service/requirements.txt
pip install -r search-service/requirements.txt
pip install -r admin-service/requirements.txt
```

Or install all at once:
```bash
pip install -r shared/requirements.txt
pip install -r upload-service/requirements.txt
pip install -r emotion-service/requirements.txt
pip install -r timeline-service/requirements.txt
pip install -r search-service/requirements.txt
pip install -r admin-service/requirements.txt
```

### 2. Setup PostgreSQL Database

Make sure PostgreSQL is running, then initialize the database:

```bash
python setup_local_db.py
```

This script will:
- Create the `memorybank` database if it doesn't exist
- Create all necessary tables and indexes

**Database Configuration:**
- Host: `localhost`
- Port: `5432`
- Database: `memorybank`
- User: `user`
- Password: `pass`

To use different credentials, set environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=memorybank
export DB_USER=your_user
export DB_PASSWORD=your_password
```

### 3. Configure OpenAI API Key (for emotion-service)

The emotion-service requires an OpenAI API key. You can set it as an environment variable:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your-api-key-here"

# Windows CMD
set OPENAI_API_KEY=your-api-key-here

# Linux/Mac
export OPENAI_API_KEY="your-api-key-here"
```

Or edit `emotion-service/run_local.py` to set it directly (not recommended for production).

## Running Services

### Option 1: Start All Services at Once

**Windows (PowerShell):**
```powershell
.\start_services_local.ps1
```

**Linux/Mac:**
```bash
chmod +x start_services_local.sh
./start_services_local.sh
```

**Python (Cross-platform):**
```bash
python start_services_local.py
```

### Option 2: Start Services Individually

You can also start each service in a separate terminal:

```bash
# Terminal 1: Upload Service
python upload-service/run_local.py

# Terminal 2: Emotion Service
python emotion-service/run_local.py

# Terminal 3: Timeline Service
python timeline-service/run_local.py

# Terminal 4: Search Service
python search-service/run_local.py

# Terminal 5: Admin Service
python admin-service/run_local.py
```

## Service Ports

- **Upload Service**: http://localhost:8001
- **Emotion Service**: http://localhost:8002
- **Timeline Service**: http://localhost:8003
- **Search Service**: http://localhost:8004
- **Admin Service**: http://localhost:8005

## Local Storage

All uploaded photos are stored in the `uploads/` directory at the project root. This directory is created automatically when you start the upload-service.

## Frontend

The frontend is already configured to connect to localhost services. To run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173 (or the port Vite assigns).

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. **Check PostgreSQL is running:**
   - Windows: Check Services app or run `Get-Service postgresql*`
   - Linux: `sudo systemctl status postgresql`
   - Mac: `brew services list`

2. **Verify database credentials:**
   - Default: user=`user`, password=`pass`, database=`memorybank`
   - Update environment variables if using different credentials

3. **Check PostgreSQL is listening on port 5432:**
   ```bash
   # Windows
   netstat -an | findstr 5432
   
   # Linux/Mac
   netstat -an | grep 5432
   ```

### Port Already in Use

If a port is already in use:

1. Find the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :8001
   
   # Linux/Mac
   lsof -i :8001
   ```

2. Kill the process or change the port in the service's `run_local.py` file

### Missing Dependencies

If you get import errors, make sure all dependencies are installed:

```bash
pip install -r shared/requirements.txt
pip install -r <service-name>/requirements.txt
```

### File Not Found Errors

Make sure the `uploads/` directory exists in the project root. It will be created automatically, but if you get errors, create it manually:

```bash
mkdir uploads
```

## Differences from Docker Setup

- **Storage**: Files are stored in `./uploads/` instead of Docker volumes
- **Database**: Connects to `localhost:5432` instead of Docker service `db`
- **Service Communication**: Services use `localhost` URLs instead of Docker service names
- **Shared Module**: Uses relative paths to find the shared module

## Development Tips

- Each service runs independently - you can restart individual services without affecting others
- Check service logs in the terminal where you started them
- Use the `/health` endpoint to check if a service is running:
  ```bash
  curl http://localhost:8001/health
  ```

## Next Steps

1. Start all services using one of the methods above
2. Run the frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173 in your browser
4. Start uploading photos!



