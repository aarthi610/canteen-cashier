@echo off
echo ==================================
echo Canteen Cashier Portal Setup
echo ==================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed!
    echo Please install Python 3.8 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Python found

REM Create virtual environment
echo.
echo [*] Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo [*] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo [*] Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ==================================
echo Setup Complete!
echo ==================================
echo.
echo Before running the application:
echo   1. Make sure PostgreSQL is installed and running
echo   2. Create database 'canteen_db' in PostgreSQL
echo   3. Update DB_CONFIG in app.py if needed
echo.
echo To start the application:
echo   1. Run: venv\Scripts\activate.bat
echo   2. Run: python app.py
echo   3. Open browser: http://localhost:5000
echo.
echo Default login credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause
