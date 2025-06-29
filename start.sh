#!/bin/bash

echo "Starting Supplier Compliance Monitor..."

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker Desktop."
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "Neither docker-compose nor docker compose is available."
    exit 1
fi

echo "Building and starting services..."
$COMPOSE_CMD up --build -d

echo ""
echo "Waiting for services to start..."
sleep 30

echo ""
echo "Services are starting up..."
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "To stop the services, run: $COMPOSE_CMD down"
echo "To view logs, run: $COMPOSE_CMD logs -f"
echo ""

# Try to open the frontend in default browser (macOS/Linux)
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi
