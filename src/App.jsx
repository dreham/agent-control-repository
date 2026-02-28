import { useState, useEffect } from "react";

// ─── API Configuration ──────────────────────────────────────
// Change this URL when you set up a permanent Cloudflare Tunnel
const API_BASE = "https://glory-earn-slope-emissions.trycloudflare.com";

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  "active": { label: "Working", bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.3)", dot: "#3b82f6" },
  "working": { label: "Working", bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.3)", dot: "#3b82f6" },
  "idle": { label: "Idle", bg: "rgba(120,120,140,0.15)", text: "#8b8fa3", border: "rgba(120,120,140,0.3)", dot: "#8b8fa3" },
  "paused": { label: "Paused", bg: "rgba(251,191,36,0.12)", text: "#fbbf24", border: "rgba(251,191,36,0.35)", dot: "#f59e0b" },
  "needs_input": { label: "Needs Input", bg: "rgba(251,191,36,0.12)", text: "#fbbf24", border: "rgba(251,191,36,0.35)", dot: "#f59e0b" },
  "completed": { label: "Completed", bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.3)", dot: "#22c55e" },
  "error": { label: "Error", bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.4)", dot: "#dc2626" },
  "blocked": { label: "Blocked", bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.3)", dot: "#ef4444" },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG["idle"];
}

function getStatusLabel(status, hasPendingQuestions) {
  if (hasPendingQuestions) return "Needs Input";
  const cfg = STATUS_CONFIG[status?.toLowerCase()];
  return cfg?.label || status || "Unknown";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const mins = Math.floor((now - then) / 60000);
  if (mins < 0) return "just now";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Status Pill ─────────────────────────────────────────────
function StatusPill({ status, hasPendingQuestions }) {
  const effectiveStatus = hasPendingQuestions ? "needs_input" : status;
  const cfg = getStatusConfig(effectiveStatus);
  const label = getStatusLabel(status, hasPendingQuestions);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px 3px 8px", borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      color: cfg.text, textTransform: "uppercase",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: cfg.dot,
        boxShadow: (effectiveStatus === "active" || effectiveStatus === "working" || effectiveStatus === "needs_input") ? `0 0 6px ${cfg.dot}` : "none",
        animation: (effectiveStatus === "active" || effectiveStatus === "working") ? "pulse 2s infinite" : "none",
      }} />
      {label}
    </span>
  );
}

