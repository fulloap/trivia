#!/bin/bash

# Health check script for production monitoring

URL=${1:-"http://localhost:3005"}

echo "🔍 Checking application health at $URL..."

# Check main health endpoint
echo "1. Health endpoint check:"
curl -f "$URL/api/health" || echo "❌ Health check failed"

echo -e "\n2. Countries endpoint check:"
curl -f "$URL/api/countries" || echo "❌ Countries endpoint failed"

echo -e "\n3. Sample questions check:"
curl -f "$URL/api/questions/cuba/1?limit=1" || echo "❌ Questions endpoint failed"

echo -e "\n4. Database connection test:"
if curl -s "$URL/api/countries" | grep -q "Cuba"; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection issues"
fi

echo -e "\n🏁 Health check complete"