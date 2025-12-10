# Quick Start Guide - Local Setup

## 1. Install Dependencies

```bash
pip install -r shared/requirements.txt
pip install -r upload-service/requirements.txt
pip install -r emotion-service/requirements.txt
pip install -r timeline-service/requirements.txt
pip install -r search-service/requirements.txt
pip install -r admin-service/requirements.txt
```

## 2. Setup Database

Make sure PostgreSQL is running, then:

```bash
python setup_local_db.py
```

## 3. Start All Services

**Windows:**
```powershell
.\start_services_local.ps1
```

**Linux/Mac:**
```bash
chmod +x start_services_local.sh
./start_services_local.sh
```

**Or Python (cross-platform):**
```bash
python start_services_local.py
```

## 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## 5. Open in Browser

Open http://localhost:5173 (or the port shown by Vite)

---

**That's it!** All services are now running locally with local storage.

For detailed information, see [README_LOCAL.md](README_LOCAL.md)



