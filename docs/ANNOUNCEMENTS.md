# UM6P Rackets: Club Announcements

## Description

The **Club Announcements** module is the communication feed of a club. Leaders and coaches publish news (changes of schedule, events, reminders), and the members read it on the club page.

**Goal:** give members one place to stay informed, and show them clearly who published each announcement and when.

**Key features**
- **Publish:** only a leader or a coach can publish an announcement.
- **Feed with details:** each announcement shows its text, the date and time of publication, and its author.
- **Validated text:** the text must not be empty and has a maximum length. It is checked in the form and again on the backend.
- **Delete:** a leader or a coach can delete an announcement that is outdated (for example a cancelled session).
- **Pagination:** the feed is paginated, newest first.
- **Members only:** only the members of the club can read its announcements.

## Instructions

This module is part of the main platform. Start the whole project as described in the [README](../README.md), then open **https://localhost** and accept the self-signed certificate.

1. Log in as a **leader or coach** of a club, open the club page, and go to its announcements section.
2. Publish an announcement. It appears at the top of the feed, with the author and the date.
3. Log in as a **member** of the same club: the announcement is visible, but there is no publish or delete action.
4. As a leader or coach, delete the announcement.

## Resources

- [Next.js](https://nextjs.org/docs) and [shadcn/ui](https://ui.shadcn.com/): the feed and the interface components (card, dialog, button).
- [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/): validation of the form.
- [NestJS](https://docs.nestjs.com) and [Prisma](https://www.prisma.io/docs): the endpoints and the database access.

## Team Information

- **hwahmane** (frontend): the feed, the date and author display, the form, its validation and the role-based display.
- **znajdaou** (backend): the endpoints in the club service, the role checks, the backend validation and the table.

## Project Management

- The feature was split into a frontend part (feed, form, validation) and a backend part (endpoints, database, author data).
- The endpoints were written in the API contract first, so both sides worked from the same document (see [API.md](API.md)).
- Tasks and the contract were managed in Notion, the code is in the single Git repository, and Discord was used for the daily communication.

## Technical Stack

- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui, Zod and React Hook Form.
- **Backend:** NestJS (the `club-service` behind the `api-gateway`).
- **Database:** PostgreSQL with Prisma, in `club_schema`.

**Why these choices**
- **The author comes from another service.** An announcement stores the id of the author as a club member. The name and the avatar belong to the user, so they live in the auth service. The club service asks the auth service for them and merges the result into each announcement of the page. No table is shared between services.
- **The author stays available.** A member who leaves a club keeps their row (`left_at` is set), so the announcements they wrote still have an author.
- **The feed is fast.** An index on the club and the creation date (newest first) serves the paginated feed.
- **The permission is checked in the backend** on every request, not only by hiding buttons.
- The notification service has a `CLUB_ANNOUNCEMENT` type for announcements.

## API

| Method | Path | Access | Body / query | Response |
|---|---|---|---|---|
| GET | `/api/v1/clubs/:slug/announcements` | Member | `?page&limit` | `Paginated<AnnouncementWithAuthor>` (newest first) |
| POST | `/api/v1/clubs/:slug/announcements` | Leader, coach | `{ description }` | `Announcement` |
| DELETE | `/api/v1/clubs/:slug/announcements/:announcementId` | Leader, coach | | 204 |

All the details are in [API.md](API.md).

## Database

Table `announcements` (see [DATABASE.md](DATABASE.md)):

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `club_id` | integer, FK to `clubs` | on delete: cascade |
| `announcer_id` | integer, FK to `members` | the author |
| `description` | text | the message |
| `created_at` | timestamptz | date of publication |

Index: (`club_id`, `created_at` descending).

## Why this is a Minor module

It is a small feature with a limited scope: one table, three endpoints and one feed, with role checks, validation and author data merged from another service.