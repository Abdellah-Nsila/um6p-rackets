import {
  CreateSessionBody,
  SessionView,
  UpdateSessionBody,
  WeekView,
} from '@app/contracts/club/club.types.js';
import { rpcError } from '@app/contracts/errors.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClubAccessService } from '../access/club-access.service.js';
import {
  weekRange,
  today,
  toDate,
  addDays,
  mondayOf,
  now,
  addMinutes,
  durationMinutes,
  timeOfDay,
  dayOf,
  toFullString,
} from '@app/common/dates.js';
import { sessionState } from './sessions-status.server.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubAccessService: ClubAccessService,
  ) {}

  async getClubWeekSessions(
    clubSlug: string,
    weekStartDate: string,
    user_id: number,
  ): Promise<WeekView> {
    const { member, club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      0,
    ); // minRole = MEMBER (0)
    // generate next week sessions
    await this.generateNextWeekSessions(club.id);
    const { weekStart, from, to } = weekRange(weekStartDate);

    // Fetch sessions for the specified week
    const sessions = await this.prisma.session.findMany({
      where: {
        club_id: club.id,
        start_at: {
          gte: from,
          lt: to,
        },
        cancelled_at: null, // Exclude cancelled sessions
      },
      orderBy: {
        start_at: 'asc',
      },
    });

    // Fetch the attends count for each session in a single query
    const attendsCounts = await this.prisma.sessionAttend.groupBy({
      by: ['session_id'],
      where: {
        session_id: {
          in: sessions.map((s) => s.id),
        },
      },
      _count: {
        session_id: true,
      },
    });

    const attendsCountMap = new Map(
      attendsCounts.map((ac) => [ac.session_id, ac._count.session_id]),
    );

    // get is joined for each session for the current user
    // we need just session id so we select only session id
    const sessionAttends = await this.prisma.sessionAttend.findMany({
      where: {
        member_id: member.id,
        session_id: {
          in: sessions.map((s) => s.id),
        },
      },
      select: {
        session_id: true,
      },
    });

    // create a set of session ids that the user has joined,
    const joinedSessionIds = new Set(sessionAttends.map((sa) => sa.session_id));

    const sessionViews: SessionView[] = sessions.map((session) => {
      const attendsCount = attendsCountMap.get(session.id) ?? 0;

      return {
        ...session,
        start_at: toFullString(session.start_at),
        end_at: toFullString(session.end_at),
        cancelled_at: session.cancelled_at ? toFullString(session.cancelled_at) : null,
        created_at: toFullString(session.created_at),
        updated_at: toFullString(session.updated_at),
        attends_count: attendsCount,
        spots_left: Math.max(0, session.capacity - attendsCount),
        is_joined: joinedSessionIds.has(session.id), // Placeholder for current user check
        state: sessionState(session, attendsCount),
      };
    });

    const to_day = today();

    const isCurrentWeek = weekStart <= to_day && toDate(to_day) < to;

    return {
      week_start: weekStart,
      is_current_week: isCurrentWeek,
      prev_week_start: addDays(weekStart, -7),
      next_week_start: addDays(weekStart, 7),
      sessions: sessionViews,
    };
  }

  async attendSession(clubSlug: string, sessionId: string, user_id: number): Promise<{ success: boolean; message: string }> {
    const { member, club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      0,
    );

    // Check if the session exists and belongs to the club
    const session = await this.prisma.session.findUnique({
      where: {
        id: parseInt(sessionId, 10),
      },
    });

    if (!session || session.club_id !== club.id) {
      throw rpcError(404, 'Session not found', 'Not Found');
    }

    // check if sessions is in past, if yes, throw error
    if (session.start_at < toDate(today())) {
      throw rpcError(400, 'Cannot attend a session in the past', 'Bad Request');
    }

    // check if session is cancelled, if yes, throw error
    if (session.cancelled_at) {
      throw rpcError(400, 'Cannot attend a cancelled session', 'Bad Request');
    }

    // Check if the user is already attending the session
    const existingAttend = await this.prisma.sessionAttend.findUnique({
      where: {
        session_id_member_id: {
          member_id: member.id,
          session_id: session.id,
        },
      },
    });

    if (existingAttend) {
      throw rpcError(
        400,
        'User is already attending this session',
        'Bad Request',
      );
    }

    // Check if the session has available spots
    const attendsCount = await this.prisma.sessionAttend.count({
      where: {
        session_id: session.id,
      },
    });

    if (attendsCount >= session.capacity) {
      throw rpcError(400, 'Session is full', 'Bad Request');
    }

    // Create a new session attend record
    await this.prisma.sessionAttend.create({
      data: {
        member_id: member.id,
        session_id: session.id,
      },
    });

    return { success: true, message: 'successfully attended the session' };
  }

  async unattendSession(clubSlug: string, sessionId: string, user_id: number): Promise<{ success: boolean; message: string }> {
    const { member, club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      0,
    );

    // Check if the session exists and belongs to the club
    const session = await this.prisma.session.findUnique({
      where: {
        id: parseInt(sessionId, 10),
      },
    });

    if (!session || session.club_id !== club.id) {
      throw rpcError(404, 'Session not found', 'Not Found');
    }

    // check if sessions is in past, if yes, throw error
    if (session.start_at < toDate(today())) {
      throw rpcError(
        400,
        'Cannot unattend a session in the past',
        'Bad Request',
      );
    }

    // check if session is cancelled, if yes, throw error
    if (session.cancelled_at) {
      throw rpcError(400, 'Cannot unattend a cancelled session', 'Bad Request');
    }

    // Check if the user is attending the session
    const existingAttend = await this.prisma.sessionAttend.findUnique({
      where: {
        session_id_member_id: {
          member_id: member.id,
          session_id: session.id,
        },
      },
    });

    if (!existingAttend) {
      throw rpcError(400, 'User is not attending this session', 'Bad Request');
    }

    // Delete the session attend record
    await this.prisma.sessionAttend.delete({
      where: {
        session_id_member_id: {
          member_id: member.id,
          session_id: session.id,
        },
      },
    });

    return {
      success: true,
      message: 'successfully unattended the session',
    };
  }

  async createSession(
    clubSlug: string,
    user_id: number,
    body: CreateSessionBody,
  ): Promise<WeekView> {
    const { club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      1, // LEADER or COACH
    ); // here we chack that is member and have role >= 1

    const {
      weekday,
      start_time,
      end_time,
      title,
      location,
      capacity,
      repeat_weekly,
      week_start,
    } = body;

    const monday = mondayOf(week_start ?? today());

    // check if the session is far then 2 weeks from monday of this week, if yes, throw error
    const twoWeeksFromNow = addDays(mondayOf(today()), 14);
    if (monday >= twoWeeksFromNow) {
      throw rpcError(
        400,
        'Cannot create a session more than 2 weeks in advance',
        'Bad Request',
      );
    }

    const minutes = durationMinutes(start_time, end_time);
    if (minutes === 0) {
      throw rpcError(
        400,
        'end_time must be different from start_time',
        'Bad Request',
      );
    }

    const sessionStart = toDate(addDays(monday, weekday), start_time);
    const sessionEnd = addMinutes(sessionStart, minutes); // handles crossing midnight

    if (sessionStart < new Date()) {
      throw rpcError(400, 'Cannot create a session in the past', 'Bad Request');
    }

    const existingSession = await this.prisma.session.findFirst({
      where: {
        club_id: club.id,
        start_at: sessionStart,
        end_at: sessionEnd,
        location: location ?? null,
        title: title ?? null,
        cancelled_at: null,
      },
    });

    if (existingSession) {
      throw rpcError(
        400,
        'A session with the same time, location, and title already exists for this club',
        'Bad Request',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      let templateId: number | null = null;
      if (repeat_weekly) {
        // check if a template is already exists for this club with the same weekday, start_time, and duration_minutes

        await tx.sessionTemplate
          .findFirst({
            where: {
              club_id: club.id,
              weekday,
              start_time,
              location: location ?? null,
              title: title ?? null,
              duration_minutes: minutes,
            },
          })
          .then((template) => {
            if (template) {
              templateId = template.id;
            }
          });

        if (!templateId) {
          // create a new template for the session
          const template = await tx.sessionTemplate.create({
            data: {
              club_id: club.id,
              weekday,
              start_time, // example: "18:00"
              duration_minutes: minutes,
              title: title ?? null,
              location: location ?? null,
              capacity,
            },
          });
          templateId = template.id;
        }
      }
      await tx.session.create({
        data: {
          club_id: club.id,
          template_id: templateId,
          start_at: sessionStart,
          end_at: sessionEnd,
          title: title ?? null,
          location: location ?? null,
          capacity,
          cancelled_at: null,
        },
      });
    });

    return this.getClubWeekSessions(clubSlug, monday, user_id);
  }

  async updateSession(
    clubSlug: string,
    sessionId: string,
    user_id: number,
    body: UpdateSessionBody,
  ): Promise<WeekView> {
    const { club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      1, // LEADER or COACH
    );

    const session = await this.prisma.session.findUnique({
      where: { id: parseInt(sessionId, 10) },
    });
    if (!session || session.club_id !== club.id) {
      throw rpcError(404, 'Session not found', 'Not Found');
    }

    // Fall back to the current values when not provided
    const startTime = body.start_time ?? timeOfDay(session.start_at);
    const endTime = body.end_time ?? timeOfDay(session.end_at);

    // durationMinutes handles crossing midnight (e.g. 23:00 -> 00:30)
    const minutes = durationMinutes(startTime, endTime);
    if (minutes === 0) {
      throw rpcError(
        400,
        'end_time must be different from start_time',
        'Bad Request',
      );
    }

    const start_at = toDate(dayOf(session.start_at), startTime);
    if (start_at < new Date()) {
      throw rpcError(400, 'Cannot update a session in the past', 'Bad Request');
    }

    // because prisma ignore undefined values
    const fields = {
      title: body.title ?? undefined,
      location: body.location ?? undefined,
      capacity: body.capacity ?? undefined,
    };

    const updated = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        ...fields,
        start_at,
        end_at: addMinutes(start_at, minutes),
        updated_at: now(),
      },
    });

    if (body.apply_to_future && session.template_id) {
      const timeChanged = !!(body.start_time || body.end_time);

      // Update the template
      await this.prisma.sessionTemplate.update({
        where: { id: session.template_id },
        data: {
          ...fields,
          start_time: body.start_time,
          duration_minutes: timeChanged ? minutes : undefined,
          updated_at: now(),
        },
      });

      // Update future sessions: keep each on its own day, only change the time
      const future = await this.prisma.session.findMany({
        where: {
          template_id: session.template_id,
          start_at: { gt: updated.start_at },
        },
      });

      await this.prisma.$transaction(
        future.map((s) => {
          const start = toDate(dayOf(s.start_at), startTime);
          return this.prisma.session.update({
            where: { id: s.id },
            data: {
              ...fields,
              start_at: start,
              end_at: addMinutes(start, minutes),
              updated_at: now(),
            },
          });
        }),
      );
    }

    return this.getClubWeekSessions(
      clubSlug,
      mondayOf(toFullString(updated.start_at).split('T')[0]),
      user_id,
    );
  }

  async deleteSession(
    clubSlug: string,
    sessionId: string,
    user_id: number,
    applyToFuture: boolean,
  ): Promise<WeekView> {
    const { club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      1, // LEADER or COACH
    );

    const session = await this.prisma.session.findUnique({
      where: {
        id: parseInt(sessionId, 10),
      },
    });

    if (!session || session.club_id !== club.id) {
      throw rpcError(404, 'Session not found', 'Not Found');
    }

    // set cancelled_at for the session instead of deleting it
    await this.prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        cancelled_at: now(),
      },
    });

    // If apply_to_future is true and a template_id is provided, delete future sessions
    if (applyToFuture && session.template_id) {
      const templateId = session.template_id;

      // set cancelled_at for future sessions instead of deleting them
      await this.prisma.session.updateMany({
        where: {
          template_id: templateId,
          start_at: {
            gt: session.start_at,
          },
        },
        data: {
          cancelled_at: now(),
          template_id: null, // remove the template_id from future sessions
        },
      });
      // delete the template if template_id is provided
      await this.prisma.sessionTemplate.delete({
        where: {
          id: templateId,
        },
      });
    }

    return this.getClubWeekSessions(
      clubSlug,
      mondayOf(toFullString(session.start_at).split('T')[0]),
      user_id,
    );
  }

  // private method, that called by getClubWeekSessions to generate next week sessions based on the templates of the club
  private async generateNextWeekSessions(club_id: number) {
    // get template of the club
    const templates = await this.prisma.sessionTemplate.findMany({
      where: {
        club_id: club_id,
      },
    });

    const nextweekMonday = mondayOf(addDays(today(), 7));

    await this.prisma.$transaction(async (tx) => {
      for (const template of templates) {
        const sessionStart = toDate(
          addDays(nextweekMonday, template.weekday),
          template.start_time,
        );
        const sessionEnd = addMinutes(sessionStart, template.duration_minutes);

        // check if the session already exists
        // template id and club id
        // but also we need to check if the start_at is greater than or equal to nextweekMonday and less than nextweekMonday + 7 days
        const existingSession = await tx.session.findFirst({
          where: {
            template_id: template.id,
            club_id: club_id,
            start_at: {
              gte: sessionStart,
              lt: toDate(addDays(nextweekMonday, 7), template.start_time),
            },
          },
        });

        if (!existingSession) {
          await tx.session.create({
            data: {
              club_id: club_id,
              template_id: template.id,
              start_at: sessionStart,
              end_at: sessionEnd,
              title: template.title ?? null,
              location: template.location ?? null,
              capacity: template.capacity,
              cancelled_at: null,
            },
          });
        }
      }
    });
  }
}
