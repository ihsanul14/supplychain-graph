import { createSignal, createResource, Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import { fetchVulnerabilityImpact, fetchHealth, fetchVulnerabilities } from './api';
import { HealthBadge } from './components/HealthBadge';
import { ImpactCard } from './components/ImpactCard';
import { CreateVulnerabilityModal } from './components/CreateVulnerabilityModal';

export const App: Component = () => {
  const [selectedCve, setSelectedCve] = createSignal<string>('CVE-2024-1001');

  // SolidJS Resources
  const [health] = createResource(fetchHealth);
  const [vulnerabilities, { refetch: refetchVulns }] = createResource(fetchVulnerabilities);
  const [impacts, { refetch: refetchImpacts }] = createResource(selectedCve, fetchVulnerabilityImpact);

  const [isModalOpen, setIsModalOpen] = createSignal(false);

  // Callback triggered when a new advisory is added via the modal
  const handleVulnerabilityCreated = (newCveId?: string) => {
    // 1. Refetch dropdown choices from backend
    refetchVulns();
    
    // 2. Switch selection to the newly created CVE if provided
    if (newCveId) {
      setSelectedCve(newCveId);
    }

    // 3. Re-traverse dependency graph
    refetchImpacts();
  };

  return (
    <div style={{
      "min-height": "100vh",
      background: "#0f172a",
      color: "#f8fafc",
      "font-family": "'Inter', system-ui, -apple-system, sans-serif",
      padding: "2rem 1rem"
    }}>
      <div style={{ "max-width": "960px", margin: "0 auto" }}>
        
        {/* Header Bar */}
        <header style={{ 
          display: "flex", 
          "justify-content": "space-between", 
          "align-items": "center",
          "margin-bottom": "2rem",
          "flex-wrap": "wrap",
          gap: "1rem"
        }}>
          <div>
            <h1 style={{ margin: 0, "font-size": "1.75rem", "font-weight": "700" }}>
              Dependency Lineage Analyzer
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", "font-size": "0.9rem" }}>
              Transitive vulnerability trajectory & multi-hop impact graph
            </p>
          </div>

          <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
            <Show 
              when={!health.loading && !health.error && health()} 
              fallback={
                <div style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "0.4rem 0.8rem",
                  "border-radius": "20px",
                  color: "#fca5a5",
                  "font-size": "0.8rem",
                  "font-weight": "600"
                }}>
                  <span style={{ width: "8px", height: "8px", background: "#f87171", "border-radius": "50%" }}></span>
                  {health.error ? "DB OFFLINE" : "CONNECTING..."}
                </div>
              }
            >
              <HealthBadge health={health} />
            </Show>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "0.55rem 1.1rem",
                "border-radius": "8px",
                "font-weight": "600",
                "font-size": "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                "align-items": "center",
                gap: "0.4rem"
              }}
            >
              <span>＋</span> Report Vulnerability
            </button>
          </div>
        </header>

        {/* Dynamic Query Selector */}
        <section style={{
          background: "#1e293b",
          border: "1px solid #334155",
          "border-radius": "12px",
          padding: "1.25rem 1.5rem",
          "margin-bottom": "2rem",
          display: "flex",
          "align-items": "center",
          gap: "1rem"
        }}>
          <label for="cve-select" style={{ "font-weight": "600", color: "#cbd5e1", "font-size": "0.95rem", "white-space": "nowrap" }}>
            Target Vulnerability:
          </label>
          
          <select
            id="cve-select"
            value={selectedCve()}
            onChange={(e) => setSelectedCve(e.currentTarget.value)}
            disabled={vulnerabilities.loading}
            style={{
              flex: "1",
              padding: "0.65rem 1rem",
              "border-radius": "8px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "#f8fafc",
              "font-size": "0.95rem",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <For each={vulnerabilities()} fallback={<option>Loading vulnerabilities...</option>}>
              {(v) => (
                <option value={v.id}>
                  {v.id} — {v.name} ({v.severity})
                </option>
              )}
            </For>
          </select>
        </section>

        {/* Loading State */}
        <Show when={impacts.loading}>
          <div style={{
            padding: "3.5rem",
            "text-align": "center",
            background: "#1e293b",
            border: "1px solid #334155",
            "border-radius": "12px",
            color: "#94a3b8"
          }}>
            <p style={{ margin: 0, "font-size": "0.95rem", "font-weight": "500", color: "#cbd5e1" }}>
              Traversing graph relationships (1–5 hops deep)...
            </p>
          </div>
        </Show>

        {/* Error State */}
        <Show when={impacts.error}>
          <div style={{
            padding: "1.5rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            "border-radius": "12px",
            color: "#fca5a5"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", "font-size": "1rem", color: "#f87171" }}>
              Database Connection Failure
            </h4>
            <p style={{ margin: 0, "font-size": "0.9rem" }}>{impacts.error?.message}</p>
          </div>
        </Show>

        {/* Empty State */}
        <Show when={!impacts.loading && !impacts.error && (!impacts() || impacts()?.length === 0)}>
          <div style={{
            padding: "3.5rem",
            border: "2px dashed #334155",
            "text-align": "center",
            "border-radius": "12px",
            background: "#0f172a"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#cbd5e1", "font-size": "1.1rem" }}>No Downstream Affected Packages</h3>
            <p style={{ margin: 0, color: "#64748b", "font-size": "0.9rem" }}>
              No transitive dependencies were found linked to this vulnerability.
            </p>
          </div>
        </Show>

        {/* Active Results State */}
        <Show when={!impacts.loading && impacts() && (impacts()?.length ?? 0) > 0}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <For each={impacts()}>
              {(item) => <ImpactCard impact={item} />}
            </For>
          </div>
        </Show>

        {/* Modal Dialog Component */}
        <CreateVulnerabilityModal
          isOpen={isModalOpen()}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleVulnerabilityCreated}
        />
      </div>
    </div>
  );
};

export default App;