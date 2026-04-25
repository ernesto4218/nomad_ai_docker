# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Runner Stage
FROM node:22-slim AS runner

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js
COPY --from=builder /app/src/lib/server/db/schema.ts ./src/lib/server/db/schema.ts

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]