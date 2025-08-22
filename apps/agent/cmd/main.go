package main

// ├── agent/                # The monitoring agent (Go is ideal here)
// │   ├── cmd/agent/        # main.go entrypoint
// │   ├── pkg/collect/      # CPU/RAM collectors
// │   ├── pkg/client/       # HTTP push client
// │   └── go.mod

import (
	"encoding/json"
	"fmt"
	"log"

	"agent/pkg/collector"
)

func main() {
	metrics, err := collector.Collect()
	if err != nil {
		log.Fatalf("Failed to collect metrics: %v", err)
	}
	jsonBytes, _ := json.MarshalIndent(metrics, "", "  ")
	fmt.Println(string(jsonBytes))
}
