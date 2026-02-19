const { useState, useEffect, useCallback, useRef } = React;

const SK = "req-mgmt-v4";
const IK = "req-mgmt-inbox-v4";
const BU = "https://solaredge-prod.atlassian.net/wiki";

const uid = () => Math.random().toString(36).substr(2, 9);

const B = ({ children, color = "#3b82f6" }) => (
  <span style={{
    background: color + "18",
    color,
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap"
  }}>
    {children}
  </span>
);

const TB = ({ type }) => {
  const c = {
    Req: "#16a34a",
    HL: "#9333ea",
    Def: "#0891b2",
    Fig: "#ea580c",
    TBD: "#dc2626",
    "N/A": "#64748b",
    Int: "#2563eb"
  };
  return React.createElement(B, { color: c[type] || "#64748b" }, type);
};

const RL = ({ rid, url, ti }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    title={ti || ""}
    style={{
      fontFamily: "monospace",
      fontSize: 11,
      color: "#3b82f6",
      fontWeight: 600,
      textDecoration: "none",
      borderBottom: "1px dotted #93c5fd"
    }}
  >
    {rid}
  </a>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0" }}>
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          padding: "10px 18px",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: active === t.id ? 600 : 400,
          borderBottom: active === t.id ? "2px solid #3b82f6" : "2px solid transparent",
          background: "none",
          color: active === t.id ? "#3b82f6" : "#64748b",
          marginBottom: -2,
          position: "relative"
        }}
      >
        {t.label}
        {t.badge > 0 && (
          <span style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "#ef4444",
            color: "#fff",
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 5px"
          }}>
            {t.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

const Config = ({ config, onChange }) => (
  <div>
    <h3 style={{ margin: "0 0 16px" }}>Settings</h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, maxWidth: 600 }}>
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Atlassian API Token</label>
        <input
          type="password"
          value={config.token}
          onChange={e => onChange({ ...config, token: e.target.value })}
          placeholder="Paste your Atlassian API token here"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
        />
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Get your token from: https://id.atlassian.com/manage-profile/security/api-tokens</p>
      </div>
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Req ID Prefix</label>
        <input
          value={config.prefix}
          onChange={e => onChange({ ...config, prefix: e.target.value })}
          placeholder="e.g., REQ"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
        />
      </div>
    </div>
    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
      Token Status: {config.token ? <span style={{ color: "#16a34a" }}>✓ Set</span> : <span style={{ color: "#dc2626" }}>✗ Not set</span>}
    </p>
  </div>
);

const Sources = ({ sources }) => (
  <div>
    <h3 style={{ margin: "0 0 16px" }}>Source Documents</h3>
    {!sources.length ? (
      <div style={{ textAlign: "center", padding: 48, border: "2px dashed #d1d5db", borderRadius: 12, color: "#94a3b8" }}>
        <div style={{ fontSize: 40 }}>📄</div>
        <div style={{ fontWeight: 600, color: "#64748b" }}>No sources yet</div>
      </div>
    ) : (
      sources.map(s => (
        <div key={s.pid} style={{ display: "flex", alignItems: "center", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 8, background: "#fafbfc" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Page ID: {s.pid}</div>
          </div>
        </div>
      ))
    )}
  </div>
);

const ReqTable = ({ reqs }) => {
  if (!reqs.length) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <div style={{ fontWeight: 600, color: "#64748b" }}>No requirements yet</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {[
          { l: "Total", v: reqs.length, c: "#3b82f6" }
        ].map(s => (
          <div key={s.l} style={{ flex: 1, padding: "10px 14px", background: s.c + "08", borderRadius: 8, border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "Content", "Type"].map(h => (
                <th key={h} style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #e2e8f0", fontWeight: 600, fontSize: 11, color: "#64748b" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reqs.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <td style={{ padding: "7px 8px", fontFamily: "monospace", fontSize: 11 }}>{r.id}</td>
                <td style={{ padding: "7px 8px", maxWidth: 400 }}>{r.content}</td>
                <td style={{ padding: "7px 8px" }}>{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function App() {
  const [sources, setSources] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [config, setConfig] = useState({ token: "", prefix: "REQ" });
  const [tab, setTab] = useState("config");
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);

  const importPage = async () => {
    if (!pageId || !config.token) {
      alert("Please enter Page ID and API Token");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fetch-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, token: config.token })
      });

      const data = await response.json();
      if (data.success) {
        setSources([...sources, { pid: pageId, title: data.page.title }]);
        setPageId("");
        alert("Page imported successfully!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error importing page: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1e293b" }}>
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #e2e8f0", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 20 }}>📋</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Requirements Management Tool</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {sources.length} sources · {reqs.length} reqs
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
        <Tabs
          tabs={[
            { id: "config", label: "⚙️ Settings", badge: 0 },
            { id: "sources", label: `📄 Sources (${sources.length})`, badge: 0 },
            { id: "table", label: `📊 Requirements (${reqs.length})`, badge: 0 }
          ]}
          active={tab}
          onChange={setTab}
        />

        <div style={{ marginTop: 20 }}>
          {tab === "config" && (
            <div>
              <Config config={config} onChange={setConfig} />
              <div style={{ marginTop: 24, padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
                <h3 style={{ margin: "0 0 12px" }}>Import Confluence Page</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={pageId}
                    onChange={e => setPageId(e.target.value)}
                    placeholder="Enter Confluence Page ID"
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
                  />
                  <button
                    onClick={importPage}
                    disabled={loading}
                    style={{
                      padding: "8px 16px",
                      background: loading ? "#cbd5e1" : "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    {loading ? "Loading..." : "Import"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "sources" && <Sources sources={sources} />}
          {tab === "table" && <ReqTable reqs={reqs} />}
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));