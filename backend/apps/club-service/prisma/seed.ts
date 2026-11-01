// apps/club-service/prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { configuration } from '../../../libs/common/src/config/global-configuration';
import {
  addDays,
  addMinutes,
  mondayOf,
  today,
  toDate,
} from '../../../libs/common/src/dates';
import { AchievementCode } from '../../../libs/contracts/src/club/index.js';

const url = configuration().database.url;
const schema = new URL(url).searchParams.get('schema') ?? undefined;

const adapter = new PrismaPg({ connectionString: url }, { schema });
const prisma = new PrismaClient({ adapter });

// ==========================================
// Data
// ==========================================

const COACH_ROLE = 2; // MemberRole.COACH

const clubs = [
  { name: 'Tennis', slug: 'tennis', description: 'Tennis club', coach_user_id: 1, avatar: null },
  { name: 'Padel', slug: 'padel', description: 'Padel club', coach_user_id: 2, avatar: null },
  { name: 'Badminton', slug: 'badminton', description: 'Badminton club', coach_user_id: 3, avatar: null },
  { name: 'Squash', slug: 'squash', description: 'Squash club', coach_user_id: 4, avatar: null },
  { name: 'Table Tennis', slug: 'table-tennis', description: 'Table tennis club', coach_user_id: 5, avatar: null },
];

const LEADER_IDS = [6, 7]; 
const MEMBER_IDS = [8, 9, 10, 11, 12, 13, 14, 15];

const TEMPLATES = [
  { weekday: 1, start: '17:00', duration_minutes: 120, capacity: 12, title: 'Beginners', location: 'Court 1' },
  { weekday: 3, start: '17:00', duration_minutes: 120, capacity: 8, title: 'Advanced', location: 'Court 2' },
];

// ==========================================
// Seeds
// ==========================================

async function seedMembers(club_id: number) {
  await prisma.member.createMany({
    data: [
      ...LEADER_IDS.map((user_id) => ({ club_id: club_id, user_id, role: 1 })),
      ...MEMBER_IDS.map((user_id) => ({ club_id: club_id, user_id, role: 0 })),
    ],
    skipDuplicates: true,
  });
}

async function seedSessions(club_id: number) {
  if (await prisma.sessionTemplate.count({ where: { club_id: club_id } })) return;
  const weekStart = mondayOf(today()); 

  for (const t of TEMPLATES) {
    const template = await prisma.sessionTemplate.create({
      data: {
        club_id: club_id, 
        weekday: t.weekday, 
        start_time: t.start,
        duration_minutes: t.duration_minutes, 
        capacity: t.capacity,
        title: t.title, 
        location: t.location,
      },
    });

    const weekOffsets = Array.from({ length: 14 }, (_, i) => i - 12); // -12 to 1
    const data = weekOffsets.map((week) => {
      const day = addDays(weekStart, week * 7 + ((t.weekday + 6) % 7)); 
      const start_at = toDate(day, t.start);
      return {
        club_id: club_id, 
        template_id: template.id, 
        start_at,
        end_at: addMinutes(start_at, t.duration_minutes),
        title: t.title, 
        location: t.location, 
        capacity: t.capacity,
      };
    });

    await prisma.session.createMany({ data, skipDuplicates: true });
  }
}

async function seedAttendance(club_id: number) {
  if (await prisma.sessionAttend.count({ where: { session: { club_id: club_id } } })) return;
  
  const sessions = await prisma.session.findMany({
    where: { club_id: club_id, start_at: { lt: new Date() } },
    orderBy: { start_at: 'asc' },
  });
  
  const members = await prisma.member.findMany({
    where: { club_id: club_id },
    orderBy: { id: 'asc' },
  });
  
  const data = sessions.flatMap((s, i) =>
    members.slice(0, 6 + (i % 3)).map((m) => ({ session_id: s.id, member_id: m.id })),
  );
  
  await prisma.sessionAttend.createMany({ data, skipDuplicates: true });
}