// ─── Agent Card ──────────────────────────────────────────────
function AgentCard({ agent, onView }) {
  const [hovered, setHovered] = useState(false);
  const hasPQ = agent.pendingQuestions?.length > 0;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(agent)}
      style={{
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: hasPQ ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: 20, cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)",
        position: "relative", overflow: "hidden",
      }}
    >
      {hasPQ && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {agent.avatar}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f5", letterSpacing: -0.3, fontFamily: "'DM Sans', sans-serif" }}>
              {agent.name}
            </div>
            <div style={{ fontSize: 12, color: "#6b7094", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              {agent.purpose}
            </div>
          </div>
        </div>
        <StatusPill status={agent.status} hasPendingQuestions={hasPQ} />
      </div>

      {agent.currentTask && (
        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", marginBottom: 12,
          border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{ fontSize: 11, color: "#555a7b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, fontWeight: 600 }}>
            Current Task
          </div>
          <div style={{ fontSize: 13, color: "#c8cbe0", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            {agent.currentTask.summary?.length > 100 ? agent.currentTask.summary.slice(0, 100) + "…" : agent.currentTask.summary}
          </div>
        </div>
      )}

      {hasPQ && (
        <div style={{
          background: "rgba(251,191,36,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 12,
          border: "1px solid rgba(251,191,36,0.15)",
        }}>
          <div style={{ fontSize: 11, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, fontWeight: 600 }}>
            ⚠ Needs Your Input
          </div>
          <div style={{ fontSize: 13, color: "#e0d5b8", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            {agent.pendingQuestions[0].question?.length > 90 ? agent.pendingQuestions[0].question.slice(0, 90) + "…" : agent.pendingQuestions[0].question}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ fontSize: 11, color: "#4a4e6e", fontFamily: "'DM Sans', sans-serif" }}>
          {agent.lastActivity?.summary?.length > 45 ? agent.lastActivity.summary.slice(0, 45) + "…" : agent.lastActivity?.summary}
        </div>
        <div style={{ fontSize: 11, color: "#3d4160", fontFamily: "monospace" }}>
          {timeAgo(agent.lastActivity?.at)}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Detail Panel ──────────────────────────────────────
function AgentDetail({ agent, onClose, onAnswer }) {
  const [answer, setAnswer] = useState("");
  const [activeTab, setActiveTab] = useState("activity");
  const [sending, setSending] = useState(false);

  if (!agent) return null;

  const tabs = [
    { key: "activity", label: "Activity" },
    { key: "history", label: "History" },
    { key: "tools", label: "Tools" },
  ];

  const handleAnswer = async (questionId) => {
    if (!answer.trim()) return;
    setSending(true);
    await onAnswer(agent.id, questionId, answer);
    setAnswer("");
    setSending(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", justifyContent: "flex-end",
    }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }} />
      <div style={{
        position: "relative", width: "min(480px, 92vw)", height: "100%",
        background: "#0f1019", borderLeft: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto", padding: "28px 24px",
        animation: "slideIn 0.25s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, fontSize: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {agent.avatar}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f5", fontFamily: "'DM Sans', sans-serif", letterSpacing: -0.5 }}>
                {agent.name}
              </div>
              <div style={{ fontSize: 13, color: "#6b7094", marginTop: 3 }}>{agent.purpose}</div>
              <div style={{ marginTop: 6 }}><StatusPill status={agent.status} hasPendingQuestions={agent.pendingQuestions?.length > 0} /></div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: "#8b8fa3",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {agent.currentTask && (
          <div style={{
            background: "rgba(59,130,246,0.06)", borderRadius: 12, padding: 16, marginBottom: 20,
            border: "1px solid rgba(59,130,246,0.12)",
          }}>
            <div style={{ fontSize: 11, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 6 }}>
              Active Task
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e0e4f5", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
              {agent.currentTask.title}
            </div>
            <div style={{ fontSize: 13, color: "#9298b8", lineHeight: 1.6 }}>
              {agent.currentTask.summary}
            </div>
            <div style={{ fontSize: 11, color: "#4a4e6e", marginTop: 8, fontFamily: "monospace" }}>
              Started {timeAgo(agent.currentTask.startedAt)}
            </div>
          </div>
        )}

        {agent.pendingQuestions?.length > 0 && (
          <div style={{
            background: "rgba(251,191,36,0.06)", borderRadius: 12, padding: 16, marginBottom: 20,
            border: "1px solid rgba(251,191,36,0.15)",
          }}>
            <div style={{ fontSize: 11, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 10 }}>
              Pending Questions
            </div>
            {agent.pendingQuestions.map(q => (
              <div key={q.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: "#e0d5b8", lineHeight: 1.6, marginBottom: 10 }}>
                  {q.question}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer…"
                    onKeyDown={e => e.key === "Enter" && handleAnswer(q.id)}
                    style={{
                      flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8, padding: "8px 12px", color: "#e0e4f5", fontSize: 13,
                      outline: "none", fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <button
                    onClick={() => handleAnswer(q.id)}
                    disabled={sending}
                    style={{
                      background: sending ? "#8b7a40" : "#f59e0b", border: "none", borderRadius: 8, padding: "8px 16px",
                      color: "#0f1019", fontWeight: 700, fontSize: 12, cursor: sending ? "wait" : "pointer",
                      letterSpacing: 0.3,
                    }}>
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: "#555a7b", marginTop: 6, fontFamily: "monospace" }}>
                  Asked {timeAgo(q.askedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: "none", border: "none", padding: "10px 16px", cursor: "pointer",
                color: activeTab === t.key ? "#f0f0f5" : "#555a7b",
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                borderBottom: activeTab === t.key ? "2px solid #60a5fa" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "activity" && (
          <div>
            {(agent.recentLogs || []).map((log, i) => (
              <div key={log.id} style={{
                padding: "12px 0", borderBottom: i < (agent.recentLogs || []).length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, padding: "2px 8px",
                    borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "#6b7094",
                  }}>
                    {log.type?.replace("_", " ")}
                  </span>
                  <span style={{ fontSize: 10, color: "#3d4160", fontFamily: "monospace" }}>{timeAgo(log.at)}</span>
                </div>
                <div style={{ fontSize: 14, color: "#c8cbe0", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  {log.summary}
                </div>
                <div style={{ fontSize: 12, color: "#4a4e6e", marginTop: 4, lineHeight: 1.5 }}>
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {(agent.taskHistory || []).map((t, i) => (
              <div key={i} style={{
                padding: "12px 0", borderBottom: i < (agent.taskHistory || []).length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#c8cbe0", fontFamily: "'DM Sans', sans-serif" }}>{t.title}</div>
                <div style={{ fontSize: 13, color: "#6b7094", marginTop: 4 }}>{t.outcome}</div>
                <div style={{ fontSize: 10, color: "#3d4160", marginTop: 4, fontFamily: "monospace" }}>
                  Completed {timeAgo(t.completedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tools" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(agent.tools || []).map(tool => (
              <span key={tool} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#8b8fa3", fontFamily: "'DM Sans', sans-serif",
              }}>
                {tool}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {["Message", "Pause", "Stop"].map(action => (
            <button key={action} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
              background: action === "Stop" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
              color: action === "Stop" ? "#f87171" : "#8b8fa3",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Activity Feed ───────────────────────────────────────────
function ActivityFeed({ agents }) {
  const allLogs = agents.flatMap(a =>
    (a.recentLogs || []).map(l => ({ ...l, agentName: a.name, agentAvatar: a.avatar }))
  ).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "16px 20px",
      border: "1px solid rgba(255,255,255,0.04)", marginBottom: 24,
    }}>
      <div style={{ fontSize: 11, color: "#555a7b", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 12 }}>
        Recent Activity
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {allLogs.map((log, i) => (
          <div key={log.id + log.agentName + i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
          }}>
            <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>{log.agentAvatar}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8b8fa3", minWidth: 60, fontFamily: "'DM Sans', sans-serif" }}>
              {log.agentName}
            </span>
            <span style={{ fontSize: 12, color: "#6b7094", flex: 1 }}>{log.summary}</span>
            <span style={{ fontSize: 10, color: "#3d4160", fontFamily: "monospace", flexShrink: 0 }}>{timeAgo(log.at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Connection Status ───────────────────────────────────────
function ConnectionStatus({ connected, lastFetch }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
      borderRadius: 8, background: connected ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${connected ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: connected ? "#22c55e" : "#ef4444",
        boxShadow: `0 0 6px ${connected ? "#22c55e" : "#ef4444"}`,
        animation: connected ? "pulse 2s infinite" : "none",
      }} />
      <span style={{ fontSize: 11, color: connected ? "#4ade80" : "#f87171", fontWeight: 600 }}>
        {connected ? "Connected" : "Disconnected"}
      </span>
      {lastFetch && (
        <span style={{ fontSize: 10, color: "#3d4160", fontFamily: "monospace", marginLeft: 4 }}>
          {timeAgo(lastFetch)}
        </span>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function AgentControlCenter() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showFeed, setShowFeed] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAgents(data);
      setConnected(true);
      setLastFetch(new Date().toISOString());
      if (selectedAgent) {
        const updated = data.find(a => a.id === selectedAgent.id);
        if (updated) setSelectedAgent(updated);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAnswer = async (agentId, questionId, answer) => {
    try {
      await fetch(`${API_BASE}/agents/${agentId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      await fetchAgents();
    } catch (err) {
      console.error("Failed to send answer:", err);
    }
  };

  const needsInput = agents.filter(a => a.pendingQuestions?.length > 0).length;
  const statusOrder = { "needs_input": 0, "active": 1, "working": 1, "paused": 2, "blocked": 3, "error": 4, "idle": 5, "completed": 6 };

  const filtered = agents
    .filter(a => {
      const hasPQ = a.pendingQuestions?.length > 0;
      if (statusFilter === "Needs Input" && !hasPQ) return false;
      if (statusFilter === "Working" && a.status !== "active" && a.status !== "working") return false;
      if (statusFilter === "Idle" && a.status !== "idle") return false;
      if (statusFilter === "Completed" && a.status !== "completed") return false;
      if (statusFilter === "Error" && a.status !== "error") return false;
      if (statusFilter === "Blocked" && a.status !== "blocked") return false;
      if (statusFilter === "Paused" && a.status !== "paused") return false;
      if (statusFilter !== "All" && statusFilter !== "Needs Input" && statusFilter !== "Working" && statusFilter !== "Idle" && statusFilter !== "Completed" && statusFilter !== "Error" && statusFilter !== "Blocked" && statusFilter !== "Paused") return true;
      if (search) {
        const q = search.toLowerCase();
        return a.name?.toLowerCase().includes(q) || a.purpose?.toLowerCase().includes(q) ||
          (a.currentTask?.summary || "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const aHasPQ = a.pendingQuestions?.length > 0;
      const bHasPQ = b.pendingQuestions?.length > 0;
      if (aHasPQ && !bHasPQ) return -1;
      if (!aHasPQ && bHasPQ) return 1;
      return (statusOrder[a.status?.toLowerCase()] ?? 99) - (statusOrder[b.status?.toLowerCase()] ?? 99);
    });

  const statuses = ["All", "Needs Input", "Working", "Idle", "Paused", "Completed", "Error"];

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0b12", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
          <div style={{ color: "#6b7094", fontSize: 14 }}>Connecting to Mac Mini…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0b12",
      color: "#e0e4f5",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        input::placeholder { color: #3d4160; }
      `}</style>

      <div style={{ padding: "20px 24px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚙️</span>
              <h1 style={{
                fontSize: 24, fontWeight: 700, letterSpacing: -0.8,
                background: "linear-gradient(135deg, #f0f0f5 0%, #8b8fa3 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Agent Control Center
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, marginLeft: 30 }}>
              <p style={{ fontSize: 12, color: "#4a4e6e" }}>
                Odin Framework • {agents.length} agents deployed
              </p>
              <ConnectionStatus connected={connected} lastFetch={lastFetch} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {needsInput > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
                borderRadius: 10, cursor: "pointer",
              }}
                onClick={() => setStatusFilter(statusFilter === "Needs Input" ? "All" : "Needs Input")}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", background: "#f59e0b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#0a0b12",
                }}>
                  {needsInput}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>Need Input</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#3d4160", fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents, tasks…"
              style={{
                width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#e0e4f5", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  background: statusFilter === s ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: statusFilter === s ? "#f0f0f5" : "#555a7b",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <button
          onClick={() => setShowFeed(!showFeed)}
          style={{
            background: "none", border: "none", cursor: "pointer", color: "#4a4e6e",
            fontSize: 12, marginBottom: 12, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <span style={{ transform: showFeed ? "rotate(90deg)" : "none", transition: "0.15s", display: "inline-block" }}>▶</span>
          {showFeed ? "Hide" : "Show"} Activity Feed
        </button>

        {showFeed && agents.length > 0 && <ActivityFeed agents={agents} />}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}>
          {filtered.map(agent => (
            <AgentCard key={agent.id} agent={agent} onView={setSelectedAgent} />
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#3d4160" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15 }}>No agents match your search</div>
          </div>
        )}
      </div>

      {selectedAgent && (
        <AgentDetail agent={selectedAgent} onClose={() => setSelectedAgent(null)} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
