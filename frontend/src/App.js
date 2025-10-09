import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css'; 

// ----------------------------------------------------------------------
// 1. ABSOLUTE API URL DEFINITION (THE FIX)
// This is the CRITICAL line that ensures API calls go to your deployed backend.
// ----------------------------------------------------------------------
const API_BASE_URL = 'https://backend-6zp1z6j6o-mahanthipavankalyan-techs-projects.vercel.app';
// ----------------------------------------------------------------------


// --- Placeholder Components (Replace these with your actual UI) ---
const GameComponent = ({ onSubmit }) => (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
        <h2>Cyber Awareness Game</h2>
        {/* Replace this with your game logic */}
        <p>Game is running...</p>
        <button onClick={() => onSubmit(Math.floor(Math.random() * 100))}>
            Finish Game & Submit Result
        </button>
    </div>
);

const ScoreboardComponent = ({ scores }) => (
    <div style={{ padding: '20px', marginTop: '20px' }}>
        <h2>Scoreboard</h2>
        {scores.length === 0 ? (
            <p>Loading scores or no scores submitted yet...</p>
        ) : (
            <ol>
                {scores.map((score, index) => (
                    <li key={index}>
                        {score.nickname} - {score.score} points
                    </li>
                ))}
            </ol>
        )}
    </div>
);

const ResultSubmission = ({ score, onSave }) => {
    const [nickname, setNickname] = useState('');
    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
            <h2>Game Over! Score: {score}</h2>
            <input 
                type="text" 
                placeholder="Enter Nickname" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)} 
            />
            <button onClick={() => onSave(nickname, score)} disabled={!nickname}>
                Save Score
            </button>
        </div>
    );
};
// ----------------------------------------------------------------------


function App() {
    // State to manage what view to show (e.g., 'game', 'result', 'scoreboard')
    const [view, setView] = useState('game');
    const [lastScore, setLastScore] = useState(0);
    const [scoreboardData, setScoreboardData] = useState([]);
    const [loading, setLoading] = useState(false);

    // ----------------------------------------------------------------------
    // 2. FETCH SCOREBOARD (Uses the absolute URL)
    // ----------------------------------------------------------------------
    const fetchScoreboard = useCallback(async () => {
        setLoading(true);
        try {
            // CRITICAL FIX: Use the full API_BASE_URL
            const response = await axios.get(`${API_BASE_URL}/api/scoreboard`);
            setScoreboardData(response.data);
        } catch (error) {
            console.error('Error fetching scoreboard:', error);
            // Handle error (e.g., set an error message in state)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScoreboard();
    }, [fetchScoreboard]);

    // Function called when the user finishes the game
    const handleGameSubmit = (score) => {
        setLastScore(score);
        setView('result');
    };

    // ----------------------------------------------------------------------
    // 3. SUBMIT RESULT (Uses the absolute URL)
    // ----------------------------------------------------------------------
    const handleSaveScore = async (nickname, score) => {
        setLoading(true);
        const data = { nickname, score };

        try {
            // CRITICAL FIX: Use the full API_BASE_URL
            await axios.post(`${API_BASE_URL}/api/result`, data);
            
            // Refetch scores and switch to the scoreboard view
            await fetchScoreboard();
            setView('scoreboard');

        } catch (error) {
            console.error('Error submitting result:', error.response ? error.response.data : error.message);
            alert('Failed to save score. Check console for details.');
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <h1>Cyber Awareness App</h1>
            {loading && <p>Loading...</p>}

            <nav>
                <button onClick={() => setView('game')}>Play Game</button>
                <button onClick={() => setView('scoreboard')}>View Scoreboard</button>
            </nav>

            <hr />

            {view === 'game' && <GameComponent onSubmit={handleGameSubmit} />}
            
            {view === 'result' && (
                <ResultSubmission 
                    score={lastScore} 
                    onSave={handleSaveScore} 
                />
            )}
            
            {(view === 'scoreboard' || view === 'result') && (
                <ScoreboardComponent scores={scoreboardData} />
            )}
            
            {/* Optional: Add a button to force a scoreboard refresh */}
            <button onClick={fetchScoreboard} disabled={loading} style={{ marginTop: '20px' }}>
                Refresh Scores
            </button>
        </div>
    );
}

export default App;