async function seedAnnouncements(club_id: number, coachMemberId: number) {
  if (await prisma.announcement.count({ where: { club_id: club_id } })) return;
  
  await prisma.announcement.createMany({
    data: [
      { club_id: club_id, announcer_id: coachMemberId, description: 'Welcome to the new season!' },
      { club_id: club_id, announcer_id: coachMemberId, description: 'Sessions start this Monday at 17:00.' },
    ],
    skipDuplicates: true,
  });
}

async function seedTeamsAndMatches(club_id: number) {
  if (await prisma.match.count({ where: { club_id: club_id } })) return; 

  const players = await prisma.member.findMany({ where: { club_id: club_id } });
  const [referee] = await prisma.member.findMany({ where: { club_id: club_id, role: 1 } });

  // 1. Setup 1v1 Teams
  const singlesTeams = await Promise.all(
    players.map((p) => prisma.team.create({ data: { club_id, player1_id: p.id } }))
  );

  // 2. Setup Random 2v2 Teams (15 doubles teams)
  const doublesTeamsData = [];
  for (let i = 0; i < 15; i++) {
    const p1 = players[Math.floor(Math.random() * players.length)];
    let p2 = players[Math.floor(Math.random() * players.length)];
    while (p1.id === p2.id) p2 = players[Math.floor(Math.random() * players.length)];
    doublesTeamsData.push({ club_id, player1_id: p1.id, player2_id: p2.id });
  }
  await prisma.team.createMany({ data: doublesTeamsData, skipDuplicates: true });
  const doublesTeams = await prisma.team.findMany({ where: { club_id, player2_id: { not: null } } });


  // 3. Generate exactly 20 Matches with realistic past created_at and scheduled_at timestamps
  const matchesToCreate = [];
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
  const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

  for (let i = 0; i < 20; i++) {
    const isDoubles = Math.random() > 0.4; // 60% doubles, 40% singles
    const pool = isDoubles ? doublesTeams : singlesTeams;

    let t1 = pool[Math.floor(Math.random() * pool.length)];
    let t2 = pool[Math.floor(Math.random() * pool.length)];

    // Ensure no player overlaps on opposing teams and teams are distinct
    while (
      t1.id === t2.id ||
      t1.player1_id === t2.player1_id || 
      t1.player1_id === t2.player2_id || 
      (t1.player2_id && t1.player2_id === t2.player1_id) || 
      (t1.player2_id && t1.player2_id === t2.player2_id)
    ) {
      t2 = pool[Math.floor(Math.random() * pool.length)];
    }

    const t1Wins = Math.random() > 0.5;
    const winnerScore = 21;
    const loserScore = Math.floor(Math.random() * 19);

    // Random day in the past (e.g. 1 to 90 days ago)
    const matchAgeDays = Math.floor(Math.random() * 90) + 1;
    const scheduledDate = daysAgo(matchAgeDays);
    
    // created_at should be slightly *before* or *on* the scheduled match date (e.g., 1-3 days prior)
    const creationDate = daysAgo(matchAgeDays + Math.floor(Math.random() * 3) + 1);

    matchesToCreate.push({
      club_id,
      ref_id: referee.id,
      team1_id: t1.id,
      team2_id: t2.id,
      winner_id: t1Wins ? t1.id : t2.id,
      team1_score: t1Wins ? winnerScore : loserScore,
      team2_score: t1Wins ? loserScore : winnerScore,
      team1_points: t1Wins ? 3 : -1,
      team2_points: t1Wins ? -1 : 3,
      mode: isDoubles ? 2 : 1,
      status: 2, // 2 = FINISHED
      scheduled_at: scheduledDate,
      created_at: creationDate, // Properly positioned in the past relative to scheduled_at
    });
  }

  // Inject 2 active pending/upcoming matches for UI testing (created recently, scheduled in future)
  matchesToCreate.push(
    { club_id, ref_id: referee.id, team1_id: singlesTeams[0].id, team2_id: singlesTeams[1].id, mode: 1, status: 1, scheduled_at: daysFromNow(2), created_at: daysAgo(1) },
    { club_id, ref_id: referee.id, team1_id: singlesTeams[2].id, team2_id: singlesTeams[3].id, mode: 1, status: 0, scheduled_at: daysFromNow(5), created_at: daysAgo(2) }
  );

  await prisma.match.createMany({ data: matchesToCreate });
}

