# Canteen Management System

A full-stack canteen POS (Point of Sale) web application built with Flask, PostgreSQL, and a single-page HTML/JS frontend. Supports cashier login, item/stock management, transaction processing, and a sales dashboard.

---

##  Module Demo

**Drive Link:** *https://drive.google.com/file/d/1y1eB2Pd7IEXy_w3Sac_Wg4iPPSEa3U8f/view?usp=sharing*

---

## Tech Stack

- **Backend:** Python (Flask, Flask-CORS, Werkzeug)
- **Database:** PostgreSQL (psycopg2)
- **Frontend:** HTML, CSS, JavaScript (single-page, served by Flask)

---

## Prerequisites

Make sure the following are installed before you begin:

- [Python 3.8+](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/download/windows/) (version 14 or above recommended)
- pip (comes with Python)

---

## Setup Instructions

### 1. Clone or Extract the Project

If you received a zip file, extract it and navigate into the folder:

```
cd "files (2)"
```

---

### 2. Set Up a Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it — Windows (PowerShell):
venv\Scripts\activate

# Activate it — Mac/Linux:
source venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

The following packages will be installed:
- Flask 3.0.0
- flask-cors 4.0.0
- psycopg2-binary 2.9.9
- Werkzeug 3.0.1

---

### 4. Set Up PostgreSQL

#### Install PostgreSQL (Windows)

1. Download the installer from https://www.postgresql.org/download/windows/
2. Run the installer with default settings
3. Set a password for the `postgres` user when prompted
4. After installation, open a **new** terminal window

> If `psql` is still not recognized, add PostgreSQL to your PATH:
> `C:\Program Files\PostgreSQL\<version>\bin`

#### Create the Database

```bash
psql -U postgres -c "CREATE DATABASE canteen_db;"
```

Or use **pgAdmin** (installed alongside PostgreSQL):
1. Open pgAdmin → connect to local server
2. Right-click **Databases → Create → Database**
3. Name it `canteen_db` → Save

---

### 5. Configure Database Credentials

Open `app.py` and update the `DB_CONFIG` block if your PostgreSQL setup differs from the defaults:

```python
DB_CONFIG = {
    'dbname': 'canteen_db',
    'user': 'postgres',
    'password': 'root',       # change this to your postgres password
    'host': 'localhost',
    'port': '5432'
}
```

---

### 6. Run the Application

```bash
python app.py
```

The app will:
- Auto-create all required database tables on first run
- Create a default `admin` cashier account
- Start the server at **http://localhost:5000**

Open your browser and go to: **http://localhost:5000**

---

## Default Login

| Field    | Value    |
|----------|----------|
| Username | `admin`  |
| Password | `admin`  |

> It is recommended to change the default password after first login.

---

## Project Structure

```
files (2)/
├── app.py               # Flask backend — routes, DB logic
├── requirements.txt     # Python dependencies
├── setup.sh             # Automated setup script (Mac/Linux)
├── setup.bat            # Automated setup script (Windows)
├── verify_setup.py      # Script to verify your environment
├── TROUBLESHOOTING.md   # Common issues and fixes
└── static/
    ├── index.html       # Frontend entry point
    ├── script.js        # Frontend logic
    └── styles.css       # Styling
```

---

## Troubleshooting

If you run into issues, refer to `TROUBLESHOOTING.md` included in the project folder.

Common fixes:
- **`psql` not recognized** → PostgreSQL is not installed or not in PATH (see Step 4)
- **Connection refused** → PostgreSQL service is not running; start it from Services or pgAdmin
- **Password authentication failed** → Update `DB_CONFIG` in `app.py` with your actual postgres password
- **Module not found** → Make sure your virtual environment is activated before running `pip install`
