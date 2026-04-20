# Deployment Guide

> Step-by-step instructions for deploying the Spiritual AI Guide to production using completely free hosting providers.

---

## Architecture Overview

| Component | Platform | Cost | URL Pattern |
|-----------|----------|------|-------------|
| Frontend (Next.js 14) | Vercel | Free | `your-project.vercel.app` |
| Backend (FastAPI) | Render | Free tier | `spirtual-chatbot-api.onrender.com` |
| Vector DB (ChromaDB) | Baked into Docker image | — | — |
| LLM | OpenAI API | ~$0.02/query | External API |

---

## Part 1: Deploy Backend to Render

Render is the recommended backend platform for the free tier because it natively supports Dockerfile deployments and has a generous free tier for Web Services.

### Step 1: Pack the ChromaDB Data
Render will build your project using `Dockerfile.railway` (kept for legacy naming rules but works perfectly on Render). This Dockerfile explicitly looks for your `data/` folder and bakes it into the cloud server.

1. Run `python scripts/ingest_notes.py` locally to ensure your `data/embeddings/` folder is up to date.
2. Open your `.gitignore` file and comment out `# data/` so that Git tracks the database.
3. Commit and push the `data` folder to GitHub.

### Step 2: Create Render Project

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `FrancescoCavina02/Spiritual-chatbot`.
4. Render will auto-detect the `render.yaml` file located in the root of the repository and instantly set up your FastAPI backend using the Docker container. 
5. Click **Apply**.

### Step 3: Configure Environment Variables

Render will automatically prompt you for variables or you can go to your new Web Service → **Environment**, and fill in:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENAI_API_KEY` | `sk-...` your OpenAI key | Yes |
| `CORS_ORIGINS` | `https://your-project.vercel.app` | Yes (after Vercel deploy) |

### Step 4: Deploy

Render will take around 5 minutes to build the container (downloading Python packages). 
Note: Render restricts Free tier instances to 512MB RAM, which your CPU-only PyTorch setup is optimized to safely run under!

**Health check:** Visit `https://your-backend-name.onrender.com/health` — you should see:
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

---

## Part 2: Deploy Frontend to Netlify

Netlify is the absolute easiest platform for deploying Next.js applications. It requires zero configuration and has a much simpler environment variable interface than Vercel.

### Step 1: Connect GitHub to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up with GitHub.
2. Click **Add new site** → **Import an existing project**.
3. Authorize GitHub and select your repository: `FrancescoCavina02/Spiritual-chatbot`.
4. Netlify will auto-detect Next.js 14. 
5. Set the **Base directory** to `frontend`.
6. Leave the build command and publish directory as their defaults.

### Step 2: Configure Environment Variables

Before clicking deploy, click on **Add environment variables**:

1. Click **New variable**.
2. **Key**: `NEXT_PUBLIC_API_URL`
3. **Value**: `https://spiritual-chatbot-api.onrender.com` (Your Render backend URL)
4. Click **Deploy site**.

### Step 3: Wait for Build

Netlify takes ~2 minutes to build the Next.js app. Once finished, you will receive a free public URL (e.g., `https://magnificent-peony-1234.netlify.app`). You can customize this domain name in **Site settings** → **Domain management**.

### Step 4: Update Render CORS

Go back to Render → Web Service → Environment → Update `CORS_ORIGINS` to your new Netlify URL:
```
CORS_ORIGINS=https://your-custom-name.netlify.app
```

Redeploy the Render service via the manual deploy button using "Clear build cache & deploy".

---

## Environment Variables Reference

### Render (Backend)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 Turbo | Yes | — |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g., `https://your-app.netlify.app`) | Yes | localhost only |
| `PORT` | Server port (Render maps this natively) | Auto | 8000 |

### Netlify (Frontend)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend Render URL | Yes | `http://localhost:8000` |

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Render Build OOM (Out of Memory) | PyTorch consuming RAM | The `requirements.txt` is hardcoded to `--extra-index-url https://download.pytorch.org/whl/cpu` to avoid this. Ensure it stays at the top of the file! |
| CORS error in browser | `CORS_ORIGINS` not set | Add Netlify URL to Render `CORS_ORIGINS` variable |
| Slow first response | Render Free Tier Sleep | Render free tier spins down after 15m of inactivity. The first request takes ~50 seconds to wake the server up. Subsequent requests are instant. |
