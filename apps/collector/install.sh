#!/usr/bin/env bash
set -e  # exit on error

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
URL="https://yourtool.io/releases/monitor-agent-${OS}-${ARCH}"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/monitor-agent"

echo "📥 Downloading agent from $URL ..."
curl -sSL "$URL" -o "${INSTALL_DIR}/monitor-agent"

chmod +x "${INSTALL_DIR}/monitor-agent"

# --- Create config directory ---
mkdir -p "${CONFIG_DIR}"

# Create config if missing
if [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
cat <<EOF > "${CONFIG_DIR}/config.yaml"
token: "CHANGE_ME"
url: "https://api.yourtool.io"
interval: "30s"
EOF
    echo "📝 Config created at ${CONFIG_DIR}/config.yaml"
fi

# --- Create systemd service ---
SERVICE_FILE="/etc/systemd/system/monitor-agent.service"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Monitor Agent
After=network.target

[Service]
ExecStart=${INSTALL_DIR}/monitor-agent --config ${CONFIG_DIR}/config.yaml
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

# --- Enable and start service ---
systemctl daemon-reexec
systemctl enable monitor-agent
systemctl start monitor-agent

echo "✅ Installation complete!"
echo "Config: ${CONFIG_DIR}/config.yaml"
echo "Service: systemctl status monitor-agent"
echo "Logs: journalctl -u monitor-agent -f"
