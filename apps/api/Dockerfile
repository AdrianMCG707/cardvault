FROM node:24-alpine

WORKDIR /app
RUN apk add --no-cache openssl

# Copy everything (simplest correct approach for a monorepo)
COPY . .

# Install all workspace dependencies
RUN npm ci

# Generate the Prisma Client (same command from Substep 0.3, plus CI)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build just the api app
RUN npx turbo run build --filter=api

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/src/main.js"]