@echo off
title AI-Based Smart Attendance Management System
color 0b
echo ======================================================================
echo       AI-BASED SMART ATTENDANCE MANAGEMENT SYSTEM (FACETRACK.AI)
echo ======================================================================
echo.
echo Starting Flask AI Backend (Port 5000)...
start "Flask AI Vision Backend" cmd /k "cd /d %~dp0backend && C:\Users\manas\anaconda3\python.exe app.py"

timeout /t 3 /nobreak >nul

echo Starting Vite React Frontend (Port 5173)...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo System successfully started!
echo Open your browser at: http://localhost:5173
echo (Or unified build at: http://localhost:5000)
echo ======================================================================
echo.
pause
