# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create results and certs directories
RUN mkdir -p results certs

# Expose port 53318
EXPOSE 53318

# Set environment variables
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Run the application with gunicorn for production
# Use SSL if certificates are available
CMD if [ -f /app/certs/cert.pem ] && [ -f /app/certs/key.pem ]; then \
        echo "Starting with HTTPS..." && \
        gunicorn --bind 0.0.0.0:53318 \
                 --workers 4 \
                 --timeout 120 \
                 --certfile=/app/certs/cert.pem \
                 --keyfile=/app/certs/key.pem \
                 app:app; \
    else \
        echo "SSL certificates not found. Starting with HTTP..." && \
        gunicorn --bind 0.0.0.0:53318 \
                 --workers 4 \
                 --timeout 120 \
                 app:app; \
    fi
