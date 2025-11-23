# Stage 1: Build the React App
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set API URLs to relative paths so Nginx can proxy them
ENV VITE_AUTH_API_URL=/api/auth
ENV VITE_CONTEST_API_URL=/api/contests
# For WebSocket, use the browser's current host
ENV VITE_CONTEST_WS_URL=/ws-contests

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# We will mount the custom nginx.conf via Docker Compose
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]