async function seedLeaderboard(club_id: number) {
  const members = await prisma.member.findMany({ where: { club_id } });

  const stats = new Map<number, { wins: number; losses: number; points: number; streak: number; best_streak: number; total_matches: number; user_id: number }>();
  
  for (const m of members) {
    stats.set(m.id, { wins: 0, losses: 0, points: 0, streak: 0, best_streak: 0, total_matches: 0, user_id: m.user_id });
  }

  // Fetch all finished matches strictly in chronological order to build streaks correctly
  const matches = await prisma.match.findMany({
    where: { club_id, status: 2 },
    orderBy: { scheduled_at: 'asc' },
    include: { team1: true, team2: true }
  });

  for (const match of matches) {
    const t1Wins = match.winner_id === match.team1_id;
    
    const updateStats = (team: any, isWin: boolean, pointsChange: number) => {
      [team.player1_id, team.player2_id].forEach(playerId => {
        if (!playerId || !stats.has(playerId)) return;
        const s = stats.get(playerId)!;
        
        s.total_matches += 1;
        if (isWin) {
          s.wins += 1;
          s.streak += 1;
          s.best_streak = Math.max(s.best_streak, s.streak);
        } else {
          s.losses += 1;
          s.streak = 0;
        }
        
        s.points = Math.max(0, s.points + pointsChange);
      });
    };

    updateStats(match.team1, t1Wins, match.team1_points);
    updateStats(match.team2, !t1Wins, match.team2_points);
  }

  for (const [memberId, s] of stats.entries()) {
    await prisma.leaderboard.upsert({
      where: { club_id_user_id_member_id: { club_id, user_id: s.user_id, member_id: memberId } },
      update: {
        points: s.points,
        wins: s.wins,
        losses: s.losses,
        total_matches: s.total_matches,
        win_streak: s.streak,
        best_win_streak: s.best_streak,
      },
      create: {
        club_id,
        user_id: s.user_id,
        member_id: memberId,
        points: s.points,
        wins: s.wins,
        losses: s.losses,
        total_matches: s.total_matches,
        win_streak: s.streak,
        best_win_streak: s.best_streak,
      }
    });
  }
}

async function seedAchievements(club_id: number, coach: { id: number; user_id: number }) {
  if (await prisma.achievement.count({ where: { club_id: club_id } })) return;
  const players = await prisma.member.findMany({ where: { club_id: club_id, role: 0 }, orderBy: { id: 'asc' }, take: 3 });
  const given = [AchievementCode.SEASON_CHAMPION, AchievementCode.MOST_IMPROVED, AchievementCode.PERFECT_ATTENDANCE];

  await prisma.achievement.createMany({
    data: [
      ...players.map((p, i) => ({ club_id: club_id, user_id: p.user_id, code: given[i], awarded_by: coach.id })),
      { club_id: club_id, user_id: coach.user_id, code: AchievementCode.FOUNDING_MEMBER, awarded_by: null },
      { club_id: club_id, user_id: players[0].user_id, code: AchievementCode.FIRST_WIN, awarded_by: null },
      { club_id: club_id, user_id: players[1].user_id, code: AchievementCode.FIRST_SESSION, awarded_by: null },
    ],
    skipDuplicates: true,
  });
}

// ==========================================
// Run
// ==========================================

async function main() {
  for (const { coach_user_id, ...data } of clubs) {
    const club = await prisma.club.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });

    const coach = await prisma.member.upsert({
      where: { club_id_user_id: { club_id: club.id, user_id: coach_user_id } },
      update: {},
      create: { club_id: club.id, user_id: coach_user_id, role: COACH_ROLE },
    });

    await seedMembers(club.id);
    await seedSessions(club.id);
    await seedAttendance(club.id); 
    await seedAnnouncements(club.id, coach.id);
    
    await seedTeamsAndMatches(club.id);
    await seedLeaderboard(club.id);
    await seedAchievements(club.id, coach);
  }
  console.log(`Seeded ${clubs.length} clubs with realistic historical created_at and scheduled_at timelines.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());