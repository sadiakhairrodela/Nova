#!/bin/bash
# RODELA Project - Quick Start Script for macOS/Linux
# This script installs dependencies and provides startup instructions

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       RODELA - Baby Video Assessment System                ║"
echo "║        Quick Start Script (macOS/Linux)                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found:"
node --version

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed!"
    echo "Please install Node.js which includes npm"
    exit 1
fi

echo "✅ npm found:"
npm --version
echo ""

# Backend Setup
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           Installing Backend Dependencies                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -d "backend" ]; then
    echo "❌ ERROR: Could not find backend folder"
    exit 1
fi

cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install backend dependencies"
        exit 1
    fi
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

cd ..

# Frontend Setup
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           Installing Frontend Dependencies                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -d "frontend" ]; then
    echo "❌ ERROR: Could not find frontend folder"
    exit 1
fi

cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install frontend dependencies"
        exit 1
    fi
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           RODELA System Ready to Start                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Make sure MySQL is running"
echo ""
echo "2️⃣  Open TWO new terminal windows"
echo ""
echo "3️⃣  In Terminal 1 - Start Backend:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "4️⃣  In Terminal 2 - Start Frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "5️⃣  Open http://localhost:3000 in your browser"
echo ""
echo "🎓 It's ready for your university showcase!"
echo ""
