# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

# Prepare standalone bundle with Prisma client runtime only
RUN mkdir -p .next/standalone/node_modules/@prisma .next/standalone/node_modules/.prisma \
  && cp -r node_modules/@prisma/. .next/standalone/node_modules/@prisma/ \
  && cp -r node_modules/.prisma/. .next/standalone/node_modules/.prisma/ \
  && cp package.json .next/standalone/package.json \
  && mkdir -p .next/standalone/scripts \
  && cp scripts/validate-env.mjs .next/standalone/scripts/validate-env.mjs \
  && cp scripts/verify-db.mjs .next/standalone/scripts/verify-db.mjs

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache su-exec wget openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma /migrate/prisma
COPY docker/entrypoint.sh /app/entrypoint.sh

# Isolated Prisma CLI for startup migrations (full dependency tree)
WORKDIR /migrate
RUN npm install prisma@6.19.3 --omit=dev --no-package-lock

WORKDIR /app
RUN chmod +x /app/entrypoint.sh \
  && mkdir -p /data /data/uploads /app/logs \
  && chown -R nextjs:nodejs /app /data /app/logs /migrate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"status":"healthy"' || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
