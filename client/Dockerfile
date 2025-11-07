# Stage 1: Build the React/Vite app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve the built files with Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

#References:
#Docker Docs. (2023). Dockerizing a Node.js web app. [online] Available at: https://docs.docker.com/language/nodejs/build-images/ [Accessed 5 Nov. 2025].
#DigitalOcean. (2022). How To Set Up a Node.js Application for Production on Docker. [online] Available at: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-docker [Accessed 5 Nov. 2025]
