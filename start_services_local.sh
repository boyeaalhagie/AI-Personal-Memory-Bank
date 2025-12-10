#!/bin/bash
# Bash script to start all services locally on Linux/Mac
# This script starts all microservices in separate terminal windows or background processes

set -e

echo "============================================================"
echo "Starting AI Personal Memory Bank Services (Local Mode)"
echo "============================================================"
echo ""

# Check if we're in a GUI environment
if command -v gnome-terminal &> /dev/null; then
    TERMINAL="gnome-terminal --"
elif command -v xterm &> /dev/null; then
    TERMINAL="xterm -e"
elif command -v osascript &> /dev/null; then
    TERMINAL="osascript -e"
else
    TERMINAL=""
fi

SERVICES=(
    "upload-service:8001:upload-service/run_local.py"
    "emotion-service:8002:emotion-service/run_local.py"
    "timeline-service:8003:timeline-service/run_local.py"
    "search-service:8004:search-service/run_local.py"
    "admin-service:8005:admin-service/run_local.py"
)

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port script <<< "$service_info"
    script_path="$(dirname "$0")/$script"
    
    if [ ! -f "$script_path" ]; then
        echo "✗ $name: Script not found at $script_path"
        continue
    fi
    
    echo "Starting $name on port $port..."
    
    if [ -n "$TERMINAL" ]; then
        # Start in a new terminal window
        if [[ "$TERMINAL" == *"osascript"* ]]; then
            osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)' && python3 '$script_path'\""
        else
            $TERMINAL "cd '$(pwd)' && python3 '$script_path'" &
        fi
    else
        # Start in background
        python3 "$script_path" > "/tmp/${name}.log" 2>&1 &
        echo "  Logs: /tmp/${name}.log"
    fi
    
    echo "✓ $name started"
    sleep 2
done

echo ""
echo "============================================================"
echo "All services started!"
echo "============================================================"
echo ""
echo "Services running on:"
for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r name port script <<< "$service_info"
    echo "  $name: http://localhost:$port"
done
echo ""
echo "Close the service windows/processes to stop them"
echo "============================================================"



