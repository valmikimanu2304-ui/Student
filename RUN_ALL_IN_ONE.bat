@echo off
title FaceTrack.AI Pro - Smart Attendance Management System
color 0b
cls
echo ======================================================================
echo    AI-BASED SMART ATTENDANCE MANAGEMENT SYSTEM (FACETRACK.AI PRO)
echo ======================================================================
echo.
echo Starting Unified All-in-One Attendance System...
echo.

:: Automatically open default browser after a brief delay
start "" http://localhost:5173

:: Run backend directly in this window
cd /d "%~dp0backend"
C:\Users\manas\anaconda3\python.exe app.py

pause
