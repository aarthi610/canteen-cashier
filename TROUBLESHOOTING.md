# Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Connection Errors

#### Error: "could not connect to server: Connection refused"

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql
```

#### Error: "FATAL: database 'canteen_db' does not exist"

**Solution:**
```bash
# Create the database
sudo -u postgres psql -c "CREATE DATABASE canteen_db;"
```

#### Error: "FATAL: password authentication failed"

**Solution:**
1. Check your password in `app.py` DB_CONFIG
2. Reset PostgreSQL password:
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### 2. Python/Flask Errors

#### Error: "ModuleNotFoundError: No module named 'flask'"

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

#### Error: "Address already in use" (Port 5000)

**Solution:**
1. Option 1 - Kill the process using port 5000:
```bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

2. Option 2 - Use a different port:
Edit `app.py`:
```python
app.run(debug=True, port=5001)  # Change to 5001 or any free port
```

Then access: http://localhost:5001

### 3. Frontend/JavaScript Errors

#### Error: "Failed to fetch" or CORS errors

**Solution:**
1. Make sure the backend is running (`python app.py`)
2. Check the API_URL in `static/script.js` matches your server
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try a different browser

#### Error: Items not displaying

**Solution:**
1. Check browser console (F12) for errors
2. Verify database has items:
```bash
sudo -u postgres psql canteen_db
SELECT * FROM items;
\q
```
3. If no items, the app should create sample items automatically on first run

### 4. Login Issues

#### Cannot login with admin/admin123

**Solution:**
```bash
# Reset admin password
sudo -u postgres psql canteen_db

# Delete existing admin
DELETE FROM cashiers WHERE username = 'admin';

# Exit and restart the app
\q
python app.py
```

The app will recreate the admin user automatically.

#### Error: "Invalid credentials"

**Solution:**
1. Double-check username and password (case-sensitive)
2. Try registering a new account
3. Check database:
```bash
sudo -u postgres psql canteen_db
SELECT username, full_name FROM cashiers;
\q
```

### 5. Installation Issues

#### Error: "pg_config executable not found"

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install libpq-dev python3-dev

# macOS
brew install postgresql

# Then reinstall psycopg2
pip install psycopg2-binary
```

#### Error: "Permission denied" during setup

**Solution:**
```bash
# Make scripts executable
chmod +x setup.sh
chmod +x verify_setup.py

# Run with proper permissions
./setup.sh
```

### 6. Performance Issues

#### Application is slow

**Solution:**
1. Check PostgreSQL is running properly
2. Check system resources (RAM, CPU)
3. Reduce number of items if database is too large
4. Add indexes to database:
```sql
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_transactions_date ON transactions(created_at);
```

#### Browser freezing

**Solution:**
1. Clear browser cache
2. Reduce items displayed (modify items grid max-height in CSS)
3. Use Chrome/Firefox (better performance)

### 7. Printing Issues

#### Receipt not printing correctly

**Solution:**
1. Use Print Preview first (Ctrl+P)
2. Check print CSS in `styles.css`
3. Try "Print to PDF" first to verify layout
4. Adjust printer settings (margins, orientation)

### 8. Data Issues

#### Stock not updating after transaction

**Solution:**
1. Check browser console for errors
2. Verify transaction was successful:
```bash
sudo -u postgres psql canteen_db
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;
\q
```
3. Refresh the page
4. Check database trigger/constraints

#### Lost all data

**Solution:**
If you have a backup:
```bash
# Restore from backup
psql -U postgres canteen_db < backup.sql
```

If no backup, you'll need to re-add items manually.

**Prevention**: Create regular backups:
```bash
# Backup database
pg_dump -U postgres canteen_db > backup_$(date +%Y%m%d).sql

# Schedule automatic backups with cron
0 2 * * * pg_dump -U postgres canteen_db > /backups/canteen_$(date +\%Y\%m\%d).sql
```

### 9. Platform-Specific Issues

#### Windows: "python is not recognized"

**Solution:**
1. Add Python to PATH during installation
2. Or use `py` instead of `python`:
```cmd
py app.py
```

#### macOS: "command not found: psql"

**Solution:**
```bash
# Install PostgreSQL
brew install postgresql

# Add to PATH
echo 'export PATH="/usr/local/opt/postgresql/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### Linux: "peer authentication failed"

**Solution:**
Edit PostgreSQL config:
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Change this line:
# local   all   postgres   peer
# To:
# local   all   postgres   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 10. Verification Steps

Run the verification script to check everything:
```bash
python verify_setup.py
```

This will check:
- ✅ Python version
- ✅ PostgreSQL installation
- ✅ Required Python packages
- ✅ Database connectivity

## Still Having Issues?

### Debug Mode

Enable detailed error messages:
1. Edit `app.py`:
```python
app.run(debug=True, port=5000)  # Make sure debug=True
```

2. Check terminal output for detailed errors

3. Check browser console (F12) for frontend errors

### Get Help

1. Check the README.md for detailed documentation
2. Review Flask documentation: https://flask.palletsprojects.com/
3. Review PostgreSQL documentation: https://www.postgresql.org/docs/
4. Check browser console for JavaScript errors
5. Review server logs in terminal

### System Information Needed for Support

If seeking help, provide:
- Operating System (Windows/Mac/Linux + version)
- Python version (`python --version`)
- PostgreSQL version (`psql --version`)
- Error messages (exact text)
- Browser console errors (F12 → Console tab)
- Server terminal output

## Prevention Tips

1. **Regular Backups**: Backup your database daily
2. **Update Software**: Keep Python, PostgreSQL, and dependencies updated
3. **Monitor Logs**: Check application logs regularly
4. **Test Changes**: Test in development before production
5. **Document Changes**: Keep notes of configuration changes

---

Most issues can be resolved by:
1. ✅ Restarting the application
2. ✅ Checking PostgreSQL is running
3. ✅ Verifying database exists
4. ✅ Clearing browser cache
5. ✅ Reinstalling dependencies
