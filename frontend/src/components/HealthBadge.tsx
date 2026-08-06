import { Show } from 'solid-js';
import type { Component, Resource } from 'solid-js';
import type { HealthStatus } from '../types';

interface HealthBadgeProps {
  health: Resource<HealthStatus>;
}

export const HealthBadge: Component<HealthBadgeProps> = (props) => {
  return (
    <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
      <Show
        when={!props.health.loading}
        fallback={
          <span style={{
            padding: "0.3rem 0.75rem",
            "border-radius": "9999px",
            "font-size": "0.8rem",
            background: "#1e293b",
            color: "#94a3b8",
            border: "1px solid #334155"
          }}>
            Connecting...
          </span>
        }
      >
        <Show
          when={!props.health.error && props.health()?.status === "HEALTHY"}
          fallback={
            <span style={{
              padding: "0.3rem 0.75rem",
              "border-radius": "9999px",
              "font-size": "0.8rem",
              "font-weight": "600",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              "align-items": "center",
              gap: "0.4rem"
            }}>
              <span style={{ width: "6px", height: "6px", "border-radius": "50%", background: "#ef4444" }} />
              DB DISCONNECTED
            </span>
          }
        >
          <span style={{
            padding: "0.3rem 0.75rem",
            "border-radius": "9999px",
            "font-size": "0.8rem",
            "font-weight": "600",
            background: "rgba(34, 197, 94, 0.15)",
            color: "#4ade80",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            display: "flex",
            "align-items": "center",
            gap: "0.4rem"
          }}>
            <span style={{ width: "6px", height: "6px", "border-radius": "50%", background: "#22c55e" }} />
            CognoDB CONNECTED
          </span>
        </Show>
      </Show>
    </div>
  );
};