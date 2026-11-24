@echo off
echo Starting Better Urban (local mode)...
echo.

REM Backend
start "BetterUrban-Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

REM Wait a moment for backend to boot
timeout /t 3 /nobreak >nul

REM Frontend
start "BetterUrban-Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Backend:  http://localhost:8000  (docs: http://localhost:8000/docs)
echo Frontend: http://localhost:3000
echo.
echo Set NEXT_PUBLIC_API_BASE=http://localhost:8000 in .env.local for the frontend to use the backend.
pause