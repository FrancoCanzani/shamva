# Shamva Collector

A lightweight system metrics collector that gathers CPU, memory, disk, network, and process information and sends it to the Shamva monitoring platform.

## Features

- **System Metrics**: CPU usage, memory utilization, disk space, network I/O
- **Process Monitoring**: Top CPU-consuming process and total process count
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals for clean service management
- **Retry Logic**: Exponential backoff for failed metric submissions
- **Production Ready**: Configurable timeouts, authentication, and security hardening

## Quick Start

### Prerequisites

- Go 1.25+ for building from source
- Valid Shamva API key
- Network access to Shamva API endpoint

### Installation

1. **Build the agent:**

```bash
go build -o shamva-agent cmd/main.go
```

2. **Install binary:**

```bash
sudo cp shamva-agent /usr/local/bin/
sudo chmod +x /usr/local/bin/shamva-agent
```

3. **Create service user:**

```bash
sudo useradd -r -s /bin/false shamva
sudo mkdir -p /var/lib/shamva
sudo chown shamva:shamva /var/lib/shamva
```

## Configuration

The agent can be configured via environment variables or a JSON configuration file.

### Environment Variables

| Variable                  | Default                         | Description                                |
| ------------------------- | ------------------------------- | ------------------------------------------ |
| `SHAMVA_API_KEY`          | **required**                    | Your Shamva API authentication key         |
| `SHAMVA_SERVER_URL`       | `https://api.shamva.io/metrics` | Metrics submission endpoint                |
| `SHAMVA_COLLECT_INTERVAL` | `60s`                           | How often to collect and send metrics      |
| `SHAMVA_MAX_RETRIES`      | `3`                             | Maximum retry attempts for failed requests |
| `SHAMVA_INITIAL_DELAY`    | `30s`                           | Initial delay between retries              |
| `SHAMVA_REQUEST_TIMEOUT`  | `30s`                           | HTTP request timeout                       |
| `SHAMVA_LOG_LEVEL`        | `info`                          | Logging level (debug, info, warn, error)   |
| `SHAMVA_CONFIG_FILE`      | -                               | Path to JSON configuration file            |

### Configuration File

Create a JSON file (e.g., `/etc/shamva/config.json`):

```json
{
  "server_url": "https://api.shamva.io/metrics",
  "api_key": "your-api-key-here",
  "collect_interval": "60s",
  "max_retries": 3,
  "initial_delay": "30s",
  "request_timeout": "30s",
  "log_level": "info"
}
```

## Production Deployment

### Systemd Service

1. **Copy the service file:**

```bash
sudo cp configs/shamva-agent.service /etc/systemd/system/
```

2. **Create environment file:**

```bash
sudo mkdir -p /etc/default
echo "SHAMVA_API_KEY=your-actual-api-key" | sudo tee /etc/default/shamva-agent
sudo chmod 600 /etc/default/shamva-agent
```

3. **Enable and start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable shamva-agent
sudo systemctl start shamva-agent
```

4. **Check service status:**

```bash
sudo systemctl status shamva-agent
sudo journalctl -u shamva-agent -f
```

### Security Considerations

- **API Key Protection**: Store API keys in environment files with restricted permissions
- **User Isolation**: Runs as dedicated `shamva` user with minimal privileges
- **System Protection**: Uses systemd security features (PrivateTmp, ProtectSystem, etc.)
- **Resource Limits**: Memory and CPU limits prevent resource exhaustion
- **Network Security**: Uses HTTPS with proper TLS verification

### Monitoring and Maintenance

**View logs:**

```bash
sudo journalctl -u shamva-agent -n 100
```

**Restart service:**

```bash
sudo systemctl restart shamva-agent
```

**Update configuration:**

```bash
sudo systemctl edit shamva-agent  # Override environment variables
sudo systemctl restart shamva-agent
```

**Check resource usage:**

```bash
sudo systemctl show shamva-agent --property=MemoryCurrent,CPUUsageNSec
```

## Metrics Collected

The agent collects the following system metrics:

- **System Info**: Hostname, platform/OS
- **CPU**: Overall CPU utilization percentage
- **Memory**: RAM usage percentage
- **Disk**: Primary disk usage percentage
- **Network**: Total bytes sent/received (MB)
- **Load**: 1-minute load average
- **Processes**: Top CPU consumer and total process count
- **Timestamp**: UTC timestamp in RFC3339 format

## Troubleshooting

### Common Issues

**Agent won't start:**

- Verify API key is set correctly
- Check network connectivity to Shamva API
- Review logs: `sudo journalctl -u shamva-agent`

**High resource usage:**

- Increase collection interval: `SHAMVA_COLLECT_INTERVAL=300s`
- Check for system issues affecting metric collection

**Authentication errors:**

- Verify API key is valid and not expired
- Check API key permissions in Shamva dashboard

**Network timeouts:**

- Increase timeout: `SHAMVA_REQUEST_TIMEOUT=60s`
- Check firewall rules and proxy settings

### Log Analysis

**Successful operation:**

```
✓ Metrics posted successfully
```

**Retry behavior:**

```
Server error 502: Bad Gateway (attempt 1/3)
✓ Metrics posted successfully
```

**Fatal errors:**

```
✗ Authentication error 401: Invalid API key
```

## Development

### Building from Source

```bash
cd shamva/apps/agent
go mod download
go build -o shamva-agent cmd/main.go
```

### Running Locally

```bash
export SHAMVA_API_KEY="your-test-key"
export SHAMVA_SERVER_URL="http://localhost:3000/metrics"
./shamva-agent
```

### Testing

```bash
go test ./...
```

## Support

- **Documentation**: [Shamva Documentation](https://docs.shamva.io)
- **Issues**: Report bugs or feature requests via GitHub issues
- **Support**: Contact support@shamva.io for production issues

## License

[Add your license information here]
