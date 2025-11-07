FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "index.js"]

#References:
#Docker Docs. (2023). Dockerizing a Node.js web app. [online] Available at: https://docs.docker.com/language/nodejs/build-images/ [Accessed 5 Nov. 2025].
#DigitalOcean. (2022). How To Set Up a Node.js Application for Production on Docker. [online] Available at: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-docker [Accessed 5 Nov. 2025]