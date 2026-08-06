package db

import (
	"context"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func (db *DB) SeedData(ctx context.Context) error {
	session := db.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	seedQuery := `
	// Create Vulnerabilities
	MERGE (v1:Vulnerability {id: "CVE-2024-1001", name: "Remote Code Execution", severity: "CRITICAL"})
	MERGE (v2:Vulnerability {id: "CVE-2024-2002", name: "SQL Injection", severity: "HIGH"})

	// Create Packages & Versions
	MERGE (p1:Package {name: "core-utils"})
	MERGE (v10:Version {id: "core-utils@1.0.0", name: "1.0.0"})
	MERGE (p1)-[:HAS_VERSION]->(v10)
	MERGE (v10)-[:HAS_VULNERABILITY]->(v1)

	MERGE (p2:Package {name: "http-parser"})
	MERGE (v20:Version {id: "http-parser@2.1.0", name: "2.1.0"})
	MERGE (p2)-[:HAS_VERSION]->(v20)
	MERGE (v20)-[:DEPENDS_ON]->(v10)
	MERGE (v20)-[:HAS_VULNERABILITY]->(v2)

	MERGE (p3:Package {name: "api-gateway"})
	MERGE (v30:Version {id: "api-gateway@3.0.0", name: "3.0.0"})
	MERGE (p3)-[:HAS_VERSION]->(v30)
	MERGE (v30)-[:DEPENDS_ON]->(v20)

	MERGE (p4:Package {name: "web-dashboard"})
	MERGE (v40:Version {id: "web-dashboard@1.5.0", name: "1.5.0"})
	MERGE (p4)-[:HAS_VERSION]->(v40)
	MERGE (v40)-[:DEPENDS_ON]->(v30)

	// Create Maintainers
	MERGE (m1:Maintainer {id: "dev-01", name: "Alice Smith", email: "alice@security.org"})
	MERGE (m1)-[:MAINTAINS]->(p1)
	`

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		return tx.Run(ctx, seedQuery, nil)
	})
	return err
}
