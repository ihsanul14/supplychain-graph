export interface VulnerabilityImpact {
  vulnerability_id: string;
  severity: string;
  source_version: string;
  affected_path: string[];
  impacted_package: string;
  depth: number;
}

export interface HealthStatus {
  status: 'HEALTHY' | 'UNHEALTHY';
  database?: string;
  error?: string;
}