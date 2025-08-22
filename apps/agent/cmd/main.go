package main

import (
	"io"
	"log"

	"agent/pkg/client"
	"agent/pkg/collector"
)

func main() {

	metrics, err := collector.Collect()

	if err != nil {
		log.Fatalf("Failed to collect metrics: %v", err)
	}

	resp, err := client.PostMetrics(metrics)

	if err != nil {
		log.Fatalf("Failed to send metrics: %v", err)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Fatalf("✗ Server returned error. Status: %d, Response: %s\n", resp.StatusCode, string(body))
	}
}
