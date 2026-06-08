#!/bin/bash

echo "=================================="
echo "Canteen Cashier Portal Setup"
echo "=================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null
then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ PostgreSQL found"

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed!"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "✅ Python found"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Database setup
echo ""
echo "🗄️  Database Setup"
echo "=================================="
echo "Please enter your PostgreSQL details:"
read -p "PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "PostgreSQL password: " DB_PASSWORD
echo ""

# Create database
echo ""
echo "📊 Creating database..."

export PGPASSWORD=$DB_PASSWORD

# Check if database exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw canteen_db; then
    echo "⚠️  Database 'canteen_db' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " RECREATE
    if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
        psql -U $DB_USER -c "DROP DATABASE canteen_db;"
        psql -U $DB_USER -c "CREATE DATABASE canteen_db;"
        echo "✅ Database recreated"
    else
        echo "⏭️  Using existing database"
    fi
else
    psql -U $DB_USER -c "CREATE DATABASE canteen_db;"
    echo "✅ Database created"
fi

# Update DB config in app.py if needed
if [ "$DB_USER" != "postgres" ] || [ "$DB_PASSWORD" != "postgres" ]; then
    echo ""
    echo "⚠️  Note: You need to update DB_CONFIG in app.py with your credentials:"
    echo "  'user': '$DB_USER'"
    echo "  'password': '$DB_PASSWORD'"
fi

echo ""
echo "=================================="
echo "✨ Setup Complete!"
echo "=================================="
echo ""
echo "To start the application:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run the app: python app.py"
echo "  3. Open browser: http://localhost:5000"
echo ""
echo "Default login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Happy billing! 🍽️"
