#!/bin/bash

git clone https://github.com/username/translify-docker.git
cd translify-docker

docker-compose up -d --build

docker-compose ps

docker-compose logs -f

echo "========================================"
echo "Deployment Selesai!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:8000"
echo "LibreTranslate: http://localhost:5000"
echo "========================================"