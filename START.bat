@echo off
REM RODELA Project - Quick Start Script for Windows
REM This script installs dependencies and starts both backend and frontend

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║       RODELA - Baby Video Assessment System                ║
echo ║           Quick Start Script (Windows)                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not installed!
    echo Please install Node.js which includes npm
    pause
    exit /b 1
)

echo ✅ npm found: 
npm --version
echo.

REM Backend Setup
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Installing Backend Dependencies                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd backend
if errorlevel 1 (
    echo ❌ ERROR: Could not find backend folder
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

cd ..

REM Frontend Setup
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Installing Frontend Dependencies                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd frontend
if errorlevel 1 (
    echo ❌ ERROR: Could not find frontend folder
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

cd ..

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Starting RODELA System                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📋 Next Steps:
echo.
echo 1️⃣  Make sure MySQL is running in XAMPP
echo.
echo 2️⃣  Import the database (first time only):
echo    - Open phpMyAdmin
echo    - Import database.sql
echo    - Then run database_additions.sql (new tables)
echo.
echo 3️⃣  Open THREE new terminal windows
echo.
echo 4️⃣  Terminal 1 - Start Backend (Node.js):
echo    cd backend
echo    npm start
echo.
echo 5️⃣  Terminal 2 - Start Frontend (React):
echo    cd frontend
echo    npm start
echo.
echo 6️⃣  Terminal 3 - Start AI Chatbot (Python):
echo    cd chatbot
echo    python app.py
echo    (first run downloads the MiniLM model ~90MB)
echo.
echo 7️⃣  Open http://localhost:3000 in your browser
echo.
echo 🤖 Chatbot API runs on http://localhost:8000
echo 🎓 It's ready for your university showcase!
echo.
pause
