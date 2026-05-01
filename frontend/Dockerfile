# ── Frontend Dockerfile ─────────────────────────
# Node.js 20 + Next.js 14 Application
# ────────────────────────────────────────────────

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
