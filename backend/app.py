# backend/app.py
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3, os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'simulator.db')

app = Flask(__name__)
CORS(app)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

@app.before_first_request
def init():
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
    app.run(port=5000, debug=True)
