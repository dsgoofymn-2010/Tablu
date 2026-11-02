# ---- Stage 1: Build the React frontend ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source and build
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Runtime with Flask backend ----
FROM python:3.11-slim
WORKDIR /app

# Copy backend source code
COPY backend/ ./backend

# Copy the built frontend assets from the builder stage
COPY --from=builder /app/frontend/dist ./frontend/dist

# Install Python runtime dependencies (Flask and bcrypt)
RUN pip install --no-cache-dir flask bcrypt

# Expose the port used by Flask
EXPOSE 5000

# Start the Flask application
CMD ["python", "backend/app.py"]