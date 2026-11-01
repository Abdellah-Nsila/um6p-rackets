# 1. Validate the updated schema
npx prisma validate

# 2. Create and apply the migration
npx prisma migrate dev --name add_priority

# 3. Regenerate the TypeScript client
npx prisma generate


usign migrate diff and output this to a SQL script `down.sql`

Using --to-migrations: this makes a comparison to the state of the migrations given in the migrations directory. This is the preferred option, as it is more robust. To use this option, run:

```npx prisma migrate diff \
  --from-schema prisma/schema.prisma \
  --to-migrations prisma/migrations \
  --script > down.sql```

