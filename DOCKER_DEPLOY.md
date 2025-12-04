# Docker Deployment Guide

This guide explains how to deploy the Mental Arithmetic Experiment application using Docker with HTTPS support.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (optional, for easier deployment)
- OpenSSL (for generating SSL certificates)

## Quick Start

### Using Docker Compose (Recommended)

1. Generate SSL certificates (first time only):
```bash
./generate_cert.sh
```

2. Build and start the container:
```bash
docker-compose up -d
```

3. Access the application at: `https://localhost:53318`
   - **Note:** Your browser will show a security warning because this is a self-signed certificate
   - Click "Advanced" and "Proceed to localhost" (or similar) to continue

4. Stop the container:
```bash
docker-compose down
```

### Using the Convenience Script

The `deploy.sh` script automatically generates certificates if needed:

```bash
./deploy.sh start    # Start with HTTPS
./deploy.sh stop     # Stop the application
./deploy.sh restart  # Restart
./deploy.sh logs     # View logs
./deploy.sh rebuild  # Rebuild after changes
./deploy.sh status   # Check status
```

### Using Docker CLI

1. Generate SSL certificates:
```bash
./generate_cert.sh
```

2. Build the Docker image:
```bash
docker build -t mindcalc-app .
```

3. Run the container:
```bash
docker run -d \
  --name mindcalc \
  -p 53318:53318 \
  -v $(pwd)/results:/app/results \
  -v $(pwd)/certs:/app/certs \
  mindcalc-app
```

4. Stop the container:
```bash
docker stop mindcalc
docker rm mindcalc
```

## HTTPS Configuration

### Why HTTPS?

Modern browsers require HTTPS to access the microphone API for security reasons. This application uses HTTPS with a self-signed certificate.

### SSL Certificates

The `generate_cert.sh` script creates a self-signed SSL certificate that's valid for 365 days.

**Certificate files:**
- `certs/cert.pem` - SSL certificate
- `certs/key.pem` - Private key

**Accepting the Certificate:**

When you first access the application, your browser will show a security warning:
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost" or "Accept the Risk"
3. The microphone will now work properly

### Regenerating Certificates

If your certificate expires or you need a new one:
```bash
rm -rf certs/
./generate_cert.sh
docker-compose restart
```

## Configuration

### Port Configuration

The application runs on port **53318** by default. To change it:

**Docker Compose:**
Edit `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:53318"
```

**Docker CLI:**
```bash
docker run -d -p YOUR_PORT:53318 -v $(pwd)/results:/app/results mindcalc-app
```

### Volume Mounts

- **Results:** `./results` directory stores experiment data (persisted on host)
- **Certificates:** `./certs` directory contains SSL certificates (persisted on host)

## Container Management

### View logs
```bash
docker-compose logs -f
# or
docker logs -f mindcalc
```

### Restart container
```bash
docker-compose restart
# or
docker restart mindcalc
```

### Update application
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

The Docker setup uses Gunicorn as the production WSGI server with:
- 4 worker processes
- 120-second timeout
- Automatic restart on failure

### Environment Variables

- `FLASK_ENV`: Set to `production` by default
- `PORT`: Application port (default: 53318)

## Troubleshooting

### Container won't start
Check logs: `docker-compose logs` or `docker logs mindcalc`

### Permission issues with results directory
```bash
chmod 777 results
```

### Port already in use
Change the host port in docker-compose.yml or use a different port when running docker run

## Security Notes

- The application binds to `0.0.0.0` inside the container but is only exposed through the ports you map
- Consider using a reverse proxy (nginx) in production
- Results directory is mounted with read/write permissions

## Backup Results

Results are stored in `./results/` on the host machine. To backup:
```bash
tar -czf results-backup-$(date +%Y%m%d).tar.gz results/
```
