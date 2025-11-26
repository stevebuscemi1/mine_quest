@echo off
rem ------------------------------------------------------------
rem  Start Mine Quest game server
rem ------------------------------------------------------------

:: Change to the directory where this batch file resides
cd /d "%~dp0"

:: Verify that Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.x and ensure "python" is reachable from the command line.
    pause
    exit /b 1
)

:: Start the Python HTTP server in a new console window
start "Mine Quest Server" cmd /c "python -m http.server 8000"

:: Give the server a moment to start (adjust if needed)
timeout /t 2 >nul

:: Open the default web browser to the server URL
start "" "http://localhost:8000"

:: Inform the user
echo.
echo Server started. Your default browser should now be open at http://localhost:8000
echo Press Ctrl+C in the server window to stop the server.
pause