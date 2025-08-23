package client

import (
	"bytes"
	"collector/internal/collector"
	"encoding/json"
	"net/http"
)

var httpClient = &http.Client{}

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
