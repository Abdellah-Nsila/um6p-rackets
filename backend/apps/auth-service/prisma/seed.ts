// apps/auth-service/prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { configuration } from "../../../libs/common/src/config/global-configuration";
import * as argon2 from 'argon2';

const url = configuration().database.url;
console.log("DATABASE_URL:", url);
const schema = new URL(url).searchParams.get('schema') ?? undefined;
const adapter = new PrismaPg({ connectionString: url }, { schema });
const prisma = new PrismaClient({ adapter });

// One coach per club. Keep this ORDER: on a fresh database the ids become 1..5,
// and the club seed uses them as members.user_id.
const coaches = [
  { login: 'coach_tennis', first_name: 'Tennis', last_name: 'Coach', email: 'coach.tennis@example.com' },
  { login: 'coach_padel', first_name: 'Padel', last_name: 'Coach', email: 'coach.padel@example.com' },
  { login: 'coach_badminton', first_name: 'Badminton', last_name: 'Coach', email: 'coach.badminton@example.com' },
  { login: 'coach_squash', first_name: 'Squash', last_name: 'Coach', email: 'coach.squash@example.com' },
  { login: 'coach_table_tennis', first_name: 'Table Tennis', last_name: 'Coach', email: 'coach.table-tennis@example.com' },
  { login: 'coach_table_tennis2', first_name: 'Table Tennis2', last_name: 'Coach', email: 'coach.table-tennis2@example.com' },
];

async function main() {
  const testPassword = 'abdellahnsila123#002';
  const hashedPassword = await argon2.hash(testPassword);

  for (const coach of coaches) {
    await prisma.user.upsert({
      where: { login: coach.login }, // safe to run many times
      update: {},
      create: {
        ...coach,
        // placeholder that can never match a real password, change it when login exists
        password_hash: hashedPassword,
      },
    });
  }
  console.log(`Seeded ${coaches.length} coach users`);

  for (const user of allUsers) {
  await prisma.user.upsert({
    where: { login: user.login },
    update: {},
    create: {
      ...user,
      password_hash: hashedPassword,
    },
  });
}
console.log(`Seeded ${allUsers.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());



// Regular users: emails user6@gmail.com ... user25@gmail.com
const baseLogins = ['ilorez', 'nsila', 'ablabib', 'hamaza'];

const users = Array.from({ length: 50 }, (_, i) => {
  const n = i + 6; // emails start at user6
  const login = baseLogins[i] ?? `player${n}`;
  return {
    login,
    first_name: login.charAt(0).toUpperCase() + login.slice(1),
    last_name: `User${n}`,
    email: `user${n}@gmail.com`,
  };
});

const allUsers = [...coaches, ...users];