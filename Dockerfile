# Stage 1: Build the React App
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
# Copy the built Vite assets to NGINX's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Add a custom NGINX config to handle React Router (SPA routing).
# index.html is never content-hashed, so it must never be cached by the browser —
# otherwise it keeps pointing at a stale (and eventually 404ing) hashed JS/CSS bundle
# after every redeploy. The hashed assets themselves are safe to cache aggressively
# since their filename changes whenever their content does.
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    location /assets/ { \
        root /usr/share/nginx/html; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
