# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the SvelteKit app (compiles Svelte 5 and Tailwind v4)
RUN npm run build

# Runner Stage
FROM node:22-slim AS runner

WORKDIR /app

# Copy standard app files
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# CRITICAL: Copy the migration files and Drizzle config
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Set environment to production
ENV NODE_ENV=production
EXPOSE 3000

# Fire the start script (Runs drizzle-kit migrate, THEN starts Node)
CMD ["npm", "run", "start"]