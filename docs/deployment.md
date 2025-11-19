# Deployment Guide

## Overview

This guide covers deployment options for the Spiritual AI Guide Chatbot, from local development to production cloud deployment.

## Deployment Architecture

### Development (Local)
```
┌─────────────────────────────────────┐
│      Developer Machine              │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Next.js  │  │ FastAPI  │       │
│  │ :3000    │  │ :8000    │       │
│  └──────────┘  └────┬─────┘       │
│                      │              │
│  ┌──────────┐  ┌────▼─────┐       │
│  │ Ollama   │  │ ChromaDB │       │
│  │ :11434   │  │ (local)  │       │
│  └──────────┘  └──────────┘       │
└─────────────────────────────────────┘
```

### Production (Cloud)
```
┌─────────────────────────────────────────────────┐
│              Vercel (Frontend)                  │
│  Next.js App (CDN + Edge Functions)             │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────────┐
│          Railway/Render (Backend)               │
│  ┌──────────────────────────────────┐          │
│  │  FastAPI Container                │          │
│  │  - RAG Engine                     │          │
│  │  - LLM Service                    │          │
│  └────┬────────────────────┬─────────┘          │
│       │                    │                     │
│  ┌────▼─────┐        ┌────▼─────┐              │
│  │ChromaDB  │        │ Ollama   │              │
│  │(volume)  │        │(optional)│              │
│  └──────────┘        └──────────┘              │
└─────────────────────────────────────────────────┘
         │                    │
         │                    │
    ┌────▼────────────────────▼─────┐
    │     External APIs              │
    │  - OpenAI                      │
    │  - Anthropic                   │
    │  - Google                      │
    └────────────────────────────────┘
```

## Dockerization

### Backend Dockerfile

**File**: `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Create directories for data
RUN mkdir -p /app/data/embeddings

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

**File**: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - OBSIDIAN_VAULT_PATH=/data/raw
      - CHROMADB_PATH=/data/embeddings
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    volumes:
      - ./data:/data
      - chromadb_data:/app/data/embeddings
    depends_on:
      - ollama
    networks:
      - app_network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    networks:
      - app_network
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - app_network
    restart: unless-stopped
    # Optional: Add GPU support
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  chromadb_data:
  ollama_data:

networks:
  app_network:
    driver: bridge
```

### Running with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Cloud Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel

1. **Connect Repository**
   - Go to vercel.com
   - Import GitHub repository
   - Select `frontend` directory as root

2. **Configure Build**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   - Automatic deployment on git push
   - Preview deployments for PRs

#### Backend on Railway

1. **Create New Project**
   - railway.app → New Project
   - Connect GitHub repository

2. **Configure Service**
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   ```
   PYTHON_VERSION=3.11
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=...
   OBSIDIAN_VAULT_PATH=/app/data/raw
   ```

4. **Add Volume** (for ChromaDB persistence)
   - Create volume mounted at `/app/data`
   - Size: 1-5GB

5. **Deploy**
   - Automatic deployment on git push
   - Get public URL

### Option 2: Render

#### Backend on Render

1. **Create Web Service**
   - Dashboard → New Web Service
   - Connect repository

2. **Configuration**
   ```
   Name: spiritual-ai-backend
   Environment: Python 3
   Region: Oregon (or nearest)
   Branch: main
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   - Add all API keys
   - Set Python version

4. **Persistent Disk**
   - Add disk for ChromaDB
   - Mount path: `/app/data`
   - Size: 1GB

### Option 3: DigitalOcean VPS (Full Control)

#### 1. Create Droplet

```bash
# Specs for production
- OS: Ubuntu 22.04 LTS
- Size: 4GB RAM, 2 vCPUs ($24/month)
- Add volume: 10GB for data
```

#### 2. Initial Setup

```bash
# Connect via SSH
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y

# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y
```

#### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/spiritual-ai-guide.git
cd spiritual-ai-guide

# Set environment variables
cp .env.example .env
nano .env  # Edit with actual API keys

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

#### 4. Configure Nginx

**File**: `/etc/nginx/sites-available/spiritual-ai`

```nginx
# Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/spiritual-ai /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

#### 5. SSL Certificates

```bash
# Obtain SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

## Environment Variables

### Backend `.env`

```env
# Environment
ENVIRONMENT=production
DEBUG=false

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Paths
OBSIDIAN_VAULT_PATH=/app/data/raw
CHROMADB_PATH=/app/data/embeddings

# Ollama
OLLAMA_BASE_URL=http://ollama:11434

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60

# Logging
LOG_LEVEL=INFO
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

## Data Migration

### Initial Data Ingestion

```bash
# On first deployment, ingest notes
docker-compose exec backend python -m scripts.ingest_notes

# Verify ingestion
docker-compose exec backend python -c "
from app.services.vector_db import get_collection
collection = get_collection()
print(f'Total chunks: {collection.count()}')
"
```

## Monitoring & Maintenance

### Health Checks

**Backend Health Endpoint**: `/health`

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "chromadb": check_chromadb(),
            "ollama": check_ollama(),
            "embeddings": check_embeddings()
        }
    }
```

### Logging

**Backend logging configuration**:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/app.log'),
        logging.StreamHandler()
    ]
)
```

### Backups

```bash
# Backup ChromaDB
docker-compose exec backend tar -czf /backups/chromadb_$(date +%Y%m%d).tar.gz /app/data/embeddings

# Backup to remote storage (optional)
# rclone copy /backups/ remote:spiritual-ai-backups/
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## Scaling Considerations

### Horizontal Scaling

**Load Balancer** → Multiple Backend Instances

**Shared Resources**:
- Use managed vector DB (Pinecone/Weaviate)
- Shared Redis for caching
- Centralized logging

### Vertical Scaling

**For Ollama**:
- GPU instance recommended
- 16GB+ RAM for Llama 3.1 8B
- NVMe storage for fast model loading

**For ChromaDB**:
- More RAM = better performance
- SSD recommended for vector storage

## Cost Estimates

### DigitalOcean VPS
- **Droplet**: $24/month (4GB RAM)
- **Volume**: $1/month (10GB)
- **Bandwidth**: Free (1TB included)
- **Total**: ~$25/month + API costs

### Railway
- **Backend**: $5-20/month (depending on usage)
- **Volume**: $2.50/month (1GB)
- **Total**: ~$10-25/month + API costs

### Vercel + Railway
- **Vercel**: Free (hobby tier)
- **Railway**: $10-20/month
- **Total**: ~$10-20/month + API costs

## Security Checklist

- [ ] HTTPS enabled (SSL certificates)
- [ ] API keys in environment variables (not code)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation and sanitization
- [ ] Regular security updates
- [ ] Firewall rules (if VPS)
- [ ] Database backups configured
- [ ] Monitoring and alerting set up

## Troubleshooting

### Common Issues

**1. ChromaDB not persisting**
- Check volume mounts in docker-compose
- Verify write permissions

**2. Ollama out of memory**
- Reduce model size (use phi3:medium)
- Increase container memory limit

**3. Frontend can't reach backend**
- Check CORS configuration
- Verify NEXT_PUBLIC_API_URL
- Check network in docker-compose

**4. Slow response times**
- Monitor CPU/RAM usage
- Check Ollama inference time
- Consider upgrading to GPU instance

---

*This deployment guide provides production-ready configurations suitable for academic demonstration.*

