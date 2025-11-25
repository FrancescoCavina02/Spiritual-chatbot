# 🚀 Deploy Your Chatbot NOW - Quick Guide

Follow these steps to deploy your Spiritual AI Guide to production in ~15 minutes.

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:
- [ ] Backend works locally (`curl http://localhost:8000/health`)
- [ ] Frontend works locally (`http://localhost:3000`)
- [ ] Chat functionality tested with OpenAI API key
- [ ] Code pushed to GitHub (✅ **DONE** - latest commit: `6c0eeb4`)

---

## 🎯 Deployment Strategy

We'll deploy in this order:
1. **Backend first** (Railway) - Get API URL
2. **Frontend second** (Vercel) - Connect to backend
3. **Update CORS** - Allow frontend to access backend

---

## 📦 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### 1.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **`FrancescoCavina02/Spiritual-chatbot`**
4. Railway will detect the repository

### 1.3 Configure Build Settings

1. Click on your project
2. Click **"Settings"** tab
3. Under **"Build"**:
   - **Root Directory**: Leave empty (will auto-detect)
   - **Build Command**: Leave default
   - **Dockerfile Path**: `backend/Dockerfile`
4. Click **"Deploy"** to save

### 1.4 Add Environment Variables

Click **"Variables"** tab and add these:

```bash
# CRITICAL - Required for deployment
OBSIDIAN_VAULT_PATH=/app/vault
OPENAI_API_KEY=<your-actual-openai-key>

# LLM Configuration
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo-preview

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Vector Database
CHROMA_PERSIST_DIRECTORY=/app/data/embeddings
CHROMA_COLLECTION_NAME=spiritual_notes

# CORS (we'll update this after frontend deployment)
CORS_ORIGINS=http://localhost:3000

# Server
ENVIRONMENT=production
LOG_LEVEL=INFO
```

Click **"Add"** for each variable.

### 1.5 Handle Obsidian Vault & Embeddings

**⚠️ IMPORTANT:** Railway doesn't support file uploads in free tier.

**Solution Options:**

**Option A: Commit embeddings to repo (Quick MVP)**
```bash
# On your local machine
cd "/Users/francescocavina/Documents/Coding/Projects/NLP Chatbot"

# Remove embeddings from .gitignore temporarily
# Then commit and push embeddings
git add backend/data/embeddings/
git commit -m "chore: add pre-generated embeddings for deployment"
git push origin main
```

**Option B: Use cloud storage (Better for production)**
- Upload embeddings to AWS S3, Google Cloud Storage, or Cloudinary
- Modify backend code to fetch from cloud storage on startup

**For now, use Option A** for quick deployment.

### 1.6 Get Your Backend URL

1. After deployment completes, click **"Settings"** → **"Domains"**
2. Railway auto-generates a URL like:
   ```
   https://spiritual-chatbot-production-XXXX.up.railway.app
   ```
3. **Copy this URL** - you'll need it for frontend deployment

### 1.7 Test Backend

```bash
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "vault_loaded": true,
  "embeddings_loaded": true
}
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import **`FrancescoCavina02/Spiritual-chatbot`**
3. Click **"Import"**

### 2.3 Configure Build Settings

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. Leave other settings as default

### 2.4 Add Environment Variables

Before clicking "Deploy", add these variables:

**Key:** `NEXT_PUBLIC_API_BASE_URL`
**Value:** `https://your-backend-url.railway.app` (from Step 1.6)

**Key:** `NEXT_PUBLIC_APP_NAME`
**Value:** `Spiritual AI Guide`

### 2.5 Deploy

Click **"Deploy"**

Vercel will build and deploy. This takes ~2-3 minutes.

### 2.6 Get Your Frontend URL

After deployment, Vercel provides a URL like:
```
https://spiritual-chatbot-XXXX.vercel.app
```

**Copy this URL** - you'll need it for CORS.

---

## 🔗 Step 3: Connect Frontend & Backend (CORS)

### 3.1 Update Backend CORS

1. Go back to **Railway** dashboard
2. Open your backend project
3. Click **"Variables"**
4. Update `CORS_ORIGINS` variable:
   ```
   https://your-frontend.vercel.app,http://localhost:3000
   ```
5. Railway will automatically redeploy

### 3.2 Verify Connection

1. Open `https://your-frontend.vercel.app` in browser
2. Try sending a chat message
3. Check browser console for errors (F12)

---

## ✅ Step 4: Verify Full Deployment

Test all features:
- [ ] Frontend loads without errors
- [ ] Can send a chat message
- [ ] Receives AI response with citations
- [ ] Can browse notes by category
- [ ] Can navigate note hierarchies
- [ ] Can perform semantic search
- [ ] No CORS errors in console

---

## 🎉 Step 5: Update README

Update your README.md with live demo link:

```markdown
🔗 [Live Demo](https://your-frontend.vercel.app)
```

Commit and push:
```bash
git add README.md
git commit -m "docs: add live demo link"
git push origin main
```

---

## 🐛 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Railway logs: Dashboard → Project → "Deployments" → View logs
- Verify environment variables are set correctly
- Check health endpoint: `curl https://your-backend.railway.app/health`

**"No embeddings found"**
- Embeddings weren't included in deployment
- Follow Option A in Step 1.5 to commit embeddings
- Or check if ChromaDB path is correct

**"OpenAI API error"**
- Verify `OPENAI_API_KEY` is correct in Railway variables
- Check OpenAI account has credits
- Test locally first: `echo $OPENAI_API_KEY`

### Frontend Issues

**"Failed to fetch" or CORS errors**
- Verify `NEXT_PUBLIC_API_BASE_URL` points to correct Railway URL
- Ensure Railway backend has frontend URL in `CORS_ORIGINS`
- Check backend is actually running: `curl https://backend.railway.app/health`

**Build fails on Vercel**
- Check build logs in Vercel dashboard
- Ensure `frontend/` directory is set as root
- Verify `next.config.ts` has `output: 'standalone'`

**"502 Bad Gateway"**
- Backend is down or not responding
- Check Railway backend logs
- Verify health endpoint works

---

## 📊 Post-Deployment Monitoring

### Check Backend Health
```bash
# Should return 200 OK
curl -I https://your-backend.railway.app/health
```

### View Logs

**Railway:**
Dashboard → Your Project → "Deployments" → View logs

**Vercel:**
Dashboard → Your Project → "Deployments" → Function logs

---

## 💰 Cost Estimate

Both platforms have generous free tiers:

**Railway:**
- $5 free credits/month
- ~$5-10/month for hobby project
- Upgrade for persistent storage

**Vercel:**
- 100GB bandwidth free
- Unlimited deployments
- Free for personal projects

**OpenAI:**
- Pay-as-you-go
- ~$0.01 per query (GPT-4 Turbo)
- Set usage limits in OpenAI dashboard

---

## 🎓 Next Steps

After successful deployment:

1. **Share your demo** with admission board
2. **Monitor usage** (check Railway/Vercel dashboards)
3. **Add analytics** (optional - Google Analytics, Plausible)
4. **Set up custom domain** (optional - $12/year)
5. **Add automated tests** (CI/CD with GitHub Actions)

---

## 🆘 Need Help?

If stuck:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide
2. Review Railway/Vercel documentation
3. Check application logs
4. Test locally with Docker Compose first

---

**Ready to deploy?** Start with Step 1! 🚀

---

**Last Updated:** November 25, 2024

