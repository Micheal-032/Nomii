from flask import Flask, render_template, request, jsonify, session
from datetime import datetime, timedelta
import random
import string
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# In-memory "database" for demonstration
users = {
    # Sample retailer user
    "NOMII-R-20231015104532": {
        "password": "StrongPass123!",
        "role": "R",
        "mobile": "9876543210",
        "gst": "22ABCDE1234F1Z5",
        "shopName": "Super Mart",
        "created_at": "2023-10-15 10:45:32"
    },
    # Sample farmer user
    "NOMII-F-20231016092015": {
        "password": "FarmerPass456!",
        "role": "F",
        "fullName": "Rajesh Kumar",
        "mobile": "9123456780",
        "village": "Green Fields",
        "landSize": "5 acres",
        "produce": "Rice, Wheat",
        "experience": "10",
        "created_at": "2023-10-16 09:20:15"
    }
}

# Track login attempts and lockouts
login_attempts = {}

@app.route('/')
def index():
    """Render the main index page"""
    return render_template('index.html')

@app.route('/signup', methods=['POST'])
def signup():
    """Handle user signup for all roles"""
    data = request.json
    role = data.get('role')
    
    # Validate required fields
    if not role or role not in ['R', 'S', 'D', 'F']:
        return jsonify({"success": False, "message": "Invalid role"}), 400
    
    # Generate unique login ID
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    login_id = f"NOMII-{role}-{timestamp}"
    
    # Create user object
    user = {
        "password": data.get('password'),
        "role": role,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Role-specific fields
    if role == 'R':  # Retailer
        user.update({
            "mobile": data.get('mobile'),
            "aadhaarLast4": data.get('aadhaarLast4'),
            "gst": data.get('gst'),
            "shopName": data.get('shopName')
        })
    elif role == 'F':  # Farmer
        user.update({
            "fullName": data.get('fullName'),
            "mobile": data.get('mobile'),
            "aadhaarLast4": data.get('aadhaarLast4'),
            "village": data.get('village'),
            "landSize": data.get('landSize'),
            "produce": data.get('produce'),
            "experience": data.get('experience'),
            "regId": data.get('regId') or ""
        })
    # Add other roles here (S, D)
    
    # Save user
    users[login_id] = user
    
    return jsonify({
        "success": True,
        "loginId": login_id,
        "message": "Account created successfully!"
    })

@app.route('/login', methods=['POST'])
def login():
    """Handle user login with security features"""
    data = request.json
    login_id = data.get('loginId')
    password = data.get('password')
    ip = request.remote_addr
    
    # Initialize attempt tracking for IP
    if ip not in login_attempts:
        login_attempts[ip] = {"count": 0, "lockout": None}
    
    # Check lockout status
    if login_attempts[ip]["lockout"]:
        if datetime.now() < login_attempts[ip]["lockout"]:
            remaining = (login_attempts[ip]["lockout"] - datetime.now()).seconds // 60
            return jsonify({
                "success": False,
                "message": f"Account locked. Try again in {remaining} minutes."
            }), 403
        else:
            # Reset after lockout expires
            login_attempts[ip] = {"count": 0, "lockout": None}
    
    # Validate credentials
    if login_id in users and users[login_id]["password"] == password:
        # Successful login
        login_attempts[ip] = {"count": 0, "lockout": None}
        session['user'] = login_id
        session.permanent = True
        return jsonify({
            "success": True,
            "role": users[login_id]["role"],
            "redirect": "/dashboard"
        })
    
    # Failed login
    login_attempts[ip]["count"] += 1
    
    # Check for lockout
    if login_attempts[ip]["count"] >= 5:
        lockout_time = datetime.now() + timedelta(minutes=5)
        login_attempts[ip]["lockout"] = lockout_time
        return jsonify({
            "success": False,
            "message": "Too many attempts. Account locked for 5 minutes."
        }), 403
    
    attempts_left = 5 - login_attempts[ip]["count"]
    return jsonify({
        "success": False,
        "message": f"Invalid credentials. {attempts_left} attempts remaining."
    }), 401

@app.route('/dashboard')
def dashboard():
    """User dashboard after successful login"""
    if 'user' not in session or session['user'] not in users:
        return "Unauthorized", 401
    
    user_id = session['user']
    user = users[user_id]
    
    # Render different dashboards based on role
    if user['role'] == 'R':
        return f"Retailer Dashboard - Welcome {user['shopName']}!"
    elif user['role'] == 'F':
        return f"Farmer Dashboard - Welcome {user['fullName']}!"
    # Add other roles here
    
    return "User Dashboard"

if __name__ == '__main__':
    app.run(debug=True, port=5000)