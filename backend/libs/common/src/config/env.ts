// libs/common/src/env.ts
export const envFiles = (app: string) => [`apps/${app}/.env.development`, '.env.development']; // first file wins