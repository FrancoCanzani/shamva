package client

import (
	"agent/internal/collector"
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

var httpClient = &http.Client{
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

func PostMetrics(metrics collector.Metrics) (*http.Response, error) {

	jsonData, err := json.Marshal(metrics)

	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "http://example.com", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)

	if err != nil {
		return nil, err
	}

	return resp, nil
}
