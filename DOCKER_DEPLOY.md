# Docker Deployment Guide

This guide explains how to deploy the Mental Arithmetic Experiment application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (optional, for easier deployment)

## Quick Start

### Using Docker Compose (Recommended)

1. Build and start the container:
```bash
docker-compose up -d
```

2. Access the application at: `http://localhost:53318`

3. Stop the container:
```bash
docker-compose down
```

### Using Docker CLI

1. Build the Docker image:
```bash
docker build -t mindcalc-app .
```

2. Run the container:
```bash
docker run -d \
  --name mindcalc \
  -p 53318:53318 \
  -v $(pwd)/results:/app/results \
  mindcalc-app
```

3. Stop the container:
```bash
docker stop mindcalc
docker rm mindcalc
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

Results are stored in the `./results` directory on the host machine, which is mounted to `/app/results` in the container. This ensures data persistence across container restarts.

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
