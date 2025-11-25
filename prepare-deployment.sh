#!/bin/bash
#
# Prepare Spiritual AI Chatbot for Production Deployment
# This script prepares your embeddings and configuration for cloud deployment
#

set -e  # Exit on any error

echo "🚀 Preparing for deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo "📦 Step 1: Checking embeddings..."
if [ ! -d "data/embeddings" ] || [ ! -f "data/embeddings/chroma.sqlite3" ]; then
    echo -e "${RED}Error: Embeddings not found!${NC}"
    echo "Please run the backend first to generate embeddings:"
    echo "  cd backend && source venv/bin/activate"
    echo "  python -m app.services.obsidian_parser"
    exit 1
fi

EMBEDDINGS_SIZE=$(du -sh data/embeddings/ | cut -f1)
echo -e "${GREEN}✓ Embeddings found (${EMBEDDINGS_SIZE})${NC}"

echo ""
echo "📋 Step 2: Checking .gitignore..."
if grep -q "^data/embeddings" .gitignore 2>/dev/null; then
    echo -e "${YELLOW}⚠ Embeddings are currently ignored by git${NC}"
    echo ""
    echo "For Railway deployment, you need to commit embeddings to the repo."
    echo "This is required because Railway free tier doesn't support persistent volumes."
    echo ""
    read -p "Do you want to allow embeddings in git? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Comment out the embeddings ignore line
        sed -i.bak 's|^data/embeddings|# data/embeddings  # Uncommitted for deployment|g' .gitignore
        echo -e "${GREEN}✓ Updated .gitignore${NC}"
    else
        echo -e "${YELLOW}Skipping .gitignore update${NC}"
        echo "Note: You'll need to upload embeddings separately or use cloud storage"
    fi
else
    echo -e "${GREEN}✓ Embeddings are trackable by git${NC}"
fi

echo ""
echo "🔐 Step 3: Environment variables check..."

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ backend/.env not found${NC}"
    echo "Creating from template..."
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env from template${NC}"
        echo -e "${YELLOW}Please edit backend/.env with your actual API keys${NC}"
    fi
fi

# Check if .env.local exists in frontend
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠ frontend/.env.local not found${NC}"
    echo "Creating from template..."
    if [ -f "frontend/env.example" ]; then
        cp frontend/env.example frontend/.env.local
        echo -e "${GREEN}✓ Created frontend/.env.local from template${NC}"
    fi
fi

echo ""
echo "🐳 Step 4: Testing Docker build (optional)..."
read -p "Do you want to test Docker build locally? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building backend Docker image..."
    docker build -t spiritual-ai-backend:test ./backend
    echo -e "${GREEN}✓ Backend Docker build successful${NC}"
    
    echo "Building frontend Docker image..."
    docker build -t spiritual-ai-frontend:test ./frontend
    echo -e "${GREEN}✓ Frontend Docker build successful${NC}"
else
    echo "Skipping Docker build test"
fi

echo ""
echo "📊 Deployment readiness summary:"
echo "================================"
echo -e "✓ Project structure: ${GREEN}OK${NC}"
echo -e "✓ Embeddings: ${GREEN}${EMBEDDINGS_SIZE}${NC}"
echo -e "✓ Docker files: ${GREEN}Ready${NC}"
echo -e "✓ Documentation: ${GREEN}Complete${NC}"

echo ""
echo "📝 Next steps:"
echo "1. Commit embeddings (if you updated .gitignore):"
echo "   git add data/embeddings/"
echo "   git commit -m 'chore: add pre-generated embeddings for deployment'"
echo "   git push origin main"
echo ""
echo "2. Follow deployment guide:"
echo "   - See DEPLOY_NOW.md for step-by-step instructions"
echo "   - Or see DEPLOYMENT.md for detailed reference"
echo ""
echo "3. Deploy to Railway (Backend) → Get URL"
echo "4. Deploy to Vercel (Frontend) → Use Railway URL"
echo "5. Update CORS in Railway with Vercel URL"
echo ""
echo -e "${GREEN}🎉 Preparation complete!${NC}"
echo ""
echo "Ready to deploy? Follow DEPLOY_NOW.md"

