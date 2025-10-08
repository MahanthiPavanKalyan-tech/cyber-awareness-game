// src/components/Game.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const DEFENDER_ACTIONS = ["Deny", "Identify", "Ignore", "Scan", "Backup", "Report"];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const BASE_TURNS = [
  {
    attacker: "Access",
    defender: "Deny",
    result: "Blocked",
    reasoning: `1️⃣ Attacker played: Access

Trying to get unauthorized entry into a system, e.g., login brute force, connection attempt, or exploit to gain entry.

✅ Correct: Deny

Why: You need to block the unauthorized access attempt immediately at firewall, authentication gateway, or endpoint. Deny stops the attack in real time by cutting the connection or refusing credentials.

Why others are not best:

Identify: Good to investigate who’s trying, but doesn’t stop the access attempt in real time.

Ignore: Ignoring an active intrusion allows it to continue; not acceptable.

Scan: Scanning won’t block an active unauthorized login.

Backup: Backup doesn’t stop the intrusion.

Report: Important to alert security, but blocking must happen first.`
  },
  {
    attacker: "Chat",
    defender: "Identify",
    result: "Verified",
    reasoning: `2️⃣ Attacker played: Chat

Social engineering through chat platforms (Slack, Teams, WhatsApp, etc.) pretending to be someone trusted.

✅ Correct: Identify

Why: The best immediate action is to verify the identity of the person contacting you outside the chat channel (e.g., call their known number). This prevents manipulation.

Why others are not best:

Deny: You can block the contact later, but first make sure it’s not a legitimate colleague.

Ignore: Ignoring might work, but proper security requires verifying — sometimes attackers mimic urgent real requests.

Scan: Nothing to scan here; it’s social engineering.

Backup: Irrelevant.

Report: Should follow after you confirm it’s a scam.`
  },
  {
    attacker: "Click",
    defender: "Ignore",
    result: "Ignored",
    reasoning: `3️⃣ Attacker played: Click

Trying to get you to click a malicious link.

✅ Correct: Ignore

Why: Not clicking stops the malicious redirection or exploit immediately.

Why others are not best:

Deny: No connection to deny yet.

Identify: Useful after ignoring; not immediate.

Scan: Not needed if you haven’t clicked.

Backup: Irrelevant for prevention.

Report: Important follow-up, but ignoring is first.`
  },
  {
    attacker: "Malware",
    defender: "Scan",
    result: "Neutralized",
    reasoning: `4️⃣ Attacker played: Malware

Trying to install malicious software (via file, exploit, or delivery).

✅ Correct: Scan

Why: Running AV/EDR scans detects and removes malware before it spreads. Scanning is the immediate containment measure.

Why others are not best:

Deny: Can help block C2 connections, but the malware might already be on disk.

Identify: Malware binaries don’t rely on identity.

Ignore: Ignoring lets malware run.

Backup: Doesn’t remove malware; may back up infected files.

Report: Good follow-up, but you must contain first.`
  },
  {
    attacker: "Phishing",
    defender: "Report",
    result: "Blocked",
    reasoning: `5️⃣ Attacker played: Phishing

Trying to trick you into giving up credentials or info via email or fake sites.

✅ Correct: Report

Why: Reporting phishing ensures security teams can block the domain, alert others, and investigate. Individual ignoring is good but doesn’t help protect the organization. Reporting is the key action.

Why others are not best:

Deny: You can’t deny an inbound email effectively as a user.

Identify: You can try to spot phishing, but trained response is to report immediately for analysis.

Ignore: Better than clicking, but reporting helps stop the campaign for others.

Scan: Phishing usually doesn’t involve malware at first click.

Backup: Irrelevant here.`
  },
  {
    attacker: "Phone",
    defender: "Identify",
    result: "Blocked",
    reasoning: `6️⃣ Attacker played: Phone

Voice phishing (vishing) — pretending to be tech support, bank, etc.

✅ Correct: Identify

Why: Verify caller identity by calling back using official numbers, not the number they called from. Never give info over unverified calls.

Why others are not best:

Deny: Hanging up is good, but verifying identity is even better because it prevents confusion if it’s a real support call.

Ignore: Hanging up works, but security procedure often requires verification.

Scan: There’s no file to scan.

Backup: Irrelevant.

Report: Done after verification to alert others.`
  },
  {
    attacker: "USB",
    defender: "Scan",
    result: "Blocked",
    reasoning: `7️⃣ Attacker played: USB / Removable Media

Dropping infected USB drives hoping someone plugs them in.

✅ Correct: Scan

Why: Scanning removable media immediately with antivirus before opening anything is best. Ideally, don’t plug in at all — or use a sandboxed station.

Why others are not best:

Deny: Denying doesn’t apply unless there’s a system prompt.

Identify: You can’t really identify a USB drive.

Ignore: Ignoring is good if you never plug it in — but scanning is what trained responders do if the media must be checked.

Backup: Irrelevant for prevention.

Report: Should follow scanning or disposal.`
  },
  {
    attacker: "Fake Update",
    defender: "Ignore",
    result: "Ignored",
    reasoning: `8️⃣ Attacker played: Fake Update

A pop-up or email telling you to “update your software” from a malicious source.

✅ Correct: Ignore

Why: Ignore fake prompts; only update software through official channels (e.g., system settings, vendor site). Clicking fake updates is a common infection vector.

Why others are not best:

Deny: Deny doesn’t apply; it’s not an active connection yet.

Identify: You could investigate source later, but ignoring stops accidental install.

Scan: Not needed until you click.

Backup: Not relevant.

Report: Useful follow-up to block others.`
  },
  {
    attacker: "Data Theft",
    defender: "Deny",
    result: "Blocked",
    reasoning: `9️⃣ Attacker played: Data Theft

Attacker exfiltrating data (e.g., suspicious upload, unauthorized copying).

✅ Correct: Deny

Why: The immediate action is to block the connection or cut access to stop ongoing exfiltration.

Why others are not best:

Identify: You can investigate later. First, cut off the leak.

Ignore: Catastrophic — lets data be stolen.

Scan: Scanning won’t stop the transfer.

Backup: Doesn’t prevent theft.

Report: Important, but must happen after containment.`
  },
  {
    attacker: "Ransomware",
    defender: "Backup",
    result: "Neutralized",
    reasoning: `🔟 Attacker played: Ransomware

Encrypting files to demand ransom.

✅ Correct: Backup

Why: Restoring from clean backups is the correct recovery response. Denying or scanning won’t recover encrypted data. Backups ensure business continuity without paying ransom.

Why others are not best:

Deny: Denying might stop lateral movement, but encryption already happened.

Identify: Knowing who did it doesn’t recover files.

Ignore: Disastrous.

Scan: Might remove the ransomware, but doesn’t decrypt.

Report: Should follow backup/recovery.`
  }
];

