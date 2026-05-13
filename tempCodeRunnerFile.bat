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

:: Start ML Service in a new window
start "CampusCare ML Service" cmd /c "Start_ML.bat"

echo Starting Server...
:: Use the root package.json script which forwards to server
call npm start

pause
