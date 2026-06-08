#!/usr/bin/env python3
"""
Canteen Cashier Portal - Setup Verification Script
This script checks if all requirements are met for running the application.
"""

import sys
import subprocess

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Need 3.8 or higher")
        return False

def check_module(module_name):
    """Check if a Python module is installed"""
    try:
        __import__(module_name)
        print(f"✅ {module_name} - Installed")
        return True
    except ImportError:
        print(f"❌ {module_name} - Not installed")
        return False

def check_postgresql():
    """Check if PostgreSQL is accessible"""
    try:
        result = subprocess.run(['psql', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ PostgreSQL - {version}")
            return True
        else:
            print("❌ PostgreSQL - Not accessible")
            return False
    except FileNotFoundError:
        print("❌ PostgreSQL - Not installed")
        return False
    except Exception as e:
        print(f"❌ PostgreSQL - Error: {e}")
        return False

def main():
    print("=" * 50)
    print("Canteen Cashier Portal - Setup Verification")
    print("=" * 50)
    print()
    
    all_checks = []
    
    print("Checking Python version...")
    all_checks.append(check_python_version())
    print()
    
    print("Checking PostgreSQL...")
    all_checks.append(check_postgresql())
    print()
    
    print("Checking Python dependencies...")
    modules = ['flask', 'flask_cors', 'psycopg2', 'werkzeug']
    for module in modules:
        all_checks.append(check_module(module))
    print()
    
    print("=" * 50)
    if all(all_checks):
        print("✨ All checks passed! You're ready to run the application.")
        print()
        print("To start the application:")
        print("  python app.py")
        print()
        print("Then open: http://localhost:5000")
    else:
        print("⚠️  Some checks failed. Please install missing requirements.")
        print()
        print("To install Python dependencies:")
        print("  pip install -r requirements.txt")
        print()
        print("To install PostgreSQL:")
        print("  Ubuntu/Debian: sudo apt install postgresql")
        print("  macOS: brew install postgresql")
        print("  Windows: https://www.postgresql.org/download/windows/")
    print("=" * 50)

if __name__ == "__main__":
    main()
