@echo off
echo Starting CampusCare Server...
echo ===================================

:: Check if node_modules exists in server folder, if not install dependencies
if not exist "server\node_modules" (
    echo Installing dependencies...
    cd server
    call npm install
    cd ..
)

echo Starting Server...
:: Use the root package.json script which forwards to server
call npm start

pause
