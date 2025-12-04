# HTTPS Setup - Quick Start

This application requires HTTPS to use the microphone feature.

## Setup Steps

1. **Generate SSL Certificate** (first time only):
```bash
./generate_cert.sh
```

2. **Start the Application**:
```bash
./deploy.sh start
```
   Or manually:
```bash
docker-compose up -d
```

3. **Access the Application**:
   - Open your browser and go to: **https://localhost:53318**
   
4. **Accept the Security Warning**:
   - Chrome: Click "Advanced" → "Proceed to localhost (unsafe)"
   - Firefox: Click "Advanced" → "Accept the Risk and Continue"
   - Safari: Click "Show Details" → "visit this website"

5. **Grant Microphone Permission**:
   - When prompted, click "Allow" to give microphone access
   - The microphone is only used in Step 2 of the experiment

## Why the Security Warning?

The application uses a **self-signed SSL certificate** for development/testing. This triggers a browser security warning, but it's safe to proceed since you're running the application locally.

For production deployment, you should use a proper SSL certificate from a Certificate Authority (like Let's Encrypt).

## Troubleshooting

### "Your connection is not private" warning persists
- Make sure you clicked "Advanced" or "Show Details"
- Look for the option to proceed/continue despite the warning

### Microphone still doesn't work
- Make sure you're accessing via `https://` not `http://`
- Check browser permissions: Settings → Privacy → Microphone
- Make sure no other application is using the microphone

### Certificate expired
```bash
rm -rf certs/
./generate_cert.sh
./deploy.sh restart
```

## Production Deployment

For production with a real domain, use Let's Encrypt:
```bash
# Install certbot
apt-get install certbot

# Get certificate
certbot certonly --standalone -d yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/key.pem

# Restart
./deploy.sh restart
```
