# this is build stage
FROM node:24.21.0-alpine3.24 AS build

WORKDIR /usr/src/app

COPY package*.json ./

# install dependencies, CI is used to install exact versions of dependencies from package-lock.json, which is important for reproducible builds
# and this helps also to avoid any issues with peer dependencies, as npm ci will fail if there are any unmet peer dependencies

RUN npm ci

COPY . .

ARG APP_NAME
# its doesn't make sense to run prisma generate for api-gateway because its doesn't have it
RUN if [ -f "apps/${APP_NAME}/prisma7.config.ts" ]; then \
      npm run prisma:${APP_NAME} -- generate; \
fi
RUN npm run build ${APP_NAME}

# this is migration stage
# this stage should not be runned for api-getway
FROM build AS migrate
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
CMD ["sh", "-c", "npm run prisma:${APP_NAME} -- migrate deploy"]


# this is seed stage (dev only)
# this stage should not be runned for api-getway
FROM build AS seed
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
CMD ["sh", "-c", "npm run prisma:${APP_NAME} -- db seed"]

# Final image for production
FROM node:24.21.0-alpine3.24

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --chown=node:node package*.json ./

# install production dependencies and clean npm cache to reduce image size, --omit=dev flag is used to skip dev dependencies
RUN npm ci --omit=dev && npm cache clean --force

ARG APP_NAME
ENV EXEC_PATH=/usr/src/app/dist/apps/${APP_NAME}/main.js

COPY --from=build --chown=node:node  /usr/src/app/dist ./dist

# for run as non-root user, then node user is already created in the base image.
USER node

EXPOSE 3000

CMD ["sh", "-c", "exec node $EXEC_PATH"]
