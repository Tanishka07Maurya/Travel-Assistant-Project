import sqlite3
import json
from werkzeug.security import generate_password_hash, check_password_hash

DB_NAME = "travel_assistant.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 2. Saved Trips Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_itineraries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            query_title TEXT NOT NULL,
            days INTEGER NOT NULL,
            itinerary_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    """)

    conn.commit()
    conn.close()

def register_user(name, email, password):
    """Registers a new user with hashed credentials."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        hashed_pw = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name.strip(), email.strip().lower(), hashed_pw)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {"success": True, "user": {"id": user_id, "name": name.strip(), "email": email.strip().lower()}}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "An account with this email already exists."}
    finally:
        conn.close()

def authenticate_user(email, password):
    """Verifies user credentials."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return {"success": False, "error": "Invalid email or password."}

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

def save_trip(user_id, query_title, days, data):
    """Persists a generated trip into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO saved_itineraries (user_id, query_title, days, itinerary_data) VALUES (?, ?, ?, ?)",
        (user_id, query_title, days, json.dumps(data))
    )
    conn.commit()
    trip_id = cursor.lastrowid
    conn.close()
    return trip_id

def get_user_trips(user_id):
    """Retrieves all saved trips for a specific user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, query_title, days, itinerary_data, created_at FROM saved_itineraries WHERE user_id = ? ORDER BY id DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    trips = []
    for row in rows:
        trips.append({
            "id": row["id"],
            "queryTitle": row["query_title"],
            "days": row["days"],
            "data": json.loads(row["itinerary_data"]),
            "date": row["created_at"]
        })
    return trips