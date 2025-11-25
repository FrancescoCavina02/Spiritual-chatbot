# 🚀 Deployment Guide - Spiritual AI Guide Chatbot

This guide covers deploying the Spiritual AI Guide chatbot to production using Docker locally or cloud platforms (Vercel + Railway/Render).

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment (Local/Self-Hosted)](#docker-deployment)
3. [Cloud Deployment (Vercel + Railway)](#cloud-deployment)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 📦 Prerequisites

### Required Tools
- **Docker** (v20.10+) & **Docker Compose** (v2.0+)
- **Git** (for version control)
- **Node.js** (v20+) - for local development/testing
- **Python** (v3.11+) - for backend development

### Required Accounts (for cloud deployment)
- **GitHub** account (for repository hosting)
- **Vercel** account (for frontend hosting - free tier available)
- **Railway** or **Render** account (for backend hosting - free tier available)
- **OpenAI** account with API key (or other LLM provider)

### Required Data
- **Obsidian vault** with your spiritual notes
- ChromaDB embeddings (generated during backend setup)

---

## 🐳 Docker Deployment (Local/Self-Hosted)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/spiritual-ai-chatbot.git
cd spiritual-ai-chatbot
```

### Step 2: Configure Environment

1. **Copy the environment template:**
   ```bash
   cp docker-compose.env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   nano .env
   ```

   **Critical variables to set:**
   - `OBSIDIAN_VAULT_PATH`: Absolute path to your Obsidian vault
   - `OPENAI_API_KEY`: Your OpenAI API key
   - Other LLM keys (optional)

### Step 3: Build and Run with Docker Compose

```bash
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### Step 4: Verify Deployment

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "vault_loaded": true,
     "embeddings_loaded": true
   }
   ```

2. **Frontend Access:**
   Open browser to `http://localhost:3000`

### Step 5: Initialize Embeddings (First Run)

If embeddings aren't pre-generated, you'll need to run the ingestion:

```bash
# Access backend container
docker exec -it spiritual-ai-backend bash

# Run ingestion (inside container)
python -m app.services.obsidian_parser
```

---

## ☁️ Cloud Deployment (Vercel + Railway)

### Part A: Deploy Backend to Railway

#### 1. Prepare Repository

Ensure your backend has:
- ✅ `backend/Dockerfile`
- ✅ `backend/requirements.txt`
- ✅ `backend/.dockerignore`

#### 2. Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Choose the **backend** directory as the root

#### 3. Configure Railway

**Add Environment Variables:**

Go to **Variables** tab and add:

```bash
# Required
OBSIDIAN_VAULT_PATH=/app/vault
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo-preview
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHROMA_PERSIST_DIRECTORY=/app/data/embeddings
CORS_ORIGINS=https://your-frontend.vercel.app
ENVIRONMENT=production
LOG_LEVEL=INFO
```

**Configure Persistent Storage:**

Railway doesn't have built-in persistent volumes (free tier), so you have two options:

**Option 1: Upload embeddings to Railway (Recommended for MVP)**
1. Generate embeddings locally
2. Commit `backend/data/embeddings/` to a separate branch
3. Deploy that branch

**Option 2: Use external storage (S3, Cloudinary)**
- Requires code modifications to use cloud storage

#### 4. Deploy

Railway will automatically build and deploy. Get your backend URL:
```
https://your-project.railway.app
```

Test health endpoint:
```bash
curl https://your-project.railway.app/health
```

---

### Part B: Deploy Frontend to Vercel

#### 1. Prepare Frontend

Ensure these files exist:
- ✅ `frontend/Dockerfile`
- ✅ `frontend/next.config.ts` (with `output: 'standalone'`)
- ✅ `frontend/.dockerignore`

#### 2. Create Vercel Project

1. Go to [Vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Vercel auto-detects Next.js configuration

#### 3. Configure Environment Variables

In Vercel project settings → **Environment Variables**, add:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_NAME=Spiritual AI Guide
```

#### 4. Deploy

Vercel will automatically build and deploy. Your frontend URL:
```
https://your-project.vercel.app
```

#### 5. Update Backend CORS

Go back to Railway and update `CORS_ORIGINS`:
```bash
CORS_ORIGINS=https://your-project.vercel.app,http://localhost:3000
```

---

## 🔐 Environment Variables Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OBSIDIAN_VAULT_PATH` | ✅ | - | Path to Obsidian vault |
| `OPENAI_API_KEY` | ✅ | - | OpenAI API key |
| `LLM_PROVIDER` | ✅ | `openai` | LLM provider (openai, ollama, anthropic, gemini) |
| `OPENAI_MODEL` | ❌ | `gpt-4-turbo-preview` | OpenAI model name |
| `EMBEDDING_MODEL` | ❌ | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model |
| `CHROMA_PERSIST_DIRECTORY` | ❌ | `./data/embeddings` | ChromaDB storage path |
| `CORS_ORIGINS` | ✅ | - | Comma-separated allowed origins |
| `ENVIRONMENT` | ❌ | `production` | Environment mode |
| `LOG_LEVEL` | ❌ | `INFO` | Logging level |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | - | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | ❌ | `Spiritual AI Guide` | Application name |

---

## 🔧 Troubleshooting

### Backend Issues

#### Error: "Connection refused" to OpenAI
**Cause:** Invalid or missing `OPENAI_API_KEY`
**Solution:** 
```bash
# Verify key is set
docker-compose exec backend printenv OPENAI_API_KEY

# If empty, check your .env file
```

#### Error: "Vault not found"
**Cause:** `OBSIDIAN_VAULT_PATH` incorrect or volume not mounted
**Solution:**
```bash
# Check volume mount in docker-compose.yml
volumes:
  - /absolute/path/to/vault:/vault:ro

# Verify inside container
docker-compose exec backend ls /vault
```

#### Error: "No embeddings found"
**Cause:** ChromaDB not initialized
**Solution:**
```bash
# Run ingestion manually
docker-compose exec backend python -m app.services.obsidian_parser
```

#### Memory Issues (Large Models)
**Cause:** Insufficient container memory for embeddings/models
**Solution:**
```yaml
# Add to docker-compose.yml under backend service
deploy:
  resources:
    limits:
      memory: 4G
    reservations:
      memory: 2G
```

---

### Frontend Issues

#### Error: "Failed to fetch" from API
**Cause:** Incorrect `NEXT_PUBLIC_API_BASE_URL`
**Solution:**
1. Check browser console for actual URL being called
2. Verify environment variable in Vercel settings
3. Ensure backend CORS allows frontend origin

#### Build Fails on Vercel
**Cause:** Missing environment variables or dependencies
**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure `next.config.ts` has `output: 'standalone'`
3. Verify `package.json` dependencies are complete

---

### Docker Compose Issues

#### Services Won't Start
```bash
# Check logs for specific service
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

#### Port Conflicts
**Cause:** Ports 3000 or 8000 already in use
**Solution:**
```bash
# Find process using port
lsof -ti:8000
# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
ports:
  - "8001:8000"  # Map to different host port
```

---

## 📊 Monitoring & Maintenance

### Health Checks

**Backend:**
```bash
curl https://your-backend.railway.app/health
```

**Frontend:**
```bash
curl https://your-frontend.vercel.app
```

### Logs

**Railway:**
- View logs in Railway dashboard
- Enable log drains for external monitoring (Datadog, Logtail)

**Vercel:**
- View logs in Vercel dashboard
- Supports runtime logs and build logs

**Docker (Local):**
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Updating Deployment

**Railway (Backend):**
```bash
# Push to main branch - auto-deploys
git push origin main
```

**Vercel (Frontend):**
```bash
# Push to main branch - auto-deploys
git push origin main

# Or trigger manual deployment from Vercel dashboard
```

**Docker (Local):**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up --build -d
```

### Backup Strategy

**Critical Data:**
1. **Obsidian Vault** - Already backed up on your system
2. **ChromaDB Embeddings** - Back up `backend/data/embeddings/`
   ```bash
   # Create backup
   tar -czf embeddings-backup-$(date +%Y%m%d).tar.gz backend/data/embeddings/
   
   # Restore backup
   tar -xzf embeddings-backup-YYYYMMDD.tar.gz
   ```

3. **Conversations** - Stored in browser `localStorage` (export feature coming soon)

---

## 🎉 Post-Deployment Checklist

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Can send a chat message and receive response
- [ ] Can browse notes by category
- [ ] Can navigate note hierarchies (breadcrumbs, children)
- [ ] Can perform semantic search
- [ ] Conversations persist in sidebar
- [ ] [[Wiki links]] resolve correctly
- [ ] Mobile responsive design works
- [ ] CORS configured correctly (no console errors)

---

## 🔗 Useful Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## 🆘 Need Help?

If you encounter issues not covered here:
1. Check the [Issues](https://github.com/your-username/spiritual-ai-chatbot/issues) page
2. Create a new issue with:
   - Deployment method (Docker/Railway/Vercel)
   - Error logs
   - Environment details

---

**Last Updated:** November 25, 2024
**Version:** 1.0.0

