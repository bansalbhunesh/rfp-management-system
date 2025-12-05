@echo off
REM Windows script to start both backend and frontend
echo =========================================
echo Starting RFP Management System
echo =========================================
echo.

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting backend and frontend servers...
echo.

REM Start both servers using npm run dev
call npm run dev

pause

