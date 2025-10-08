import './App.css';
import React, { useEffect, useState } from "react";
import axios from "axios";
import Game from "./components/Game";
import { FiShield } from "react-icons/fi";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

function App() {
  const [scoreboard, setScoreboard] = useState([]);
  const [showGame, setShowGame] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const fetchScoreboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/scoreboard`);
      setScoreboard(res.data);
    } catch (err) {
      console.error("Fetch scoreboard failed:", err);
    }
  };

  useEffect(() => {
    fetchScoreboard();
  }, []);

  // Prompt for player name before starting the game
  const handleStartMatch = () => {
    const name = prompt("Enter your Name:");
    if (name && name.trim() !== "") {
      setPlayerName(name);
      setShowGame(true);
    } else {
      alert("Please enter a valid name to start the match.");
    }
  };

  const handleGameComplete = (result) => {
    setShowGame(false);
    fetchScoreboard(); // Refresh scoreboard
    // Optional: send result to backend
    // axios.post(`${API_BASE}/api/result`, { ...result, nickname: playerName });
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Think Like a Hacker. Defend Like a Pro</h1>
        <h2>" Welcome to Cybersecurity Awareness Challenge Game "</h2>
      </header>

      <main>
        {!showGame && (
          <div className="start-game">
            <button className="btn-primary" onClick={handleStartMatch}>
              Start New Match
            </button>
          </div>
        )}

        {showGame && (
          <Game
            playerName={playerName}
            apiBase={API_BASE}
            onComplete={handleGameComplete}
          />
        )}

        <section className="scoreboard">
          <h2>Recent Matches</h2>
          {scoreboard.length === 0 ? (
            <p className="empty">No matches yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="score-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Defender</th>
                    <th>Attacker</th>
                    <th>Time(s)</th>
                    <th>Winner</th>
                    <th>Awareness Level</th>
                    <th>Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreboard.map((r, i) => (
                    <tr key={i} className={r.winner === r.nickname ? "winner-row" : ""}>
                      <td>{r.nickname}</td>
                      <td>{r.defender_score}</td>
                      <td>{r.attacker_score}</td>
                      <td>{r.time_sec}</td>
                      <td>
                        {r.winner} {r.winner === r.nickname && <FiShield className="shield-icon" />}
                      </td>
                      <td>{r.predicted_level}</td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>© 2025 Cyber Awareness Dashboard</p>
      </footer>
    </div>
  );
}

export default App;
