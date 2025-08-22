# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=512
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Чистый nginx-конфиг с SPA-фоллбеком и healthcheck
RUN cat >/etc/nginx/conf.d/default.conf <<'CONF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /health {
    default_type text/plain;
    return 200 "ok\n";
  }
}
CONF