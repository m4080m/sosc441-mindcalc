#!/bin/bash

# Mental Arithmetic Experiment - Docker Deployment Script

set -e

COMMAND=${1:-start}

case "$COMMAND" in
    start)
        echo "Starting Mental Arithmetic Experiment..."
        
        # Check if SSL certificates exist
        if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
            echo "SSL certificates not found. Generating..."
            ./generate_cert.sh
        fi
        
        docker-compose up -d
        echo "Application is running on https://localhost:53318"
        echo ""
        echo "Note: Your browser will show a security warning for self-signed certificate."
        echo "Click 'Advanced' and 'Proceed' to continue."
        ;;
    stop)
        echo "Stopping application..."
        docker-compose down
        echo "Application stopped."
        ;;
    restart)
        echo "Restarting application..."
        docker-compose restart
        echo "Application restarted."
        ;;
    logs)
        docker-compose logs -f
        ;;
    rebuild)
        echo "Rebuilding and restarting application..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo "Application rebuilt and running on https://localhost:53318"
        ;;
    status)
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|rebuild|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  logs    - View application logs"
        echo "  rebuild - Rebuild and restart (use after code changes)"
        echo "  status  - Show container status"
        exit 1
        ;;
esac
