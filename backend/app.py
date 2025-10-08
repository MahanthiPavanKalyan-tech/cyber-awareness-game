# backend/app.py
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3, os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'simulator.db')

app = Flask(__name__)
CORS(app)

# ✅ Flag to make sure DB is initialized only once
db_initialized = False

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

# 🛠 Replaced before_first_request with before_request + flag
@app.before_request
def init_db_once():
    global db_initialized
    if not db_initialized:
        db = get_db()
        db.execute('''
        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nickname TEXT,
          defender_score INTEGER,
          attacker_score INTEGER,
          time_sec REAL,
          winner TEXT,
          predicted_level TEXT,
          created_at TEXT
        )''')
        db.commit()
        db_initialized = True
        print("✅ Database initialized")

@app.route('/api/result', methods=['POST'])
def result():
    data = request.get_json()

    # Get values from frontend
    defender = int(data.get('defenderScore', 0))
    attacker = int(data.get('attackerScore', 0))
    time_sec = float(data.get('timeSec', 0))
    nickname = data.get('nickname', 'anonymous')
    predicted_level = data.get('predicted_level', 'Beginner').strip()

    # Determine winner
    winner = nickname if defender > attacker else "Attacker" if attacker > defender else "Draw"

    db = get_db()
    db.execute('''
      INSERT INTO matches (nickname, defender_score, attacker_score, time_sec, winner, predicted_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (nickname, defender, attacker, time_sec, winner, predicted_level, datetime.utcnow().isoformat()))
    db.commit()

    return jsonify({'winner': winner, 'predicted_level': predicted_level})

@app.route('/api/scoreboard')
def scoreboard():
    cur = get_db().execute('SELECT * FROM matches ORDER BY created_at DESC LIMIT 20')
    return jsonify([dict(r) for r in cur.fetchall()])

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # bind to 0.0.0.0 so Render can reach it
    app.run(host="0.0.0.0", port=port)
