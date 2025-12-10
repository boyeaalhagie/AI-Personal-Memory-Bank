"""
Start all services locally (without Docker)
This script starts all microservices in separate processes
"""
import subprocess
import sys
import time
import signal
from pathlib import Path

# Service configurations
SERVICES = [
    {
        "name": "upload-service",
        "port": 8001,
        "script": "upload-service/run_local.py"
    },
    {
        "name": "emotion-service",
        "port": 8002,
        "script": "emotion-service/run_local.py"
    },
    {
        "name": "timeline-service",
        "port": 8003,
        "script": "timeline-service/run_local.py"
    },
    {
        "name": "search-service",
        "port": 8004,
        "script": "search-service/run_local.py"
    },
    {
        "name": "admin-service",
        "port": 8005,
        "script": "admin-service/run_local.py"
    }
]

processes = []

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\nShutting down services...")
    for proc in processes:
        try:
            proc.terminate()
        except:
            pass
    sys.exit(0)

def start_services():
    """Start all services"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    project_root = Path(__file__).parent
    
    print("=" * 60)
    print("Starting AI Personal Memory Bank Services (Local Mode)")
    print("=" * 60)
    print()
    
    # Start each service
    for service in SERVICES:
        script_path = project_root / service["script"]
        if not script_path.exists():
            print(f"✗ {service['name']}: Script not found at {script_path}")
            continue
        
        print(f"Starting {service['name']} on port {service['port']}...")
        try:
            proc = subprocess.Popen(
                [sys.executable, str(script_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            processes.append(proc)
            print(f"✓ {service['name']} started (PID: {proc.pid})")
        except Exception as e:
            print(f"✗ Failed to start {service['name']}: {e}")
    
    print()
    print("=" * 60)
    print("All services started!")
    print("=" * 60)
    print("\nServices running on:")
    for service in SERVICES:
        print(f"  {service['name']}: http://localhost:{service['port']}")
    print("\nPress Ctrl+C to stop all services")
    print("=" * 60)
    
    # Wait for all processes
    try:
        for proc in processes:
            proc.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    start_services()



