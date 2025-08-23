package client

import (
	"bytes"
	"collector/internal/collector"
	"collector/internal/config"
	"encoding/json"
	"net/http"
	"time"
)

var httpClient *http.Client

func init() {
	httpClient = &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:          100,
			MaxIdleConnsPerHost:   10,
			IdleConnTimeout:       90 * time.Second,
			DisableCompression:    false,
			DisableKeepAlives:     false,
			ResponseHeaderTimeout: 10 * time.Second,
		},
	}
}

func PostMetrics(cfg *config.Config, metrics collector.Metrics) (*http.Response, error) {
	if timeout, err := cfg.GetTimeoutDuration(); err == nil {
		httpClient.Timeout = timeout
	}

	jsonData, err := json.Marshal(metrics)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", cfg.Shamva.Endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.Shamva.Token)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}
