import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { configuration } from "../../libs/common/src/config/global-configuration";

if (process.env.NODE_ENV !== "production") {
  config({ path: "apps/notification-service/.env.development" });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx apps/notification-service/prisma/seed.ts" },
  datasource: { url: configuration().database.url },
});