FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:/data/app.db"

RUN chmod +x ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
