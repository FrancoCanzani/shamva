#!/usr/bin/env bash
set -e  # exit on error

# Usage: ./install.sh [AGENT_TOKEN]
# If no token provided, will prompt for one

AGENT_TOKEN=${1:-""}

# --- Detect OS and architecture ---
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
    ARCH="arm64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

# --- Download binary ---
URL="https://github.com/francocanzani/shamva/releases/latest/download/shamva-collector-${OS}-${ARCH}"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/shamva"
SERVICE_NAME="shamva-collector"

echo "📥 Downloading Shamva collector from $URL ..."
curl -sSL "$URL" -o "${INSTALL_DIR}/${SERVICE_NAME}"

chmod +x "${INSTALL_DIR}/${SERVICE_NAME}"

# --- Create config directory ---
mkdir -p "${CONFIG_DIR}"

# Prompt for token if not provided
if [ -z "$AGENT_TOKEN" ]; then
    echo "Enter your Shamva agent token:"
    read -s AGENT_TOKEN
    echo ""
fi

if [ -z "$AGENT_TOKEN" ]; then
    echo "❌ Agent token is required"
    exit 1
fi

# Create config if missing
if [ ! -f "${CONFIG_DIR}/collector.yml" ]; then
cat <<EOF > "${CONFIG_DIR}/collector.yml"
collector:
  interval: "60s"
  max_retries: 3
  initial_delay: "30s"

shamva:
  endpoint: "https://shamva.francocanzani.workers.dev/public/metrics"
  agent_token: "${AGENT_TOKEN}"
  timeout: "30s"

logging:
  level: "info"
  format: "text"
EOF
    echo "📝 Config created at ${CONFIG_DIR}/collector.yml with provided token"
fi

# --- Create systemd service ---
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Shamva Metrics Collector
After=network.target

[Service]
Type=simple
User=shamva
Group=shamva
ExecStart=${INSTALL_DIR}/${SERVICE_NAME}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
WorkingDirectory=/var/lib/shamva

[Install]
WantedBy=multi-user.target
EOF

# --- Create service user ---
if ! id "shamva" &>/dev/null; then
    useradd -r -s /bin/false shamva
    echo "👤 Created shamva service user"
fi

# --- Create data directory ---
mkdir -p /var/lib/shamva
chown shamva:shamva /var/lib/shamva

# --- Set proper permissions ---
chown root:shamva "${CONFIG_DIR}/collector.yml"
chmod 640 "${CONFIG_DIR}/collector.yml"

# --- Enable and start service ---
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl start "${SERVICE_NAME}"

echo "✅ Installation complete!"
echo "Config: ${CONFIG_DIR}/collector.yml"
echo "Service: systemctl status ${SERVICE_NAME}"
echo "Logs: journalctl -u ${SERVICE_NAME} -f"
