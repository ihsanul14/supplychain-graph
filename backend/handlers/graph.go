package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"github.com/yourusername/supplychain-graph/db"
)

type GraphHandler struct {
	DB *db.DB
}

type VulnerabilityImpact struct {
	VulnerabilityID string   `json:"vulnerability_id"`
	Severity        string   `json:"severity"`
	SourceVersion   string   `json:"source_version"`
	AffectedPath    []string `json:"affected_path"`
	ImpactedPackage string   `json:"impacted_package"`
	Depth           int64    `json:"depth"`
}

func (h *GraphHandler) GetVulnerabilityImpact(w http.ResponseWriter, r *http.Request) {
	cveID := chi.URLParam(r, "cveId")
	if cveID == "" {
		http.Error(w, "cveId parameter is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	session := h.DB.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	cypher := `
	MATCH path = (v:Vulnerability {id: $cveId})<-[:HAS_VULNERABILITY]-(leaf:Version)<-[:DEPENDS_ON*0..5]-(dependent:Version)<-[:HAS_VERSION]-(pkg:Package)
	RETURN 
		v.id AS cveId,
		v.severity AS severity,
		leaf.id AS sourceVersion,
		[n IN nodes(path) WHERE NOT 'Package' IN labels(n) | 
			CASE 
				WHEN 'Vulnerability' IN labels(n) THEN n.id
				WHEN 'Version' IN labels(n) THEN n.id
				ELSE COALESCE(n.name, n.id)
			END
		] AS pathNodes,
		pkg.name AS impactedPackage,
		length(path) - 1 AS depth
	ORDER BY depth ASC
	`

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, cypher, map[string]interface{}{"cveId": cveID})
		if err != nil {
			return nil, err
		}

		var impacts []VulnerabilityImpact
		for res.Next(ctx) {
			rec := res.Record()

			cve, _ := rec.Get("cveId")
			sev, _ := rec.Get("severity")
			src, _ := rec.Get("sourceVersion")
			pNodes, _ := rec.Get("pathNodes")
			dp, _ := rec.Get("depth")

			rawPath := pNodes.([]interface{})
			pathStr := make([]string, len(rawPath))
			for i, v := range rawPath {
				pathStr[i] = v.(string)
			}

			impacts = append(impacts, VulnerabilityImpact{
				VulnerabilityID: cve.(string),
				Severity:        sev.(string),
				SourceVersion:   src.(string),
				AffectedPath:    pathStr,
				Depth:           dp.(int64),
			})
		}
		return impacts, nil
	})

	if err != nil {
		http.Error(w, "Failed to query database: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

type CreateVulnerabilityPayload struct {
	CVEID         string `json:"cve_id"`
	Severity      string `json:"severity"`
	TargetVersion string `json:"target_version"` // e.g., "core-utils@1.0.0"
}

// CreateVulnerability inserts a CVE and links it to a Version node using MERGE
func (h *GraphHandler) CreateVulnerability(w http.ResponseWriter, r *http.Request) {
	var payload CreateVulnerabilityPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if payload.CVEID == "" || payload.Severity == "" || payload.TargetVersion == "" {
		http.Error(w, "cve_id, severity, and target_version are required fields", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	session := h.DB.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	// Parameterised Cypher Write Query using MERGE on all nodes to prevent silent MATCH failures
	cypher := `
	MERGE (ver:PackageVersion {id: $targetVersion})
	MERGE (v:Vulnerability {id: $cveId})
	ON CREATE SET v.severity = $severity, v.createdAt = timestamp()
	ON MATCH SET v.severity = $severity
	MERGE (ver)-[:HAS_VULNERABILITY]->(v)
	RETURN v.id AS cveId, v.severity AS severity, ver.id AS versionId
	`

	result, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, cypher, map[string]interface{}{
			"cveId":         payload.CVEID,
			"severity":      payload.Severity,
			"targetVersion": payload.TargetVersion,
		})
		if err != nil {
			return nil, err
		}

		if res.Next(ctx) {
			return res.Record().AsMap(), nil
		}

		// If no record was produced, return an explicit error rather than failing silently
		return nil, http.ErrNoLocation
	})

	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Vulnerability created and linked successfully",
		"cve_id":  payload.CVEID,
		"data":    result,
	})
}

func (h *GraphHandler) GetVulnerabilities(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	session := h.DB.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	cypher := `
	MATCH (v:Vulnerability)
	RETURN v.id AS id, COALESCE(v.name, v.id) AS name, v.severity AS severity
	ORDER BY v.id ASC
	`

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, cypher, nil)
		if err != nil {
			return nil, err
		}

		type VulnOption struct {
			ID       string `json:"id"`
			Name     string `json:"name"`
			Severity string `json:"severity"`
		}

		var options []VulnOption
		for res.Next(ctx) {
			rec := res.Record()
			id, _ := rec.Get("id")
			name, _ := rec.Get("name")
			sev, _ := rec.Get("severity")

			options = append(options, VulnOption{
				ID:       id.(string),
				Name:     name.(string),
				Severity: sev.(string),
			})
		}
		return options, nil
	})

	if err != nil {
		http.Error(w, "Failed to query vulnerabilities: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *GraphHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	err := h.DB.Driver.VerifyConnectivity(ctx)
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"status": "UNHEALTHY", "error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "HEALTHY", "database": "CognoDB Connected"})
}
