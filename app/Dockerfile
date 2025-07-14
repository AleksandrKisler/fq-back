FROM node:22

WORKDIR /app

COPY package*.json ./
RUN curl -fsS https://dotenvx.sh | sh
RUN npm install
RUN npm ci --only=production
RUN dotenvx ext prebuild

COPY . .
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]