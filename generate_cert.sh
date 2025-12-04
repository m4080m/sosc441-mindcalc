#!/bin/bash

# Generate self-signed SSL certificate for development/testing

echo "Generating self-signed SSL certificate..."

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -nodes \
  -out certs/cert.pem \
  -keyout certs/key.pem \
  -days 365 \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MindCalc/OU=Experiment/CN=localhost"

echo "SSL certificate generated successfully!"
echo "Files created:"
echo "  - certs/cert.pem (certificate)"
echo "  - certs/key.pem (private key)"
echo ""
echo "Note: This is a self-signed certificate. Browsers will show a security warning."
echo "You'll need to accept the certificate to proceed."
