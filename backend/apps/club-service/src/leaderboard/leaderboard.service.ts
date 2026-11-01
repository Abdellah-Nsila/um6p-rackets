import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AUTH_PATTERNS,
  AUTH_SERVICE,
  ClubLeaderboard,
  MemberRole,
  rpcError,
  User,
} from '@app/contracts';
import { ClubAccessService } from '../access/club-access.service.js';
import { rpc } from '@app/common/helpers/rpc.helper.js';
import { ClientProxy } from '@nestjs/microservices';
import { Prisma } from '../generated/prisma/client.js';
import { toSummary } from '../helpers.js';

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly prisma: PrismaService,
    private readonly clubAccessService: ClubAccessService,
  ) {}

  async updateLeaderboard(
    tx: Prisma.TransactionClient,
    club_id: number,
    team1_id: number,
    team2_id: number,
    team1_points: number,
    team2_points: number,
    winner_id: number | null,
  ) {
    const team1 = await tx.team.findUnique({
      where: { id: team1_id },
      include: { player1: true, player2: true },
    });

    const team2 = await tx.team.findUnique({
      where: { id: team2_id },
      include: { player1: true, player2: true },
    });

    if (!team1 || !team2) throw new Error('One or both teams not found');

    // --- TEAM 1 ---
    await this.updateMemeberLeaderboard(
      tx,
      club_id,
      team1.player1.user_id,
      team1.player1.id,
      team1_points,
      winner_id === team1.id,
    );

    if (team1.player2) {
      await this.updateMemeberLeaderboard(
        tx,
        club_id,
        team1.player2.user_id,
        team1.player2.id,
        team1_points,
        winner_id === team1.id,
      );
    }

    // --- TEAM 2 ---
    await this.updateMemeberLeaderboard(
      tx,
      club_id,
      team2.player1.user_id,
      team2.player1.id,
      team2_points,
      winner_id === team2.id,
    );

    if (team2.player2) {
      await this.updateMemeberLeaderboard(
        tx,
        club_id,
        team2.player2.user_id,
        team2.player2.id,
        team2_points,
        winner_id === team2.id,
      );
    }
  }

  async updateMemeberLeaderboard(
    tx: Prisma.TransactionClient,
    club_id: number,
    user_id: number,
    member_id: number,
    pointsChange: number,
    isWinner: boolean,
  ) {
    const isWin = isWinner ? 1 : 0;
    const isLose = isWinner ? 0 : 1;

    // 1. Fetch current record to calculate floor limits safely
    const existing = await tx.leaderboard.findUnique({
      where: { club_id_user_id_member_id: { club_id, user_id, member_id } },
    });

    // 2. Clamp total points so they never drop below zero
    const finalPoints = existing
      ? Math.max(0, existing.points + pointsChange)
      : Math.max(0, pointsChange);

    // 3. Pre-calculate the win streak to avoid a second update query
    const currentStreak = existing ? existing.win_streak : 0;
    const newStreak = isWinner ? currentStreak + 1 : 0;

    const currentBest = existing ? existing.best_win_streak : 0;
    const newBest = Math.max(currentBest, newStreak);

    // 4. Upsert using exact values
    await tx.leaderboard.upsert({
      where: { club_id_user_id_member_id: { club_id, user_id, member_id } },
      create: {
        club_id,
        user_id,
        member_id,
        points: finalPoints,
        wins: isWin,
        losses: isLose,
        total_matches: 1,
        win_streak: newStreak,
        best_win_streak: newBest,
        updated_at: new Date(),
      },
      update: {
        points: finalPoints,
        wins: { increment: isWin },
        losses: { increment: isLose },
        total_matches: { increment: 1 },
        win_streak: newStreak,
        best_win_streak: newBest,
        updated_at: new Date(),
      },
    });
  }

  async getClubLeaderboard(
    clubSlug: string,
    page: number,
    limit: number,
    target_user_id: number, // The profile being viewed (optional)
  ): Promise<ClubLeaderboard> {

    const club = await this.prisma.club.findUnique({
      where: { slug: clubSlug },
    });

    if (!club) {
      throw rpcError(404, `Club with slug ${clubSlug} not found`, 'Bad Request');
    }

    const rowsToSkip = (page - 1) * limit;

    // Prepare queries: Paginated rows, Total count, and Target User Rank
    const queries: any[] = [
      this.prisma.leaderboard.findMany({
        where: {
          club_id: club.id,
          total_matches: { gt: 0 }, // Exclude unranked players
        },
        orderBy: [
          { points: 'desc' },
          { wins: 'desc' },
          { losses: 'asc' },
          { total_matches: 'desc' },
          { member_id: 'asc' },
        ],
        skip: rowsToSkip,
        take: limit,
      }),
      this.prisma.leaderboard.count({
        where: {
          club_id: club.id,
          total_matches: { gt: 0 }, // Exclude unranked players
        },
      }),
    ];

    // Here i am using RANK() built-in SQL function to get the rank of the target user in the leaderboard
    // If a target user is provided, add the raw SQL Window Function query
    if (target_user_id) {
      queries.push(
        this.prisma.$queryRaw`
          WITH RankedLeaderboard AS (
            SELECT 
              user_id, member_id, points, wins, losses, total_matches, win_streak, best_win_streak,
              RANK() OVER (
                ORDER BY points DESC, wins DESC, losses ASC, total_matches DESC, member_id ASC
              ) as rank
            FROM "club_schema"."leaderboard"
            WHERE club_id = ${club.id} AND total_matches > 0
          )
          SELECT * FROM RankedLeaderboard WHERE user_id = ${target_user_id} LIMIT 1;
        `,
      );
    }

    // Execute concurrently
    const [rows, total, targetUserRaw] = await Promise.all(queries);

    if (rows.length === 0 && (!targetUserRaw || targetUserRaw.length === 0)) {
      return {
        leaderboard: { data: [], page, limit, total },
        target_user_row: null,
      };
    }

    // Resolve User Details (Auth RPC)
    const uniqueUserIds = new Set(rows.map((row: any) => row.user_id));
    let targetUserDbRow = null;

    if (targetUserRaw && targetUserRaw.length > 0) {
      targetUserDbRow = targetUserRaw[0];
      uniqueUserIds.add(targetUserDbRow.user_id); // Ensure target user is fetched
    }

    const users = await rpc<User[]>(
      this.authClient,
      AUTH_PATTERNS.GET_USERS_BY_IDS,
      { user_ids: Array.from(uniqueUserIds) },
    );
    const userByIdMap = new Map(users.map((user) => [user.id, user]));

    // Map Paginated Rows
    const data = rows.map((row: any, index: number) => {
      const user = userByIdMap.get(row.user_id);
      return {
        rank: rowsToSkip + index + 1,
        points: row.points,
        wins: row.wins,
        losses: row.losses,
        total_matches: row.total_matches,
        win_streak: row.win_streak,
        best_win_streak: row.best_win_streak,
        player: { ...toSummary(user, row.user_id), member_id: row.member_id },
      };
    });

    // Map Target User Row
    let target_user_row = null;
    if (targetUserDbRow) {
      const user = userByIdMap.get(targetUserDbRow.user_id);
      target_user_row = {
        rank: Number(targetUserDbRow.rank),
        points: targetUserDbRow.points,
        wins: targetUserDbRow.wins,
        losses: targetUserDbRow.losses,
        total_matches: targetUserDbRow.total_matches,
        win_streak: targetUserDbRow.win_streak,
        best_win_streak: targetUserDbRow.best_win_streak,
        player: {
          ...toSummary(user, targetUserDbRow.user_id),
          member_id: targetUserDbRow.member_id,
        },
      };
    }

    return {
      leaderboard: { data, page, limit, total },
      target_user_row,
    };
  }
}
