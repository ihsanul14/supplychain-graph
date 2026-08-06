package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	URI      string
	User     string
	Password string
	Port     string
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	uri := os.Getenv("NEO4J_URI")
	password := os.Getenv("NEO4J_PASSWORD")
	user := os.Getenv("NEO4J_USER")

	if uri == "" || password == "" {
		log.Fatal("Missing required environment variables: NEO4J_URI and NEO4J_PASSWORD must be set")
	}

	if user == "" {
		user = "cognodb"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "30001"
	}

	return &Config{
		URI:      uri,
		User:     user,
		Password: password,
		Port:     port,
	}
}
