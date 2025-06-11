# Etapa 1: Build de la app Astro
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml* ./
RUN npm install --frozen-lockfile || npm install
COPY . .
RUN npm run build

# Etapa 2: Imagen final para producción
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instalar Nginx para servir estáticos y SSR
RUN apk add --no-cache nginx

# Copiar archivos de build y estáticos
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/public /app/public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer el puerto 8080
EXPOSE 8080

# Comando de inicio: Nginx + SSR
CMD ["sh", "-c", "nginx && node ./dist/server/entry.mjs"]
