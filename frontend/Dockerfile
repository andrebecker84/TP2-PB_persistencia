# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* é inlinado no bundle do cliente EM TEMPO DE BUILD — passar só
# como environment no compose (runtime) não chega ao navegador. Vem como
# build-arg do docker-compose.yml; sem valor, vale o default do código.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Saída standalone (next.config.ts: output "standalone"): server.js próprio +
# só as dependências realmente usadas — imagem final sem node_modules completo.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# O server.js standalone escuta em localhost por padrão — invisível de fora do
# contêiner. HOSTNAME=0.0.0.0 abre para o mapeamento de portas do compose.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000
CMD ["node", "server.js"]
