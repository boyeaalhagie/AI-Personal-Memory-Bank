# Commands to Run Everything Locally

## ✅ Step 1: Dependencies (Already Done!)
The dependencies have been installed. If you need to reinstall:
```powershell
pip install -r shared/requirements.txt -r upload-service/requirements.txt -r emotion-service/requirements.txt -r timeline-service/requirements.txt -r search-service/requirements.txt -r admin-service/requirements.txt
```

## Step 2: Setup Database
**Make sure PostgreSQL is running first!**

```powershell
python setup_local_db.py
```

## Step 3: Start All Backend Services

**Option A: Start all at once (Recommended)**
```powershell
.\start_services_local.ps1
```

**Option B: Start individually in separate terminals**

Terminal 1:
```powershell
python upload-service/run_local.py
```

Terminal 2:
```powershell
python emotion-service/run_local.py
```

Terminal 3:
```powershell
python timeline-service/run_local.py
```

Terminal 4:
```powershell
python search-service/run_local.py
```

Terminal 5:
```powershell
python admin-service/run_local.py
```

## Step 4: Start Frontend (in a NEW terminal)
```powershell
cd frontend
npm install
npm run dev
```

## Step 5: Open in Browser
Open: **http://localhost:5173** (or the port shown by Vite)

---

## Quick Copy-Paste (All Steps)

```powershell
# 1. Setup database (make sure PostgreSQL is running)
python setup_local_db.py

# 2. Start all backend services
.\start_services_local.ps1

# 3. In a NEW terminal, start frontend
cd frontend
npm install
npm run dev
```

---

## Service URLs
- Upload Service: http://localhost:8001
- Emotion Service: http://localhost:8002
- Timeline Service: http://localhost:8003
- Search Service: http://localhost:8004
- Admin Service: http://localhost:8005
- Frontend: http://localhost:5173



