#!/usr/bin/env bash
set -e  # exit on error

# Usage: ./install-macos.sh [AGENT_TOKEN]
# If no token provided, will prompt for one

AGENT_TOKEN=${1:-""}

# --- Detect architecture ---
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
URL="https://github.com/francocanzani/shamva/releases/latest/download/shamva-collector-darwin-${ARCH}"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/shamva"
SERVICE_NAME="shamva-collector"

echo "📥 Downloading Shamva collector from $URL ..."
curl -sSL "$URL" -o "${INSTALL_DIR}/${SERVICE_NAME}"

chmod +x "${INSTALL_DIR}/${SERVICE_NAME}"

# --- Create config directory ---
sudo mkdir -p "${CONFIG_DIR}"

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
sudo tee "${CONFIG_DIR}/collector.yml" > /dev/null <<EOF
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

# --- Create service user ---
if ! dscl . -read /Users/shamva &>/dev/null; then
    sudo dscl . -create /Users/shamva
    sudo dscl . -create /Users/shamva UserShell /usr/bin/false
    sudo dscl . -create /Users/shamva RealName "Shamva Collector"
    sudo dscl . -create /Users/shamva UniqueID 999
    sudo dscl . -create /Users/shamva PrimaryGroupID 999
    echo "👤 Created shamva service user"
fi

# --- Create group ---
if ! dscl . -read /Groups/shamva &>/dev/null; then
    sudo dscl . -create /Groups/shamva
    sudo dscl . -create /Groups/shamva PrimaryGroupID 999
    echo "👥 Created shamva group"
fi

# --- Create data directory ---
sudo mkdir -p /var/lib/shamva
sudo chown shamva:shamva /var/lib/shamva

# --- Create log directory ---
sudo mkdir -p /var/log
sudo touch /var/log/shamva-collector.log
sudo chown shamva:shamva /var/log/shamva-collector.log

# --- Set proper permissions ---
sudo chown root:shamva "${CONFIG_DIR}/collector.yml"
sudo chmod 640 "${CONFIG_DIR}/collector.yml"

# --- Install launchd service ---
SERVICE_FILE="/Library/LaunchDaemons/com.shamva.collector.plist"

sudo cp shamva-collector.plist "$SERVICE_FILE"
sudo chown root:wheel "$SERVICE_FILE"
sudo chmod 644 "$SERVICE_FILE"

# --- Load service (but don't start yet) ---
sudo launchctl unload "$SERVICE_FILE" 2>/dev/null || true
sudo launchctl load "$SERVICE_FILE"

echo "✅ Installation complete!"
echo "Config: ${CONFIG_DIR}/collector.yml"
echo ""
echo "⚠️  IMPORTANT: You need to grant system permissions manually:"
echo "1. Go to System Preferences → Security & Privacy → Privacy"
echo "2. Select 'Full Disk Access' from the left sidebar"
echo "3. Click the lock icon and enter your password"
echo "4. Click '+' and add: /usr/local/bin/shamva-collector"
echo "5. Restart your Mac or log out/in"
echo ""
echo "After granting permissions, start the service:"
echo "  sudo launchctl start com.shamva.collector"
echo ""
echo "To manage the service:"
echo "  Start:   sudo launchctl start com.shamva.collector"
echo "  Stop:    sudo launchctl stop com.shamva.collector"
echo "  Restart: sudo launchctl unload $SERVICE_FILE && sudo launchctl load $SERVICE_FILE"
echo "  Logs:    tail -f /var/log/shamva-collector.log"
