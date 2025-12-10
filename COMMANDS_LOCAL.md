# Commands to Run AI Personal Memory Bank Locally

## Step 1: Install Python Dependencies

```powershell
# Install shared dependencies
pip install -r shared/requirements.txt

# Install service dependencies
pip install -r upload-service/requirements.txt
pip install -r emotion-service/requirements.txt
pip install -r timeline-service/requirements.txt
pip install -r search-service/requirements.txt
pip install -r admin-service/requirements.txt
```

**Or install all at once:**
```powershell
pip install -r shared/requirements.txt upload-service/requirements.txt emotion-service/requirements.txt timeline-service/requirements.txt search-service/requirements.txt admin-service/requirements.txt
```

## Step 2: Setup PostgreSQL Database

**Make sure PostgreSQL is running first!**

```powershell
# Initialize the database
python setup_local_db.py
```

## Step 3: Start All Backend Services

**Option A: Start all services in separate windows (Recommended)**
```powershell
.\start_services_local.ps1
```

**Option B: Start services individually in separate terminals**

Terminal 1 - Upload Service:
```powershell
python upload-service/run_local.py
```

Terminal 2 - Emotion Service:
```powershell
python emotion-service/run_local.py
```

Terminal 3 - Timeline Service:
```powershell
python timeline-service/run_local.py
```

Terminal 4 - Search Service:
```powershell
python search-service/run_local.py
```

Terminal 5 - Admin Service:
```powershell
python admin-service/run_local.py
```

## Step 4: Start Frontend

**Open a new terminal and run:**
```powershell
cd frontend
npm install
npm run dev
```

## Step 5: Open in Browser

Open: **http://localhost:5173** (or the port shown by Vite)

---

## All Commands in One Block (Copy & Paste)

```powershell
# 1. Install dependencies
pip install -r shared/requirements.txt
pip install -r upload-service/requirements.txt
pip install -r emotion-service/requirements.txt
pip install -r timeline-service/requirements.txt
pip install -r search-service/requirements.txt
pip install -r admin-service/requirements.txt

# 2. Setup database (make sure PostgreSQL is running)
python setup_local_db.py

# 3. Start all backend services
.\start_services_local.ps1

# 4. In a NEW terminal, start frontend
cd frontend
npm install
npm run dev
```

---

## Verify Services Are Running

Check each service health endpoint:

```powershell
# Upload Service
curl http://localhost:8001/health

# Emotion Service
curl http://localhost:8002/health

# Timeline Service
curl http://localhost:8003/health

# Search Service
curl http://localhost:8004/health

# Admin Service
curl http://localhost:8005/health
```

Or open in browser:
- http://localhost:8001/health
- http://localhost:8002/health
- http://localhost:8003/health
- http://localhost:8004/health
- http://localhost:8005/health

---

## Troubleshooting

### PostgreSQL Not Running
```powershell
# Check if PostgreSQL service is running
Get-Service postgresql*

# Start PostgreSQL service (if installed as Windows service)
Start-Service postgresql-x64-15  # Adjust version number as needed
```

### Port Already in Use
```powershell
# Find what's using port 8001 (example)
netstat -ano | findstr :8001

# Kill process by PID (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Missing Dependencies
```powershell
# Reinstall all dependencies
pip install --upgrade -r shared/requirements.txt
pip install --upgrade -r upload-service/requirements.txt
pip install --upgrade -r emotion-service/requirements.txt
pip install --upgrade -r timeline-service/requirements.txt
pip install --upgrade -r search-service/requirements.txt
pip install --upgrade -r admin-service/requirements.txt
```



