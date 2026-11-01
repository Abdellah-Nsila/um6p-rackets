
# deps
FROM node:22-slim AS deps

####################################
# libc6-compat is required when containerizing a Next.js application using an Alpine
# Why is it needed?
# Alpine Linux uses musl as its standard C library instead of glibc (GNU C Library), 
# which is standard on Debian/Ubuntu-based images.
# Next.js relies on certain native Node.js addons and dependencies—such as SWC 
# (the Next.js compiler), sharp (for image optimization), or ORMs like Prisma—which are
# pre-compiled for glibc. Adding libc6-compat provides a compatibility layer that allows
# these glibc-dependent binaries to run smoothly on Alpine's musl environment without 
# throwing missing library or process.dlopen execution errors.

# RUN apk add --no-cache libc6-compat
# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.edge.kernel.org/g' /etc/apk/repositories && \
#     apk update && \
#     apk add --no-cache libc6-compat
#####################################

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# build stage
FROM node:22-slim AS builder

WORKDIR /app

# using COPY --from=deps /app/node_modules . is not working why because of docker copy behavior
COPY --from=deps /app/node_modules ./node_modules

COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_PREFIX
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_API_PREFIX=$NEXT_PUBLIC_API_PREFIX

RUN npm run build

# production stage
FROM node:22-slim

##################################
# NODE_ENV tells your app and its tools which mode it's running in:
# usually "development" or "production".
#
# What it changes:
#   - Libraries behave differently. Express, for example, caches more and
#     hides detailed error messages in production. In development you get
#     extra warnings and debugging info.
#   - npm install behavior. With NODE_ENV=production, npm install skips
#     devDependencies (testing tools, TypeScript types, etc.), so the
#     image is smaller.
#   - Your own code can check it:
#       if (process.env.NODE_ENV === 'production') { ... }
ARG ENVIRONMENT=production
ENV NODE_ENV=$ENVIRONMENT
################################

# It stops Next.js from sending anonymous usage statistics and crash reports to Vercel.
# This saves a tiny amount of network overhead and ensures complete data privacy.
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY --from=builder /app/public ./public
# copy in that following case copying files from  inside standalone folder to current folder due "/"(slash)
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["node", "server.js"]


