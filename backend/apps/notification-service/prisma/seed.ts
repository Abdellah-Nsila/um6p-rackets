
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { configuration } from '../../../libs/common/src/config/global-configuration';

const url = configuration().database.url;
const schema = new URL(url).searchParams.get('schema') ?? undefined;

const adapter = new PrismaPg(
  { connectionString: url },
  schema ? { schema } : undefined,
);

const prisma = new PrismaClient({ adapter });

type SeedInput = {
  key: string;
  type:
    | 'JOIN_REQUESTED'
    | 'JOIN_ACCEPTED'
    | 'JOIN_REJECTED'
    | 'CLUB_ANNOUNCEMENT';
  club_id: number;
  sender_id?: number;
  sender_name?: string;
  sender_avatar_url?: string | null;
  club_name: string;
  receivers: number[];
  minutesAgo: number;
};

const clubs = [
  { id: 1, name: 'Atlas Rackets Club', coach_user_id: 1 },
  { id: 2, name: 'Tangier Tennis Club', coach_user_id: 2 },
  { id: 3, name: 'Marrakech Sports Club', coach_user_id: 3 },
  { id: 4, name: 'Casablanca Rackets Club', coach_user_id: 4 },
  { id: 5, name: 'Rabat Tennis Club', coach_user_id: 5 },
];

const LEADER_IDS = [6, 7];
const MEMBER_IDS = [8, 9, 10, 11, 12, 13, 14, 15];
const [ACCEPTED_USER, REJECTED_USER, PENDING_USER] = [16, 17, 18];

const userNames: Record<number, string> = {
  1: 'Coach Adam',
  2: 'Coach Youssef',
  3: 'Coach Sara',
  4: 'Coach Omar',
  5: 'Coach Lina',
  6: 'Club Leader 1',
  7: 'Club Leader 2',
  16: 'Amine',
  17: 'Mehdi',
  18: 'Yassine',
};

async function seedNotification(i: SeedInput) {
  const event_id = `seed:${i.key}`;
  const sent_at = new Date(Date.now() - i.minutesAgo * 60_000);

  const receivers = [...new Set(i.receivers)].filter(
    (id) => id !== i.sender_id,
  );

  await prisma.notification.upsert({
    where: { event_id },
    update: {
      sender_type: i.sender_id !== undefined ? 'USER' : 'SYSTEM',
      sender_id: i.sender_id !== undefined ? BigInt(i.sender_id) : null,
      sender_name: i.sender_name ?? null,
      sender_avatar_url: i.sender_avatar_url ?? null,
      category: 'CLUB',
      type: i.type,
      club_id: BigInt(i.club_id),
      club_name: i.club_name,
      sent_at,
      receivers: {
        deleteMany: {},
        create: receivers.map((id) => ({
          receiver_user_id: BigInt(id),
          is_read: false,
          read_at: null,
        })),
      },
    },
    create: {
      event_id,
      sender_type: i.sender_id !== undefined ? 'USER' : 'SYSTEM',
      sender_id: i.sender_id !== undefined ? BigInt(i.sender_id) : null,
      sender_name: i.sender_name ?? null,
      sender_avatar_url: i.sender_avatar_url ?? null,
      category: 'CLUB',
      type: i.type,
      club_id: BigInt(i.club_id),
      club_name: i.club_name,
      sent_at,
      receivers: {
        create: receivers.map((id) => ({
          receiver_user_id: BigInt(id),
          is_read: false,
          read_at: null,
        })),
      },
    },
  });
}

async function seedClubNotifications(
  club: (typeof clubs)[number],
) {
  const coach = club.coach_user_id;
  const admins = [coach, ...LEADER_IDS];
  const everyone = [coach, ...LEADER_IDS, ...MEMBER_IDS];

  const key = (name: string) => `club${club.id}:${name}`;
  const coachName = userNames[coach];

  await seedNotification({
    key: key('join-requested-1'),
    type: 'JOIN_REQUESTED',
    club_id: club.id,
    club_name: club.name,
    sender_id: ACCEPTED_USER,
    sender_name: userNames[ACCEPTED_USER],
    receivers: admins,
    minutesAgo: 60 * 48,
  });

  await seedNotification({
    key: key('join-accepted-1'),
    type: 'JOIN_ACCEPTED',
    club_id: club.id,
    club_name: club.name,
    sender_id: coach,
    sender_name: coachName,
    receivers: [ACCEPTED_USER],
    minutesAgo: 60 * 47,
  });

  await seedNotification({
    key: key('join-rejected-1'),
    type: 'JOIN_REJECTED',
    club_id: club.id,
    club_name: club.name,
    sender_id: coach,
    sender_name: coachName,
    receivers: [REJECTED_USER],
    minutesAgo: 60 * 24,
  });

  await seedNotification({
    key: key('join-requested-2'),
    type: 'JOIN_REQUESTED',
    club_id: club.id,
    club_name: club.name,
    sender_id: PENDING_USER,
    sender_name: userNames[PENDING_USER],
    receivers: admins,
    minutesAgo: 60 * 2,
  });

  await seedNotification({
    key: key('announcement-1'),
    type: 'CLUB_ANNOUNCEMENT',
    club_id: club.id,
    club_name: club.name,
    sender_id: coach,
    sender_name: coachName,
    receivers: everyone,
    minutesAgo: 60 * 72,
  });

  await seedNotification({
    key: key('announcement-2'),
    type: 'CLUB_ANNOUNCEMENT',
    club_id: club.id,
    club_name: club.name,
    sender_id: coach,
    sender_name: coachName,
    receivers: everyone,
    minutesAgo: 60 * 6,
  });
}

async function main() {
  for (const club of clubs) {
    await seedClubNotifications(club);
  }

  console.log(`Seeded notifications for ${clubs.length} clubs`);
}

main()
  .catch((error: unknown) => {
    console.error('Notification seed failed:');
    console.dir(error, { depth: null });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
