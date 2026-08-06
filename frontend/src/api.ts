import type { VulnerabilityImpact, HealthStatus } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:30001';

export async function fetchVulnerabilityImpact(cveId: string): Promise<VulnerabilityImpact[]> {
  const res = await fetch(`${API_BASE}/api/vulnerabilities/${encodeURIComponent(cveId)}/impact`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Server returned status ${res.status}: ${errorText}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Healthcheck failed with status ${res.status}`);
  }
  return res.json();
}

export interface VulnerabilityOption {
  id: string;
  name: string;
  severity: string;
}

export async function fetchVulnerabilities(): Promise<VulnerabilityOption[]> {
  const response = await fetch(`${API_BASE}/api/vulnerabilities`);
  if (!response.ok) {
    throw new Error('Failed to fetch vulnerabilities');
  }
  return response.json();
}

export interface CreateVulnerabilityPayload {
  cve_id: string;
  severity: string;
  target_version: string;
}

export async function createVulnerability(payload: CreateVulnerabilityPayload): Promise<void> {
  const response = await fetch(`${API_BASE}/api/vulnerabilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to report vulnerability (${response.status})`);
  }
}