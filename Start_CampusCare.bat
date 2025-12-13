@echo off
echo Starting CampusCare Server...
echo ===================================
cd server
if exist node_modules (
    npm start
) else (
    echo Installing dependencies first...
    npm install
    npm start
)
pause