function Game({ apiBase, playerName, onComplete }) {
  const [turns, setTurns] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [defenderScore, setDefenderScore] = useState(0);
  const [attackerScore, setAttackerScore] = useState(0);
  const [log, setLog] = useState([]);
  const [turnResult, setTurnResult] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(null);

  useEffect(() => {
    setTurns(shuffleArray(BASE_TURNS).slice(0, 10));

    const startTime = Date.now();
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (turns.length === 0) return <p>Loading game...</p>;

  const currentTurn = turns[turnIndex];

  const handleDefenderAction = (action) => {
    if (submitted || turnResult) return;

    let newD = defenderScore;
    let newA = attackerScore;
    let correct = false;
    let resultText = "";

    if (action === currentTurn.defender) {
      newD += 1;
      correct = true;
      resultText = `✅ You are correct! ${action} → ${currentTurn.result}`;
    } else {
      newA += 1;
      resultText = `❌ Wrong! Correct: ${currentTurn.defender} → ${currentTurn.result}`;
    }

    setDefenderScore(newD);
    setAttackerScore(newA);
    setTurnResult(resultText);
    setLastCorrect(correct);

    setLog(prev => [
      ...prev,
      `Turn ${turnIndex + 1}: Attacker: ${currentTurn.attacker} | ${playerName}: ${action} → ${resultText} (D:${newD}/A:${newA})`
    ]);
  };

  const nextTurn = () => {
    if (turnIndex === turns.length - 1 && !submitted) {
      setSubmitted(true);

      let winner = "Draw";
      if (defenderScore > attackerScore) winner = playerName;
      else if (defenderScore < attackerScore) winner = "Attacker";

      // ✅ Strict Manual Level Logic
      let predicted_level = "Cyber Learner";
      if (defenderScore >= 7) {
        predicted_level = "Cyber Aware";
      }

      axios.post(`${apiBase}/api/result`, {
        nickname: playerName,
        defenderScore,
        attackerScore,
        timeSec: Number(timeElapsed),
        winner,
        predicted_level: predicted_level.trim()
      })
      .then(() => onComplete({ defenderScore, attackerScore, winner, predicted_level }))
      .catch(err => {
        console.error("Failed to save match:", err);
        onComplete({ defenderScore, attackerScore, winner, predicted_level });
      });
      return;
    }

    setTurnIndex(turnIndex + 1);
    setTurnResult("");
    setShowReasoning(false);
    setLastCorrect(null);
  };

  return (
    <div className="game-panel" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 style={{ color: "#00ffea", marginBottom: 8 }}>Cybersecurity Defense Game</h2>
      <p>Player: <strong>{playerName}</strong> | Time: {timeElapsed}s</p>

      <div className="scoreboard-panel" style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ padding: 8, background: "#1f2937", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Defender</div>
          <div style={{ fontSize: 20, fontWeight: "600", color: "#00ffea" }}>{defenderScore}</div>
        </div>
        <div style={{ padding: 8, background: "#1f2937", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Attacker</div>
          <div style={{ fontSize: 20, fontWeight: "600", color: "#ff6b6b" }}>{attackerScore}</div>
        </div>
        <div style={{ padding: 8, background: "#1f2937", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Turn</div>
          <div style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>{turnIndex + 1}/{turns.length}</div>
        </div>
      </div>

      <div className="current-attacker" style={{ background: "#0f1724", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: "#9ca3af" }}>Attacker played:</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#ffd700" }}>{currentTurn.attacker}</div>

        {turnResult && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: lastCorrect ? "#4CAF50" : "#FF4444", fontWeight: 700 }}>{turnResult}</div>
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 14 }}
              >
                {showReasoning ? "Hide detailed reasoning ⬆️" : "See reasoning for all options ⬇️"}
              </button>
            </div>
            {showReasoning && <div style={{ marginTop: 10, background: "#0b1220", border: "1px solid rgba(255,255,255,0.04)", padding: 14, borderRadius: 8, color: "#e5e7eb", whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.45 }}>{currentTurn.reasoning}</div>}
            <div style={{ marginTop: 12 }}>
              <button onClick={nextTurn} style={{ background: "#06b6d4", color: "#012027", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 }}>
                Next Turn ➡️
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {DEFENDER_ACTIONS.map((action) => (
          <button key={action} onClick={() => handleDefenderAction(action)} disabled={!!turnResult} style={{ background: "#00ffea", border: "none", padding: "8px 10px", borderRadius: 8, cursor: turnResult ? "not-allowed" : "pointer", minWidth: 100, fontWeight: 700, color: "#042026" }}>
            {action}
          </button>
        ))}
      </div>

      <div className="log" style={{ maxHeight: 180, overflowY: "auto", background: "#071023", padding: 10, borderRadius: 8 }}>
        {log.length === 0 ? <div style={{ color: "#6b7280" }}>No moves yet.</div> : log.map((entry, i) => <div key={i} style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 6 }}>{entry}</div>)}
      </div>
    </div>
  );
}

export default Game;
