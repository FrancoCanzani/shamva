# Shamva Collector

Think of the Shamva Collector like a **health monitor for your server or computer**! 

Just like how a doctor checks your heart rate and temperature, this little program checks how your computer is feeling and tells Shamva about it.

## What Does It Do?

The collector is like a tiny robot that lives on your computer and watches:

- **CPU** - How hard your computer's brain is working
- **Memory** - How much your computer is remembering at once  
- **Disk Space** - How full your computer's storage is
- **Network** - How much data your computer is sending/receiving

Every minute, it writes a little report and sends it to Shamva so you can see if your computer is happy or needs help!

## Step-by-Step Setup

### Step 1: Get Your Secret Code

1. Go to your Shamva dashboard (the website)
2. Click on "Collectors" 
3. Click "Add New Collector"
4. Give it a name like "My Laptop" 
5. Copy the secret token (it looks like `shamva_abc123...`)

### Step 2: Download the Collector

Pick the right one for your computer:

**For Mac users:**
```bash
# If you have a newer Mac (M1/M2)
curl -LO https://github.com/francocanzani/shamva/releases/latest/download/shamva-collector-darwin-arm64

# If you have an older Mac (Intel)
curl -LO https://github.com/francocanzani/shamva/releases/latest/download/shamva-collector-darwin-amd64
```

**For Linux users:**
```bash
wget https://github.com/francocanzani/shamva/releases/latest/download/shamva-collector-linux-amd64
```

