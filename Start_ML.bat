@echo off
echo Starting CampusCare ML Service...
echo ===================================

cd campuscare-ml
echo Running FastAPI server on port 8000...
uvicorn app:app --reload --port 8000
pause
