package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"github.com/yourusername/supplychain-graph/config"
)

type DB struct {
	Driver neo4j.DriverWithContext
}

func InitDB(cfg *config.Config) (*DB, error) {
	driver, err := neo4j.NewDriverWithContext(
		cfg.URI,
		neo4j.BasicAuth(cfg.User, cfg.Password, ""),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create driver: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := driver.VerifyConnectivity(ctx); err != nil {
		return nil, fmt.Errorf("database connectivity check failed: %w", err)
	}

	log.Println("Successfully connected to CognoDB instance")
	return &DB{Driver: driver}, nil
}
