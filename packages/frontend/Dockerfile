FROM node:20-alpine

WORKDIR /app

# Build context is the repo root so npm workspaces resolve correctly.
COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm install --workspace @healthy-life/frontend

COPY packages/frontend packages/frontend

WORKDIR /app/packages/frontend

EXPOSE 3000

CMD ["npm", "run", "dev"]
