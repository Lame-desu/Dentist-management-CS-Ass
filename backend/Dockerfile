# ── Backend Dockerfile ──────────────────────────
# Node.js 20 + Express.js API Server
# ────────────────────────────────────────────────

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Fix Windows CRLF line endings → LF, then make executable
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
