package main

import (
	"io"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"collector/internal/client"
	"collector/internal/collector"
	"collector/internal/config"
)

var cfg *config.Config

func main() {
	cfg, err := config.LoadConfig()

	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	interval, _ := cfg.GetIntervalDuration()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			collectAndSend()
		case sig := <-sigChan:
			log.Printf("Received signal %v, shutting down gracefully...", sig)
			return
		}
	}
}

func collectAndSend() {
	metrics, err := collector.Collect()
	if err != nil {
		log.Printf("Failed to collect metrics: %v", err)
		return
	}

	initialDelay, _ := cfg.GetInitialDelayDuration()
	delay := initialDelay

	for i := range cfg.Collector.MaxRetries {
		resp, err := client.PostMetrics(cfg, metrics)

		if err != nil {
			log.Printf("Error posting metrics: %v (retry %d/%d)", err, i+1, cfg.Collector.MaxRetries)
		} else {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()

			switch {
			case resp.StatusCode >= 200 && resp.StatusCode < 300:
				log.Println("✓ Metrics posted successfully")
				return

			case resp.StatusCode >= 500:
				log.Printf("Server error %d: %s (retrying...)", resp.StatusCode, string(body))

			default:
				log.Printf("✗ Fatal error %d: %s", resp.StatusCode, string(body))
				return
			}
		}

		time.Sleep(delay)
		delay *= 2
	}
}
