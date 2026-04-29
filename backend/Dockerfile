FROM python:3.12-slim

WORKDIR /app

# Install deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Create data dir
RUN mkdir -p /app/data

EXPOSE 8902

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8902"]
