# Unraid Deployment Guide: Email Classification Correction UI

**Feature**: 003-correction-ui
**Date**: 2025-11-22
**Target Platform**: Unraid Server (Docker)

---

## Overview

This guide provides step-by-step instructions for deploying the Email Classification Correction UI as a Docker container on your Unraid server. After deployment, the UI will be accessible from any device on your local network.

**Estimated Deployment Time**: 15-20 minutes

---

## Prerequisites

1. **Unraid server** running and accessible on your local network
2. **Docker support** enabled in Unraid (enabled by default)
3. **Supabase credentials** from 001-email-classification-mvp feature
4. **Built Docker image** (either built locally or pulled from registry)

---

## Deployment Method 1: Docker Compose (Recommended)

### Step 1: Prepare Files on Unraid

SSH into your Unraid server and create the application directory:

```bash
# SSH to Unraid
ssh root@unraid-server-ip

# Create application directory
mkdir -p /mnt/user/appdata/correction-ui
cd /mnt/user/appdata/correction-ui
```

### Step 2: Create docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  correction-ui:
    image: correction-ui:latest
    container_name: email-correction-ui
    ports:
      - "3000:80"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 3s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF
```

### Step 3: Create .env File

```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co
VITE_SUPABASE_SERVICE_KEY=your_service_key_here
EOF

# Replace 'your_service_key_here' with your actual key
nano .env
```

### Step 4: Build or Import Docker Image

**Option A: Build on Unraid**
```bash
# Copy source code to Unraid
scp -r correction-ui/ root@unraid-server-ip:/mnt/user/appdata/

# Build image on Unraid
cd /mnt/user/appdata/correction-ui
docker build -t correction-ui:latest .
```

**Option B: Build locally and import**
```bash
# On your local machine
cd correction-ui
docker build -t correction-ui:latest .

# Save image to tar file
docker save correction-ui:latest > correction-ui.tar

# Copy to Unraid
scp correction-ui.tar root@unraid-server-ip:/tmp/

# On Unraid, load image
ssh root@unraid-server-ip
docker load < /tmp/correction-ui.tar
```

### Step 5: Deploy Container

```bash
cd /mnt/user/appdata/correction-ui
docker-compose up -d
```

**Expected output**:
```
Creating email-correction-ui ... done
```

### Step 6: Verify Deployment

```bash
# Check container status
docker ps | grep email-correction-ui

# Expected output:
# email-correction-ui   Up 10 seconds (healthy)   0.0.0.0:3000->80/tcp

# Check logs
docker logs email-correction-ui

# Test from Unraid server
wget -q -O- http://localhost:3000 | grep "<title>"
```

### Step 7: Access from Browser

Open browser on any device on your local network:
- http://192.168.1.100:3000 (replace with your Unraid IP)
- http://unraid-server:3000 (if hostname is configured)

You should see the classification list page.

---

## Deployment Method 2: Unraid Web UI (Community Applications)

### Step 1: Access Unraid Web UI

Navigate to: http://unraid-server-ip

### Step 2: Open Docker Tab

Click **Docker** tab in the Unraid menu

### Step 3: Add Container

Click **Add Container** button at the bottom

### Step 4: Configure Container

Fill in the following fields:

**Basic Settings**:
- **Name**: `email-correction-ui`
- **Repository**: `correction-ui:latest`
- **Icon URL**: (optional) `https://raw.githubusercontent.com/user/repo/icon.png`

**Network Settings**:
- **Network Type**: Bridge
- **Port Mappings**:
  - Container Port: `80`
  - Host Port: `3000`
  - Connection Type: TCP

**Environment Variables** (click "Add another Path, Port, Variable, Label or Device"):
- Variable 1:
  - **Name**: `VITE_SUPABASE_URL`
  - **Key**: `VITE_SUPABASE_URL`
  - **Value**: `https://xmziovusqlmgygcrgyqt.supabase.co`
- Variable 2:
  - **Name**: `VITE_SUPABASE_SERVICE_KEY`
  - **Key**: `VITE_SUPABASE_SERVICE_KEY`
  - **Value**: `[your service key from Supabase]`

**Advanced Settings**:
- **Restart Policy**: `unless-stopped`
- **Privileged**: `No`

### Step 5: Apply and Start

Click **Apply** button at the bottom

Unraid will:
1. Pull/load the image
2. Create the container
3. Start the container
4. Display in Docker tab with status

### Step 6: Verify in Docker Tab

