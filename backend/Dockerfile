# CarbonTrail backend — FastAPI + DuckDB
FROM python:3.12-slim

# curl is needed for the container HEALTHCHECK below
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install Python deps first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (the large DuckDB file is excluded via .dockerignore
# and mounted as a volume at runtime instead)
COPY app ./app
COPY etl ./etl

# Default location of the DuckDB file inside the container; the data dir is a
# mounted volume (see docker-compose.yml). This matches CARBONTRAIL_DB.
RUN mkdir -p /app/data
ENV CARBONTRAIL_DB=/app/data/carbontrail.duckdb

EXPOSE 8902

# Hit the API health endpoint (which also confirms the DuckDB is readable)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8902/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8902"]
