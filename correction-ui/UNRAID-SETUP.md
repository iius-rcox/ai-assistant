# Correction UI - Unraid Deployment Guide

## Prerequisites

- Unraid server with Docker enabled
- GitHub Personal Access Token with `read:packages` scope

## Option 1: Unraid Docker UI

1. **Add Container** in the Unraid Docker tab

2. **Configure the container:**

   | Field | Value |
   |-------|-------|
   | Name | `correction-ui` |
   | Repository | `ghcr.io/rogercoxjr/correction-ui:latest` |
   | Registry URL | `ghcr.io` |
   | Registry Username | `rogercoxjr` |
   | Registry Password | `<your-github-pat>` |

3. **Add Port Mapping:**
   - Click "Add another Path, Port, Variable, Label or Device"
   - Config Type: `Port`
   - Name: `Web UI`
   - Container Port: `80`
   - Host Port: `3000` (or any available port)
   - Connection Type: `TCP`

4. **Apply** and start the container

## Option 2: Command Line

SSH into your Unraid server and run:

```bash
# Login to GitHub Container Registry
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u rogercoxjr --password-stdin

# Pull the latest image
docker pull ghcr.io/rogercoxjr/correction-ui:latest

# Run the container
docker run -d \
  --name correction-ui \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/rogercoxjr/correction-ui:latest
```

## Option 3: Docker Compose

Create a `docker-compose.yml` on your Unraid server:

```yaml
version: '3.8'

services:
  correction-ui:
    image: ghcr.io/rogercoxjr/correction-ui:latest
    container_name: correction-ui
    ports:
      - "3000:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3
```

Then run:
```bash
docker-compose up -d
```

## Accessing the Application

Once deployed, access the Correction UI at:

```
http://<your-unraid-ip>:3000/
```

## Updating the Application

To update to the latest version:

```bash
# Pull the latest image
docker pull ghcr.io/rogercoxjr/correction-ui:latest

# Restart the container
docker stop correction-ui
docker rm correction-ui
docker run -d \
  --name correction-ui \
  -p 3000:80 \
  --restart unless-stopped \
  ghcr.io/rogercoxjr/correction-ui:latest
```

Or with docker-compose:
```bash
docker-compose pull
docker-compose up -d
```

## Creating a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Unraid GHCR Read`
4. Select scope: `read:packages`
5. Generate and copy the token
6. Use this token as your registry password

## Troubleshooting

### Container won't start
Check logs:
```bash
docker logs correction-ui
```

### Can't pull image
Verify GHCR authentication:
```bash
docker login ghcr.io -u rogercoxjr
```

### Port already in use
Change the host port (first number) to an available port:
```bash
docker run -d -p 3001:80 ...
```

## Image Details

- **Registry**: GitHub Container Registry (ghcr.io)
- **Image**: `ghcr.io/rogercoxjr/correction-ui:latest`
- **Base**: nginx:alpine
- **Exposed Port**: 80
- **Health Check**: Built-in (checks every 30s)