You should see:
- **Container Name**: email-correction-ui
- **Status**: Started (green icon)
- **Uptime**: Few seconds
- **Port**: 3000:80

Click the container name to see logs and stats.

### Step 7: Access UI

Click the **WebUI** icon next to the container (if configured) or manually navigate to:
- http://unraid-server-ip:3000

---

## Deployment Method 3: Docker CLI (Manual)

### Quick Deploy Command

```bash
docker run -d \
  --name email-correction-ui \
  -p 3000:80 \
  -e VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co \
  -e VITE_SUPABASE_SERVICE_KEY=your_key_here \
  --restart unless-stopped \
  --health-cmd="wget --quiet --tries=1 --spider http://localhost:80 || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  correction-ui:latest
```

---

## Post-Deployment Configuration

### Enable Auto-Start on Unraid Boot

Containers with `restart: unless-stopped` policy automatically start when Unraid boots. No additional configuration needed.

**Verify auto-start**:
1. Reboot Unraid server
2. Wait for server to come online (~2-5 minutes)
3. Check Docker tab → email-correction-ui should show "Started"
4. Access UI in browser to confirm

### Configure Unraid Hostname (Optional)

If you want to use `http://unraid-server:3000` instead of IP:

1. Unraid Settings → Network Settings
2. Set **Server name**: `unraid-server`
3. Enable **mDNS** (Bonjour/Avahi)
4. Apply settings
5. From devices on local network, use `http://unraid-server.local:3000`

### Add to Unraid Dashboard (Optional)

To add a WebUI link in Unraid Docker tab:

1. Edit container (click container → Edit)
2. Add **WebUI** field:
   - Value: `http://[IP]:[PORT:3000]/`
3. Save
4. WebUI icon appears next to container for quick access

---

## Monitoring and Maintenance

### View Container Logs

**Via Docker CLI**:
```bash
# View last 100 lines
docker logs email-correction-ui --tail 100

# Follow logs in real-time
docker logs email-correction-ui -f

# View logs from last hour
docker logs email-correction-ui --since 1h
```

**Via Unraid Web UI**:
1. Docker tab → email-correction-ui
2. Click **Logs** button
3. View real-time container output

### Check Container Health

```bash
# Check health status
docker inspect email-correction-ui | grep -A 5 Health

# Expected output (healthy):
# "Health": {
#   "Status": "healthy",
#   "FailingStreak": 0,
#   ...
# }
```

### Update Container (New Version)

```bash
# Stop and remove old container
docker-compose down

# Build new image (or pull updated image)
docker build -t correction-ui:latest .

# Start new container
docker-compose up -d
```

### Backup Configuration

```bash
# Backup .env and docker-compose.yml
cd /mnt/user/appdata/correction-ui
tar -czf correction-ui-config-backup.tar.gz .env docker-compose.yml

# Copy to Unraid backup location
cp correction-ui-config-backup.tar.gz /mnt/user/backups/
```

---

## Troubleshooting

### Issue 1: Container Won't Start

**Symptoms**: Container status shows "Stopped" or "Restarting"

**Check logs**:
```bash
docker logs email-correction-ui --tail 50
```

**Common causes**:
1. **Missing environment variables**: Verify .env file exists and contains both VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY
2. **Port conflict**: Another container using port 3000 - change host port to 3001
3. **Image not found**: Verify image exists with `docker images | grep correction-ui`

### Issue 2: UI Not Accessible from Browser

**Symptoms**: http://unraid-ip:3000 times out or connection refused

**Diagnosis**:
```bash
# Check if container is running
docker ps | grep email-correction-ui

# Check if port is bound
netstat -tlnp | grep 3000

# Test from Unraid itself
wget -q -O- http://localhost:3000 | head -20
```

**Common causes**:
1. **Firewall blocking**: Unraid firewall may block port 3000 (unlikely, but check Settings → Network)
2. **Wrong IP**: Verify Unraid IP with `ip addr show` or Unraid Settings → Network
3. **Container not healthy**: Check health status with `docker inspect`

### Issue 3: Database Connection Errors in UI

**Symptoms**: UI loads but shows "Unable to connect to database" error

**Check**:
1. Verify environment variables are set correctly in container:
   ```bash
   docker exec email-correction-ui env | grep VITE_SUPABASE
   ```
2. Test Supabase connection from Unraid:
   ```bash
   curl https://xmziovusqlmgygcrgyqt.supabase.co
   ```
3. Verify service key is valid (check Supabase dashboard)

### Issue 4: Container Doesn't Auto-Start After Reboot

