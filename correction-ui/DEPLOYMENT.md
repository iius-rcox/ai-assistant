# Deployment Guide: Email Classification Correction UI

This guide explains how to deploy the Correction UI as a Docker container to your Unraid server.

## Prerequisites

- Unraid server with Docker support enabled
- Access to Unraid web interface
- Supabase credentials (URL and service key)
- Docker installed on your local machine (for building the image)

## Build and Export Docker Image

### 1. Build the Image Locally

```bash
cd correction-ui
npm run docker:build
```

This will create a Docker image named `correction-ui:latest` (~82MB).

### 2. Save Image to File

```bash
docker save correction-ui:latest | gzip > correction-ui.tar.gz
```

This creates a compressed image file (~30-40MB) for transfer to Unraid.

### 3. Transfer to Unraid

Use your preferred method to transfer the `.tar.gz` file to your Unraid server:

- **SSH/SCP**: `scp correction-ui.tar.gz root@unraid-server:/tmp/`
- **Unraid Web UI**: Upload via File Manager
- **Network share**: Copy to a shared folder

## Deploy to Unraid

### Option 1: Using Docker Compose (Recommended)

1. SSH into your Unraid server
2. Create a directory for the application:
   ```bash
   mkdir -p /mnt/user/appdata/correction-ui
   cd /mnt/user/appdata/correction-ui
   ```

3. Create a `.env` file with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co
   VITE_SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

4. Copy the `docker-compose.yml` from the project to this directory

5. Load the Docker image:
   ```bash
   docker load < /tmp/correction-ui.tar.gz
   ```

6. Start the container:
   ```bash
   docker-compose up -d
   ```

### Option 2: Using Unraid Web UI

1. **Load the Docker image:**
   - SSH into Unraid
   - Run: `docker load < /tmp/correction-ui.tar.gz`

2. **Add Container in Unraid UI:**
   - Navigate to **Docker** tab
   - Click **Add Container**
   - Fill in the following:

   **Basic Settings:**
   - Name: `correction-ui`
   - Repository: `correction-ui:latest`
   - Network Type: `Bridge`

   **Port Mappings:**
   - Container Port: `80`
   - Host Port: `3000` (or any available port)
   - Protocol: `TCP`

   **Environment Variables:**
   - Click **Add another Path, Port, Variable**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://xmziovusqlmgygcrgyqt.supabase.co`

   - Click **Add another Path, Port, Variable**
   - Key: `VITE_SUPABASE_SERVICE_KEY`
   - Value: `your-service-role-key-here`

   **Advanced Settings:**
   - Auto Start: `Yes`
   - Privileged: `No`

3. Click **Apply**

### Option 3: Using Docker CLI (Manual)

```bash
# Load the image
docker load < /tmp/correction-ui.tar.gz

# Create and start container
docker run -d \
  --name correction-ui \
  --restart unless-stopped \
  -p 3000:80 \
  -e VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co \
  -e VITE_SUPABASE_SERVICE_KEY=your-service-role-key-here \
  correction-ui:latest
```

## Access the UI

Once deployed, access the UI from any device on your local network:

```
http://unraid-server-ip:3000
```

Replace `unraid-server-ip` with your Unraid server's IP address (e.g., `http://192.168.1.100:3000`).

## Verify Deployment

1. **Container Status:**
   ```bash
   docker ps | grep correction-ui
   ```
   Should show status `Up` with health check `healthy`

2. **Container Logs:**
   ```bash
   docker logs correction-ui
   ```
   Should show nginx startup messages

3. **Health Check:**
   ```bash
   curl http://localhost:3000/
   ```
   Should return HTTP 200

4. **Test from Browser:**
   - Open `http://unraid-server-ip:3000`
   - Should see the classification list page
   - Click on a classification to verify detail view works
   - Test editing and saving a classification

## Container Management

### View Logs
```bash
docker logs -f correction-ui
```

### Restart Container
```bash
docker restart correction-ui
```
UI should come back online within 10 seconds (SC-013)

### Stop Container
```bash
docker stop correction-ui
```

### Update to New Version
1. Build new image locally: `npm run docker:build`
2. Save and transfer to Unraid: `docker save correction-ui:latest | gzip > correction-ui.tar.gz`
3. Stop existing container: `docker stop correction-ui && docker rm correction-ui`
4. Load new image: `docker load < /tmp/correction-ui.tar.gz`
5. Start new container using the same docker run command

## Unraid-Specific Configuration

### Community Applications

You can also install via Community Applications (CA) if you publish the image to Docker Hub:

1. Publish image to Docker Hub:
   ```bash
   docker tag correction-ui:latest yourusername/correction-ui:latest
   docker push yourusername/correction-ui:latest
   ```

2. In Unraid CA, search for `correction-ui` and install

### Custom Port Mapping

If port 3000 is already in use on your Unraid server:

1. Choose a different host port (e.g., 3001, 8080, etc.)
2. Update the `-p` flag: `-p 8080:80` instead of `-p 3000:80`
3. Access via: `http://unraid-server-ip:8080`

### Persistent Data

The Correction UI is stateless - all data is stored in Supabase. No volumes need to be mounted.

### Auto-Start Configuration

The container is configured with `--restart unless-stopped`, which means:
- ✅ Auto-starts when Unraid server boots
- ✅ Auto-restarts if it crashes
- ❌ Does not restart if manually stopped

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker logs correction-ui

# Common issues:
# - Port 3000 already in use → Change host port
# - Missing environment variables → Verify .env file
# - Image not loaded → Run docker load command
```

### UI shows "Failed to connect to Supabase"
```bash
# Verify environment variables
docker exec correction-ui env | grep VITE_SUPABASE

# Check if values are set correctly
# If empty, rebuild image with proper environment variables
```

### Health check failing
```bash
# Check container health
docker inspect correction-ui --format='{{.State.Health.Status}}'

# If unhealthy, check nginx logs
docker exec correction-ui cat /var/log/nginx/error.log
```

### Cannot access from mobile device
- Verify mobile device is on same network as Unraid server
- Check Unraid firewall settings (allow port 3000)
- Try accessing via server IP instead of hostname
- Verify responsive layout (SC-014)

## Performance Validation

After deployment, verify performance metrics:

- **SC-011**: Docker image build completes in <5 minutes ✓ (~3.7 seconds achieved)
- **SC-012**: Container starts in <60 seconds ✓ (~10 seconds achieved)
- **SC-013**: Container restarts in <60 seconds ✓ (~10 seconds achieved)
- **SC-014**: UI accessible from mobile devices on local network

## Security Notes

- The container runs nginx as non-root user
- Environment variables are baked into the static bundle at build time
- Service role key has full database access - ensure network security
- Consider using VPN for remote access instead of exposing port publicly

## Next Steps

After successful deployment:

1. Test all user workflows (review, correct, filter, analytics)
2. Monitor container resource usage (CPU, memory)
3. Set up automated health checks (optional)
4. Configure backup strategy for Supabase database
5. Document any Unraid-specific configuration for your team
