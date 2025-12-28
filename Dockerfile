# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
# Create non-root user and group with fixed IDs
RUN addgroup -g 1001 nodegrp && adduser -D -u 1001 -G nodegrp nodeusr

# Install only production dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --omit=dev || npm install --production

# Copy build artifacts and ensure ownership
COPY --chown=nodeusr:nodegrp --from=base /app/dist ./dist

# Adjust ownership of workdir
RUN chown -R nodeusr:nodegrp /app
USER 1001
EXPOSE 8080
CMD ["node", "dist/index.js"]
