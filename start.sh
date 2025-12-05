#!/bin/bash
# Linux/Mac script to start both backend and frontend

echo "========================================="
echo "Starting RFP Management System"
echo "========================================="
echo ""

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "Starting backend and frontend servers..."
echo ""

# Start both servers using npm run dev
npm run dev

