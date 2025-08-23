package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Collector CollectorConfig `yaml:"collector"`
	Shamva    ShamvaConfig    `yaml:"shamva"`
	Logging   LoggingConfig   `yaml:"logging"`
}

type CollectorConfig struct {
	Interval     string `yaml:"interval"`
	MaxRetries   int    `yaml:"max_retries"`
	InitialDelay string `yaml:"initial_delay"`
}

type ShamvaConfig struct {
	Endpoint string `yaml:"endpoint"`
	Token    string `yaml:"agent_token"`
	Timeout  string `yaml:"timeout"`
}

type LoggingConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

func DefaultConfig() *Config {
	return &Config{
		Collector: CollectorConfig{
			Interval:     "60s",
			MaxRetries:   3,
			InitialDelay: "30s",
		},
		Shamva: ShamvaConfig{
			Endpoint: "https://shamva.francocanzani.workers.dev/public/metrics",
			Token:    "",
			Timeout:  "30s",
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "text",
		},
	}
}

func (c *Config) GetIntervalDuration() (time.Duration, error) {
	return time.ParseDuration(c.Collector.Interval)
}

func (c *Config) GetInitialDelayDuration() (time.Duration, error) {
	return time.ParseDuration(c.Collector.InitialDelay)
}

func (c *Config) GetTimeoutDuration() (time.Duration, error) {
	return time.ParseDuration(c.Shamva.Timeout)
}

func (c *Config) Validate() error {

	if _, err := c.GetIntervalDuration(); err != nil {
		return fmt.Errorf("invalid collector interval '%s': %w", c.Collector.Interval, err)
	}

	if _, err := c.GetInitialDelayDuration(); err != nil {
		return fmt.Errorf("invalid initial delay '%s': %w", c.Collector.InitialDelay, err)
	}

	if _, err := c.GetTimeoutDuration(); err != nil {
		return fmt.Errorf("invalid timeout '%s': %w", c.Shamva.Timeout, err)
	}

	if c.Shamva.Endpoint == "" {
		return fmt.Errorf("shamva endpoint is required")
	}

	if c.Shamva.Token == "" {
		return fmt.Errorf("shamva agent token is required")
	}

	if c.Collector.MaxRetries < 0 || c.Collector.MaxRetries > 10 {
		return fmt.Errorf("max_retries must be between 0 and 10, got %d", c.Collector.MaxRetries)
	}

	return nil
}

func GetConfig(configPath string) (*Config, error) {

	config := DefaultConfig()

	if configPath == "" {
		configPath = "collector.yml"
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file not found: %s", configPath)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file '%s': %w", configPath, err)
	}

	if err := yaml.Unmarshal(data, config); err != nil {
		return nil, fmt.Errorf("failed to parse config file '%s': %w", configPath, err)
	}

	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

func FindConfigFile() (string, error) {
	locations := []string{
		"collector.yml",
		"./collector.yml",
		"/etc/shamva/collector.yml",
		"/usr/local/etc/shamva/collector.yml",
		filepath.Join(os.Getenv("HOME"), ".config", "shamva", "collector.yml"),
	}

	for _, path := range locations {
		if _, err := os.Stat(path); err == nil {
			absPath, err := filepath.Abs(path)
			if err != nil {
				return path, nil
			}
			return absPath, nil
		}
	}

	return "", fmt.Errorf("no collector.yml found in any of these locations: %v", locations)
}

func LoadConfig() (*Config, error) {
	configPath, err := FindConfigFile()
	if err != nil {
		return nil, err
	}

	return GetConfig(configPath)
}
