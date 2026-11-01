# UM6P Rackets: Club Documents

## Description

The **Club Documents** module lets the leaders and coaches of a club share links to important resources (rules, schedules, forms) with the members of that club.

**Goal:** give each club one place for its documents, with the right access for each role: leaders and coaches publish, members read.

**Key features**
- **Add a document:** only a leader or a coach can add one. A document has a title, an optional description and a link.
- **Validated links:** the link must be a full address with a protocol. It is checked in the form and again on the backend, so a broken link cannot be saved.
- **Read:** the members of the club see the list of documents (title and description) and open the link.
- **Delete:** a leader or a coach can delete an outdated document. A club can never delete the document of another club.
- **Pagination:** the list is paginated, newest first.

## Instructions

This module is part of the main platform. Start the whole project as described in the [README](../README.md), then open **https://localhost** and accept the self-signed certificate.

1. Log in as a **leader or coach** of a club, open the club page, and go to its documents section.
2. Add a document with a title, an optional description and a link that starts with `https://`. A link without a protocol is rejected.
3. Log in as a **member** of the same club: the document appears, and the member can open it but has no add or delete action.
4. As a leader or coach, delete the document.

## Resources

- [Next.js](https://nextjs.org/docs) and [shadcn/ui](https://ui.shadcn.com/): the page and the interface components (dialog, card, button).
- [Zod](https://zod.dev/) and [React Hook Form](https://react-hook-form.com/): validation of the form.
- [NestJS](https://docs.nestjs.com) and [Prisma](https://www.prisma.io/docs): the endpoints and the database access.

## Team Information

- **hwahmane** (frontend): the page, the form, its validation and the role-based display.
- **znajdaou** (backend): the endpoints in the club service, the role checks, the backend validation and the table.

## Project Management

- The feature was split into a frontend part (page, form, validation) and a backend part (endpoints, database).
- The endpoints were written in the API contract first, so both sides worked from the same document (see [API.md](API.md)).
- Tasks and the contract were managed in Notion, the code is in the single Git repository, and Discord was used for the daily communication.

## Technical Stack

- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui, Zod and React Hook Form.
- **Backend:** NestJS (the `club-service` behind the `api-gateway`).
- **Database:** PostgreSQL with Prisma, in `club_schema`.

**Why these choices**
- The link is validated twice. Zod gives the user an immediate message in the form, and the backend checks it again, because the frontend alone can never be trusted.
- The document belongs to a club through a foreign key with cascade delete, so documents never outlive their club.
- The permission is checked in the backend on every request, not only by hiding buttons.

## API

| Method | Path | Access | Body / query | Response |
|---|---|---|---|---|
| GET | `/api/v1/clubs/:slug/documents` | Member | `?page&limit` | `Paginated<ClubDocument>` (newest first) |
| POST | `/api/v1/clubs/:slug/documents` | Leader, coach | `{ title, description?, path }` | `ClubDocument` |
| DELETE | `/api/v1/clubs/:slug/documents/:documentId` | Leader, coach | | 204 |

Rules: `path` must be a full link with a protocol. `title` is trimmed and cannot be blank. All the details are in [API.md](API.md).

## Database

Table `club_documents` (see [DATABASE.md](DATABASE.md)):

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `club_id` | integer, FK to `clubs` | on delete: cascade |
| `title` | varchar(255) | trimmed, not blank |
| `description` | text, optional | a short explanation of the document |
| `path` | text | the validated link |

## Why this is a Minor module

It is a small feature with a limited scope: one table, three endpoints and one page, with role checks and input validation.