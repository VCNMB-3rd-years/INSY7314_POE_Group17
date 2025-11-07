#!/bin/bash

echo "🔐 Generating SSL Certificates for Development..."

# Create certs directory
mkdir -p certs

# Generate Backend Certificate
echo "📦 Generating Backend Certificate..."
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:4096 -keyout certs/backend-key.pem -out certs/backend-cert.pem -days 365 -nodes -subj "/CN=localhost/O=Payment Portal/C=US"

# Generate Client Certificate
echo "📦 Generating Client Portal Certificate..."
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:4096 -keyout certs/client-key.pem -out certs/client-cert.pem -days 365 -nodes -subj "/CN=localhost/O=Payment Portal Client/C=US"

echo ""
echo "✅ All certificates generated successfully!"
echo ""
echo "Certificates created in ./certs/ directory:"
ls -lh certs/
echo ""
echo "⚠️  Note: These are self-signed certificates for development only!"
