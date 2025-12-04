#!/bin/bash
set -e

# Check if SSL certificates exist
if [ -f /app/certs/cert.pem ] && [ -f /app/certs/key.pem ]; then
    echo "Starting with HTTPS on port 53318..."
    exec gunicorn --bind 0.0.0.0:53318 \
                  --workers 4 \
                  --timeout 120 \
                  --certfile=/app/certs/cert.pem \
                  --keyfile=/app/certs/key.pem \
                  app:app
else
    echo "Warning: SSL certificates not found at /app/certs/"
    echo "Starting with HTTP on port 53318..."
    exec gunicorn --bind 0.0.0.0:53318 \
                  --workers 4 \
                  --timeout 120 \
                  app:app
fi
