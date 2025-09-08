# ---- 1. Base Stage ----
# Use a specific Node.js version for reproducibility.
FROM node:20-alpine as deps
WORKDIR /app
COPY package*.json ./
RUN npm install --frozen-lockfile

# ---- 2. Builder Stage ----
# Build the application and generate Prisma client
# Use a Debian-based image for the builder to avoid native module issues with Alpine/musl.
FROM node:20-slim as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
# This needs to be run before the build.
RUN npx prisma generate

# Build the Next.js application
# The standalone output feature will be enabled in next.config.js
RUN npm run build

# ---- 3. Runner Stage (Final Image) ----
# This stage creates the final, small, and secure image
FROM node:20-alpine as runner
WORKDIR /app

ENV NODE_ENV=production
# The default port for Next.js is 3000, but we can override it.
ENV PORT=3072

## Commented out for local dev to avoid file permission issues
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# RUN mkdir -p /app/data
# RUN chown -R nextjs:nodejs /app/data

# Copy production-ready files from the builder stage
# Copy the standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client for runtime access.
# This is crucial for your app to connect to the database.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./.next/standalone/node_modules/.prisma

## USER nextjs # Commented out for local dev

EXPOSE 3072

# Add a healthcheck to verify the app is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD [ "wget", "-q", "-O", "/dev/null", "http://localhost:3072" ] || exit 1

# Start the server
# The server.js file is created by the `standalone` output mode
CMD ["node", "server.js"]