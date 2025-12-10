#!/bin/bash

# Test script for AI Emotional Memory Bank API

echo "=== Testing AI Emotional Memory Bank APIs ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test health endpoints
echo "1. Testing Health Endpoints..."
services=("upload-service:8001" "emotion-service:8002" "timeline-service:8003" "search-service:8004" "admin-service:8005")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    if curl -s "http://localhost:$port/health" > /dev/null; then
        echo -e "${GREEN}✓${NC} $name is healthy"
    else
        echo -e "${RED}✗${NC} $name is not responding"
    fi
done

echo ""
echo "2. Testing Photo Upload..."
echo "Note: This requires an actual image file. Create a test image first."
echo "Example: curl -X POST 'http://localhost:8001/photos?user_id=test_user' -F 'file=@test.jpg'"

echo ""
echo "3. Testing Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8005/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓${NC} Admin login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗${NC} Admin login failed"
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""
echo "=== Test Complete ==="

