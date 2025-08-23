package main

import (
	"io"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"collector/internal/client"
	"collector/internal/collector"
	"collector/internal/config"
)

var (
	cfg    *config.Config
	logger *slog.Logger
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("Collector crashed", "panic", r)
			os.Exit(1)
		}
	}()

	var err error
	cfg, err = config.LoadConfig()
	if err != nil {
		slog.Error("Config load failed", "error", err)
		os.Exit(1)
	}

	logger = setupLogger()
	interval, _ := cfg.GetIntervalDuration()

	logger.Info("Shamva collector started", "interval", interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			collectAndSend()
		case <-sigChan:
			logger.Info("Shutting down")
			return
		}
	}
}

func setupLogger() *slog.Logger {
	var handler slog.Handler
	opts := &slog.HandlerOptions{Level: slog.LevelInfo}

	if cfg.Logging.Level == "debug" {
		opts.Level = slog.LevelDebug
	}

	if cfg.Logging.Format == "json" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}

func collectAndSend() {
	defer func() {
		if r := recover(); r != nil {
			logger.Error("Collection panic", "error", r)
		}
	}()

	metrics, err := collector.Collect()
	if err != nil {
		logger.Error("Collection failed", "error", err)
		return
	}

	initialDelay, _ := cfg.GetInitialDelayDuration()
	delay := initialDelay

	for i := range cfg.Collector.MaxRetries {
		resp, err := client.PostMetrics(cfg, metrics)

		if err != nil {
			logger.Warn("Send failed", "error", err, "attempt", i+1)
		} else {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()

			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				logger.Info("Metrics sent successfully")
				return
			}

			if resp.StatusCode >= 500 {
				logger.Warn("Server error", "status", resp.StatusCode)
			} else {
				logger.Error("Client error", "status", resp.StatusCode, "body", string(body))
				return
			}
		}

		if i < cfg.Collector.MaxRetries-1 {
			time.Sleep(delay)
			delay *= 2
		}
	}

	logger.Error("All retries failed")
}
