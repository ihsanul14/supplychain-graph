import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import type { VulnerabilityImpact } from '../types';

interface ImpactCardProps {
  impact: VulnerabilityImpact;
}

export const ImpactCard: Component<ImpactCardProps> = (props) => {
  return (
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      "border-radius": "12px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      "flex-direction": "column",
      "align-items": "flex-start",
      "text-align": "left",
      transition: "border-color 0.2s ease"
    }}>
      {/* Top Header Row */}
      <div style={{ 
        display: "flex", 
        "justify-content": "space-between", 
        "align-items": "center", 
        width: "100%",
        "margin-bottom": "1rem" 
      }}>
        <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
          <h3 style={{ margin: 0, color: "#f8fafc", "font-size": "1.1rem", "font-weight": "600" }}>
            {props.impact.impacted_package}
          </h3>
          <span style={{
            background: props.impact.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: props.impact.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
            padding: "0.15rem 0.55rem",
            "border-radius": "4px",
            "font-size": "0.75rem",
            "font-weight": "700",
            border: props.impact.severity === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            {props.impact.severity}
          </span>
        </div>
        
        <span style={{
          background: "#0f172a",
          border: "1px solid #334155",
          padding: "0.3rem 0.65rem",
          "border-radius": "6px",
          "font-size": "0.8rem",
          color: "#94a3b8",
          "font-weight": "500"
        }}>
          {props.impact.depth} Hop{props.impact.depth === 1 ? '' : 's'} Depth
        </span>
      </div>

      {/* Traversal Section (Strictly Left-Aligned) */}
      <div style={{ width: "100%", "font-size": "0.875rem" }}>
        <div style={{ 
          color: "#94a3b8", 
          "font-weight": "500", 
          "font-size": "0.8rem",
          "text-transform": "uppercase",
          "letter-spacing": "0.05em",
          "margin-bottom": "0.5rem",
          "text-align": "left"
        }}>
          Dependency Path Traversal
        </div>

        <div style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "flex-start",
          gap: "0.5rem",
          "flex-wrap": "wrap"
        }}>
          <For each={props.impact.affected_path}>
            {(node, idx) => (
              <>
                <span style={{
                  background: idx() === 0 ? "rgba(239, 68, 68, 0.15)" : "#0f172a",
                  color: idx() === 0 ? "#fca5a5" : "#cbd5e1",
                  border: idx() === 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #334155",
                  padding: "0.35rem 0.7rem",
                  "border-radius": "6px",
                  "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
                  "font-size": "0.825rem",
                  "font-weight": "500"
                }}>
                  {node}
                </span>
                <Show when={idx() < props.impact.affected_path.length - 1}>
                  <span style={{ color: "#475569", "font-size": "0.75rem" }}>➔</span>
                </Show>
              </>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};