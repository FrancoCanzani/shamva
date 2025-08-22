package client

import (
	"agent/pkg/collector"
	"bytes"
	"encoding/json"
	"net/http"
)

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

	client := &http.Client{}

	resp, err := client.Do(req)

	if err != nil {
		return nil, err
	}

	return resp, nil
}
