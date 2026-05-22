@echo off
setlocal

set "ROOT=%~dp0"
set "PYTHON_EXE=%ROOT%.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=python"
)

echo Starting CampusCare ML Service...
echo ===================================

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

cd /d "%ROOT%campuscare-ml"
echo Running FastAPI server on port 8000...
"%PYTHON_EXE%" -m uvicorn app:app --reload --host 127.0.0.1 --port 8000

pause
endlocal
