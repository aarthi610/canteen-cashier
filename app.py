from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='static')
CORS(app)

# Database configuration
DB_CONFIG = {
    'dbname': 'canteen_db',
    'user': 'postgres',
    'password': 'root',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create cashiers table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS cashiers (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create items table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create transactions table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            token_number VARCHAR(20) UNIQUE NOT NULL,
            cashier_id INTEGER REFERENCES cashiers(id),
            total_amount DECIMAL(10, 2) NOT NULL,
            payment_status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create transaction_items table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transaction_items (
            id SERIAL PRIMARY KEY,
            transaction_id INTEGER REFERENCES transactions(id),
            item_id INTEGER REFERENCES items(id),
            item_name VARCHAR(100),
            quantity INTEGER NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            subtotal DECIMAL(10, 2) NOT NULL
        )
    ''')
    
    # Insert default cashier if not exists
    cur.execute("SELECT * FROM cashiers WHERE username = 'admin'")
    if not cur.fetchone():
        password_hash = generate_password_hash('admin123')
        cur.execute(
            "INSERT INTO cashiers (username, password_hash, full_name) VALUES (%s, %s, %s)",
            ('admin', password_hash, 'Administrator')
        )
    
    # Insert sample items if table is empty
    cur.execute("SELECT COUNT(*) as count FROM items")
    if cur.fetchone()['count'] == 0:
        sample_items = [
            ('Samosa', 15.00, 100, 'Snacks'),
            ('Tea', 10.00, 200, 'Beverages'),
            ('Coffee', 20.00, 150, 'Beverages'),
            ('Vada Pav', 20.00, 80, 'Snacks'),
            ('Sandwich', 30.00, 50, 'Snacks'),
            ('Cold Drink', 25.00, 120, 'Beverages'),
            ('Paratha', 25.00, 60, 'Main Course'),
            ('Rice Plate', 50.00, 40, 'Main Course'),
        ]
        cur.executemany(
            "INSERT INTO items (name, price, stock, category) VALUES (%s, %s, %s, %s)",
            sample_items
        )
    
    conn.commit()
    cur.close()
    conn.close()

# Routes
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cashiers WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'full_name': user['full_name']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    
    if not username or not password or not full_name:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if username exists
    cur.execute("SELECT * FROM cashiers WHERE username = %s", (username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
    
    # Create new user
    password_hash = generate_password_hash(password)
    cur.execute(
        "INSERT INTO cashiers (username, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id",
        (username, password_hash, full_name)
    )
    user_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'user_id': user_id
    })

@app.route('/api/items', methods=['GET'])
def get_items():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM items ORDER BY name")
    items = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(items)

@app.route('/api/items', methods=['POST'])
def add_item():
    data = request.json
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock', 0)
    category = data.get('category', 'General')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO items (name, price, stock, category) VALUES (%s, %s, %s, %s) RETURNING id",
        (name, price, stock, category)
    )
    item_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True, 'item_id': item_id})

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    data = request.json
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE items SET name = %s, price = %s, stock = %s, category = %s WHERE id = %s",
        (data['name'], data['price'], data['stock'], data['category'], item_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM items WHERE id = %s", (item_id,))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.json
    cashier_id = data.get('cashier_id')
    items = data.get('items')
    total_amount = data.get('total_amount')
    
    # Generate token number
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    token_number = f'TKN{timestamp}'
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Create transaction
        cur.execute(
            "INSERT INTO transactions (token_number, cashier_id, total_amount, payment_status) VALUES (%s, %s, %s, %s) RETURNING id",
            (token_number, cashier_id, total_amount, 'completed')
        )
        transaction_id = cur.fetchone()['id']
        
        # Add transaction items and update stock
        for item in items:
            cur.execute(
                "INSERT INTO transaction_items (transaction_id, item_id, item_name, quantity, price, subtotal) VALUES (%s, %s, %s, %s, %s, %s)",
                (transaction_id, item['id'], item['name'], item['quantity'], item['price'], item['subtotal'])
            )
            
            # Update stock
            cur.execute(
                "UPDATE items SET stock = stock - %s WHERE id = %s",
                (item['quantity'], item['id'])
            )
        
        conn.commit()
        
        # Get the created transaction
        cur.execute(
            "SELECT t.*, c.full_name as cashier_name FROM transactions t JOIN cashiers c ON t.cashier_id = c.id WHERE t.id = %s",
            (transaction_id,)
        )
        transaction = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'transaction': transaction,
            'token_number': token_number
        })
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get transactions with items
    cur.execute('''
        SELECT 
            t.*,
            c.full_name as cashier_name,
            json_agg(
                json_build_object(
                    'item_name', ti.item_name,
                    'quantity', ti.quantity,
                    'price', ti.price,
                    'subtotal', ti.subtotal
                )
            ) as items
        FROM transactions t
        JOIN cashiers c ON t.cashier_id = c.id
        LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
        GROUP BY t.id, c.full_name
        ORDER BY t.created_at DESC
        LIMIT 100
    ''')
    transactions = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify(transactions)

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Total sales today
    cur.execute('''
        SELECT COALESCE(SUM(total_amount), 0) as total_sales
        FROM transactions
        WHERE DATE(created_at) = CURRENT_DATE
    ''')
    total_sales = cur.fetchone()['total_sales']
    
    # Total transactions today
    cur.execute('''
        SELECT COUNT(*) as total_transactions
        FROM transactions
        WHERE DATE(created_at) = CURRENT_DATE
    ''')
    total_transactions = cur.fetchone()['total_transactions']
    
    # Low stock items (stock < 20)
    cur.execute('''
        SELECT COUNT(*) as low_stock_count
        FROM items
        WHERE stock < 20
    ''')
    low_stock_count = cur.fetchone()['low_stock_count']
    
    # Total items
    cur.execute('SELECT COUNT(*) as total_items FROM items')
    total_items = cur.fetchone()['total_items']
    
    # Top selling items today
    cur.execute('''
        SELECT 
            ti.item_name,
            SUM(ti.quantity) as total_quantity,
            SUM(ti.subtotal) as total_revenue
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE DATE(t.created_at) = CURRENT_DATE
        GROUP BY ti.item_name
        ORDER BY total_quantity DESC
        LIMIT 5
    ''')
    top_items = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify({
        'total_sales': float(total_sales),
        'total_transactions': total_transactions,
        'low_stock_count': low_stock_count,
        'total_items': total_items,
        'top_items': top_items
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
