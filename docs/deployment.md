# Deployment Guide

> Step-by-step instructions for deploying the Spiritual AI Guide to production (free hosting).

---

## Architecture Overview

| Component | Platform | Cost | URL Pattern |
|-----------|----------|------|-------------|
| Frontend (Next.js 14) | Vercel | Free | `your-project.vercel.app` |
| Backend (FastAPI) | Railway | Free tier | `your-backend.railway.app` |
| Vector DB (ChromaDB) | Included in Railway container | — | — |
| LLM | OpenAI API | ~$0.02/query | External API |

---

## Part 1: Deploy Backend to Railway

Railway is the recommended backend platform because:
- Supports Dockerfile-based deployments
- Provides a `$PORT` environment variable automatically
- Free tier includes 500 hours/month (enough for a portfolio project)
- Persistent volume mounts for ChromaDB storage

### Step 1: Prepare the ChromaDB Data

The ChromaDB embeddings (`data/embeddings/`) are gitignored and won't deploy automatically. You have two options:

**Option A — Pre-seed in Docker image (recommended for small corpora):**

Add to `Dockerfile.railway` before the `USER appuser` line:
```dockerfile
# Copy pre-seeded ChromaDB data
COPY data/embeddings/ ./data/embeddings/
```

Then ensure `data/embeddings/` is temporarily removed from `.gitignore` for the deploy commit, or build the Docker image locally and push to a registry.

**Option B — Railway Volume Mount:**

In Railway dashboard: Service → Settings → Volumes → Add Volume:
- Mount path: `/app/data/embeddings`
- After mounting, SSH into the service and run `python scripts/load_chromadb.py` to seed the database.

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your repository: `FrancescoCavina02/Spiritual-chatbot`
3. Railway will auto-detect `railway.toml` and use `Dockerfile.railway`

### Step 3: Configure Environment Variables

In Railway dashboard → Service → Variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENAI_API_KEY` | `sk-...` your OpenAI key | Yes |
| `CORS_ORIGINS` | `https://your-project.vercel.app` | Yes (after Vercel deploy) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Optional |
| `GOOGLE_API_KEY` | `AIza...` | Optional |
| `LOG_LEVEL` | `INFO` | Optional |

### Step 4: Deploy

Railway will automatically build and deploy when you push to `main`. The build takes 3–8 minutes (downloading Python packages + sentence-transformer model).

**Health check:** Visit `https://your-backend.railway.app/health` — you should see:
```json
{
  "status": "healthy",
  "services": {
    "chromadb": "operational (1,772 chunks indexed)",
    "embeddings": "operational (sentence-transformers/all-MiniLM-L6-v2, 384D)",
    "llm": "1 provider(s) active: openai"
  }
}
```

**API Docs:** Visit `https://your-backend.railway.app/docs` for the Swagger UI.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Root Directory** to `frontend/`
4. Vercel will auto-detect Next.js 14

### Step 2: Configure Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` | Production, Preview |

### Step 3: Deploy

Click Deploy. Vercel builds and deploys in ~2–3 minutes. You get a URL like `spiritual-ai-guide.vercel.app`.

### Step 4: Update Railway CORS

Go back to Railway → Variables → Update `CORS_ORIGINS` to your Vercel URL:
```
CORS_ORIGINS=https://spiritual-ai-guide.vercel.app
```

Redeploy Railway service.

---

## Part 3: Custom Domain (Optional)

### Free Option: Vercel Subdomain

Your app is already accessible at `your-project.vercel.app` — this is perfectly fine for portfolio use.

### Custom Domain via Vercel

1. Vercel dashboard → Project → Settings → Domains
2. Add your domain (e.g., `spiritual.francescocavina.com`)
3. Follow the DNS configuration instructions (add CNAME record)

### Free Domain Sources

- **GitHub Student Developer Pack**: Includes free `.me` domain from Namecheap
- **Freenom**: Free `.tk`, `.ml`, `.ga` domains (limited reliability)
- **Cloudflare**: Free for domains you already own (just DNS management)

---

## Environment Variables Reference

### Railway (Backend)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 Turbo | Yes | — |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g., `https://your-app.vercel.app`) | Yes | localhost only |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | No | — |
| `GOOGLE_API_KEY` | Google Gemini API key | No | — |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/WARNING) | No | INFO |
| `PORT` | Server port (set automatically by Railway) | Auto | 8000 |
| `CHROMA_PERSIST_DIRECTORY` | ChromaDB data directory | No | `../data/embeddings` |
| `CHROMA_COLLECTION_NAME` | ChromaDB collection name | No | `spiritual_notes` |
| `RAG_TOP_K` | Number of chunks to retrieve | No | 10 |

### Vercel (Frontend)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend Railway URL | Yes | `http://localhost:8000` |

---

## Deployment Checklist

- [ ] Railway service deployed and healthy (`/health` returns `operational`)
- [ ] ChromaDB populated (health check shows chunk count > 0)
- [ ] OpenAI API key set in Railway variables
- [ ] Vercel project created and frontend deployed
- [ ] `NEXT_PUBLIC_API_URL` set to Railway URL in Vercel
- [ ] `CORS_ORIGINS` set to Vercel URL in Railway
- [ ] Chat working end-to-end (test with a question)
- [ ] Citations displaying in the sidebar
- [ ] README updated with live URLs (replace `[LIVE_URL]`)
- [ ] GitHub repo description and topics updated

---

## Local Development (Docker)

For a fully containerised local setup:

```bash
# Copy environment template
cp docker-compose.env.example .env

# Edit .env:
# - Set OPENAI_API_KEY
# - Set OBSIDIAN_VAULT_PATH (for ingestion)

# Build and run
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Health check fails: ChromaDB empty | Embeddings not seeded | Run `load_chromadb.py` or copy `data/embeddings/` into container |
| CORS error in browser | `CORS_ORIGINS` not set | Add Vercel URL to Railway `CORS_ORIGINS` variable |
| Chat returns 503 | No LLM providers available | Check `OPENAI_API_KEY` is correctly set in Railway |
| Slow first response | Cold start | Railway free tier has cold starts; first request may take 30–60s |
| Railway build fails | Missing dependencies | Ensure `backend/requirements.txt` is complete and `Dockerfile.railway` copies it |
