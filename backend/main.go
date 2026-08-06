package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/yourusername/supplychain-graph/config"
	"github.com/yourusername/supplychain-graph/db"
	"github.com/yourusername/supplychain-graph/handlers"
)

func main() {
	cfg := config.LoadConfig()

	database, err := db.InitDB(cfg)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer database.Driver.Close(context.Background())

	// Execute database seed
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := database.SeedData(ctx); err != nil {
		log.Printf("Warning: Seeding failed or already populated: %v", err)
	} else {
		log.Println("Database seed verified/applied successfully.")
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
	}))

	h := &handlers.GraphHandler{DB: database}

	r.Get("/health", h.HealthCheck)
	r.Get("/api/vulnerabilities", h.GetVulnerabilities)
	r.Get("/api/vulnerabilities/{cveId}/impact", h.GetVulnerabilityImpact)
	r.Post("/api/vulnerabilities", h.CreateVulnerability)

	log.Printf("Server listening on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server exit: %v", err)
	}
}