**Symptoms**: After rebooting Unraid, container status is "Stopped"

**Check restart policy**:
```bash
docker inspect email-correction-ui | grep -A 3 RestartPolicy

# Expected:
# "RestartPolicy": {
#   "Name": "unless-stopped",
#   ...
# }
```

**Fix**:
```bash
# Update restart policy
docker update --restart unless-stopped email-correction-ui

# Verify
docker inspect email-correction-ui | grep -A 3 RestartPolicy
```

### Issue 5: Mobile Access Not Working

**Symptoms**: Laptop access works, but phone/tablet on same network cannot connect

**Common causes**:
1. **Different subnet**: Phone on WiFi, Unraid on wired (both must be on same network)
2. **Client isolation**: WiFi router has AP isolation enabled (disable in router settings)
3. **Using cellular data**: Ensure phone is on local WiFi, not cellular

**Test**:
```bash
# From phone browser, try both:
http://192.168.1.100:3000  (Unraid IP)
http://unraid-server.local:3000  (mDNS hostname)
```

---

## Security Considerations

### Local Network Only

- ✅ **Do NOT expose** port 3000 to the internet (no port forwarding)
- ✅ **Service key** is acceptable on local network (trusted devices only)
- ✅ **No authentication** required for single-user local access

### If Internet Exposure Needed (Not Recommended)

If you must access from outside your network:

1. **Switch to anon key** in environment variables
2. **Add Supabase Auth** for login
3. **Enable HTTPS** with SSL certificate (Let's Encrypt)
4. **Configure Supabase RLS** policies
5. **Add rate limiting** to nginx
6. **Use VPN** instead (OpenVPN, WireGuard on Unraid)

**Recommended**: Use Unraid VPN to access local network remotely instead of internet exposure

---

## Performance Expectations

### Container Resources

**Typical usage**:
- **CPU**: <5% (idle), 10-20% (active corrections)
- **Memory**: 50-100MB (nginx is very lightweight)
- **Disk**: ~100MB (image size)
- **Network**: Minimal (API calls to Supabase only)

### Response Times

- **Initial page load**: <2 seconds
- **List with 1,000 records**: <2 seconds
- **Classification edit save**: <1 second
- **Analytics page load**: <3 seconds (chart rendering)

### Resource Limits (Recommended)

In docker-compose.yml or Unraid container settings:
- **CPU**: 0.5 core (50% of one CPU)
- **Memory**: 256MB limit, 128MB reservation

---

## Next Steps

After successful deployment:

1. **Bookmark URL**: Save http://unraid-ip:3000 for quick access
2. **Test from devices**: Verify access from laptop, phone, tablet
3. **Test auto-restart**: Reboot Unraid and confirm container comes back
4. **Start using**: Begin reviewing and correcting classifications!

---

## Unraid-Specific Tips

### View Container in Unraid UI

After deployment via CLI or Docker Compose, the container appears in:
- Unraid Web UI → Docker tab
- Shows: name, status, uptime, CPU/memory usage
- Actions: Start, Stop, Restart, Edit, Remove, Logs

### Update via Unraid UI

To update to a new version:
1. Stop container (Docker tab → container → Stop button)
2. Remove container (Remove button, keeps image)
3. Rebuild image (SSH: `docker build -t correction-ui:latest .`)
4. Re-add container (follow deployment steps again)

Or use Docker Compose:
```bash
cd /mnt/user/appdata/correction-ui
docker-compose down
docker build -t correction-ui:latest .
docker-compose up -d
```

### Backup Container Configuration

Unraid auto-backs up container configs to:
- `/boot/config/docker.img`

To manually export:
```bash
# Export container config
docker inspect email-correction-ui > correction-ui-config.json
```

---

## Quick Reference

**Build Image**:
```bash
docker build -t correction-ui:latest .
```

**Deploy with Docker Compose**:
```bash
docker-compose up -d
```

**Deploy with CLI**:
```bash
docker run -d --name email-correction-ui -p 3000:80 \
  -e VITE_SUPABASE_URL=... -e VITE_SUPABASE_SERVICE_KEY=... \
  --restart unless-stopped correction-ui:latest
```

**Access URL**:
```
http://[unraid-ip]:3000
```

**View Logs**:
```bash
docker logs email-correction-ui -f
```

**Restart**:
```bash
docker restart email-correction-ui
```

**Stop**:
```bash
docker-compose down
```

---

**Deployment complete!** Your correction UI is now accessible 24/7 from any device on your local network. 🚀
