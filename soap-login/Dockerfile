    # --- Build Stage ---
    FROM node:18-alpine AS build

    ENV NODE_ENV=development
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    RUN npm run build
    
    # --- Production Stage ---
    FROM nginx:alpine
    
    COPY --from=build /app/build /usr/share/nginx/html
    
    # Optional: Replace default nginx.conf with custom config if needed
    # COPY nginx.conf /etc/nginx/nginx.conf
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]
    
