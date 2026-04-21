# Multi-stage build for smaller production image
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies system-wide (not --user)
# so they are readable by any user in the final stage
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ======================================
# Production stage
# ======================================
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder (system-wide path, readable by all users)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY backend/app/ ./app/

# Create non-root user and set up data directories
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data/embeddings && \
    chown -R appuser:appuser /app

# Copy pre-built ChromaDB snapshot (frozen in time)
COPY --chown=appuser:appuser data/embeddings/ ./data/embeddings/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]