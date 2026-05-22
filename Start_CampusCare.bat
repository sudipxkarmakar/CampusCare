@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo Starting CampusCare...
echo ===================================

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found. Install Node.js, then run this again.
    pause
    exit /b 1
)

if not exist "%ROOT%server\node_modules" (
    echo Installing backend dependencies...
    pushd "%ROOT%server"
    call npm install
    if errorlevel 1 (
        popd
        echo [ERROR] Backend dependency installation failed.
        pause
        exit /b 1
    )
    popd
)

set "PYTHON_EXE=%ROOT%.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python was not found. Install Python or create .venv, then run this again.
    pause
    exit /b 1
)

"%PYTHON_EXE%" -c "import fastapi, uvicorn, sklearn, pandas, numpy, pydantic" >nul 2>nul
if errorlevel 1 (
    echo Installing ML dependencies...
    pushd "%ROOT%campuscare-ml"
    "%PYTHON_EXE%" -m pip install -r requirements.txt
    if errorlevel 1 (
        popd
        echo [ERROR] ML dependency installation failed.
        pause
        exit /b 1
    )
    popd
)

echo Starting backend API on http://localhost:5000 ...
start "CampusCare Backend API" cmd /k "cd /d ""%ROOT%server"" && npm start"

echo Starting ML service on http://localhost:8000 ...
start "CampusCare ML Service" cmd /k "cd /d ""%ROOT%campuscare-ml"" && ""%PYTHON_EXE%"" -m uvicorn app:app --reload --host 127.0.0.1 --port 8000"

echo.
echo CampusCare is starting in separate windows.
echo App:      http://localhost:5000
echo Backend:  http://localhost:5000
echo ML API:   http://localhost:8000/docs
echo.
echo You can close the named service windows to stop them.

0
timeout /t 3 /nobreak >nul
start "" "http://localhost:5000"

endlocal