**For Windows users:**
Download from the [releases page](https://github.com/francocanzani/shamva/releases/latest) and save it somewhere easy to find.

### Step 3: Make It Runnable

**Mac/Linux:**
```bash
chmod +x shamva-collector-*
```

### Step 4: Create the Instructions File

Create a file called `collector.yaml` and put this inside (replace `YOUR_SECRET_TOKEN` with the token from Step 1):

```yaml
# How often to check (60s = every minute)
collector:
  interval: "60s"
  max_retries: 3
  initial_delay: "30s"

# Where to send the reports
shamva:
  endpoint: "https://your-shamva-website.com/public/metrics"
  agent_token: "YOUR_SECRET_TOKEN_HERE"
  timeout: "30s"

# How chatty should it be
logging:
  level: "info"
  format: "text"
```

### Step 5: Test It

**Mac:**
```bash
./shamva-collector-darwin-arm64 -config collector.yaml
```

**Linux:**
```bash
./shamva-collector-linux-amd64 -config collector.yaml
```

**Windows:**
```cmd
shamva-collector-windows-amd64.exe -config collector.yaml
```

If it works, you'll see:
```
Shamva collector started
Metrics posted successfully
```

### Step 6: Run It Forever

To make it run all the time (like a background helper):

**Mac/Linux:**
```bash
nohup ./shamva-collector-* -config collector.yaml > collector.log 2>&1 &
```

**Windows:**
Use Task Scheduler or run it as a Windows Service.

## Easy Install Script (Mac Only)

If you're on Mac and want everything done automatically:

```bash
curl -sSL https://raw.githubusercontent.com/francocanzani/shamva/main/apps/collector/install-macos.sh | bash -s YOUR_SECRET_TOKEN
```

This will:
- Download the right version
- Put it in the right place  
- Create the config file
- Set up permissions

## What If Something Goes Wrong?

### "Permission denied" 
You might need to run with `sudo`:
```bash
sudo ./shamva-collector-* -config collector.yaml
```

### "Can't connect to server"
- Check your internet connection
- Make sure the endpoint URL is correct
- Verify your secret token is right

### "File not found"
- Make sure you downloaded the collector
- Check that `collector.yaml` is in the same folder

### Check the logs
Look at what the collector is saying:
```bash
tail -f collector.log
```

## How to Stop It

### Just Stop for Now
Find the process and stop it:
```bash
# Find it
ps aux | grep shamva-collector

# Stop it nicely (replace 1234 with the actual number)
kill 1234

# If it won't stop, force it
kill -9 1234
```

### Stop All Shamva Processes
```bash
# Kill all shamva collectors at once
pkill -f shamva-collector
```

## How to Update the Collector

### Check Your Current Version
```bash
./shamva-collector-* --version
```

### Update to Latest Version

**Method 1: Download New Version**
1. Stop the current collector (see "How to Stop It" above)
2. Download the latest version from [releases page](https://github.com/francocanzani/shamva/releases/latest)
3. Replace the old file with the new one
4. Start it again

**Method 2: Use the Install Script (Mac)**
```bash
# This will update automatically
curl -sSL https://raw.githubusercontent.com/francocanzani/shamva/main/apps/collector/install-macos.sh | bash -s YOUR_SECRET_TOKEN
```

**Method 3: Backup and Replace**
```bash
# Backup your current version
cp shamva-collector-* shamva-collector-backup

# Download new version
curl -LO https://github.com/francocanzani/shamva/releases/latest/download/shamva-collector-darwin-arm64

# Make it runnable
chmod +x shamva-collector-*

# Test it works
./shamva-collector-* -config collector.yaml

# If it works, remove backup
rm shamva-collector-backup
```

## How to Completely Remove the Collector

### Stop Everything First
```bash
# Stop the process
pkill -f shamva-collector

# Make sure it's really stopped
ps aux | grep shamva-collector
```

### Remove Files

**If you installed manually:**
```bash
# Remove the binary
rm shamva-collector-*
rm collector.yaml
rm collector.log

# If you put it in system directories
sudo rm /usr/local/bin/shamva-collector
sudo rm -rf /etc/shamva
sudo rm /var/log/shamva-collector.log
```

**If you used the install script (Mac):**
```bash
# Remove binary
sudo rm /usr/local/bin/shamva-collector

# Remove config
sudo rm -rf /etc/shamva

# Remove logs
sudo rm /var/log/shamva-collector.log

# Remove service user (optional)
sudo dscl . -delete /Users/shamva
sudo dscl . -delete /Groups/shamva

# Remove data directory
sudo rm -rf /var/lib/shamva
```

**Windows:**
- Delete the .exe file
- Delete collector.yaml
- Remove from Task Scheduler if you set it up there

### Remove from Shamva Dashboard
1. Go to your Shamva dashboard
2. Click on "Collectors"
3. Find your collector
4. Click "Delete" or "Remove"

## Advanced Configuration

### Change How Often It Reports
Edit your `collector.yaml`:
```yaml
collector:
  interval: "30s"  # Report every 30 seconds instead of 60
```

### Change What Gets Logged
```yaml
logging:
  level: "debug"  # Show more details (info, warn, error, debug)
  format: "json"  # Output in JSON format instead of text
```

### Add Multiple Endpoints
```yaml
shamva:
  endpoint: "https://backup.shamva.com/public/metrics"  # Backup server
  agent_token: "your_token"
  timeout: "60s"  # Wait longer for slow connections
```

### Resource Limits
If the collector uses too much CPU or memory:
```yaml
collector:
  interval: "120s"      # Check less often
  max_retries: 1        # Don't retry as much
  initial_delay: "60s"  # Wait longer between retries
```

## What Gets Reported?

Every minute, your collector sends a report like:
- "CPU is 25% busy" 
- "Memory is 60% full"
- "Disk has 100GB free"
- "Network sent 50MB today"

You can see all this data in your Shamva dashboard!

## Is It Safe?

Yes! The collector:
- Only **reads** information (never changes anything)
- Only sends **summary data** (not your personal files)
- Uses **encrypted connections** (HTTPS)
- Runs with **limited permissions**

It's like having a nurse take your temperature - they look but don't touch anything important!

## Need Help?

- Check the logs first: `tail -f collector.log`
- Make sure your secret token is correct
- Verify the endpoint URL matches your Shamva instance
- Try running it manually first before setting up background mode

---

**That's it!** Your computer now has a health monitor that reports to Shamva every minute. You can see all the data in your dashboard and get alerts if something looks wrong!