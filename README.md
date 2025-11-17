This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# SLU Alumni Connect – Mentorship & Engagement Platform

> A Next.js 16 prototype web application that connects students, alumni, and administrators through a unified portal for directory search, events, mentorship, donations, notifications, and messaging.

This project is a realistic prototype of an alumni engagement portal for SLU. It is fully functional with demo data and designed so it can evolve into a production system backed by a real database and authentication.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data & Demo Authentication](#data--demo-authentication)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Main App Routes](#main-app-routes)
- [API Routes](#api-routes)
- [Data Integration Design](#data-integration-design)
- [Deployment to Vercel](#deployment-to-vercel)
- [Manual Testing Guide](#manual-testing-guide)
- [Future Enhancements](#future-enhancements)

## Overview

**SLU Alumni Connect** centralizes the main engagement flows between students, alumni, and admins:

- Browse and search a rich **alumni directory**.
- Discover **events** and record **RSVPs**.
- Manage a structured **mentorship program** with student requests and mentor applications.
- Showcase **donation campaigns** and simulate contributions.
- Provide lightweight **notifications & messaging** to keep everyone informed.
- Offer **role-based interfaces** for students/alumni versus administrators.

The prototype uses realistic data converted from CSV to JSON, and implements full end-to-end flows using Next.js API routes and client-side state.

## Live Demo

The latest deployed version of this application is available at:

👉 **https://slu-alumni-connect.vercel.app/**

Use this link to explore the full prototype (login, directory, events, mentorship, donations, notifications, and messaging) without running the project locally.

## Core Features

- **Landing / Dashboard**
  - Clear navigation to Directory, Events, Mentorship, Donate, Notifications, Messages, and Profile.
  - Summary cards for active alumni, events, and mentorship connections (demo stats).

- **Role-Based Interfaces**
  - **Student/Alumni**: directory search, events & RSVPs, mentorship requests, become a mentor, basic profile.
  - **Admin**: additional dashboards, mentor approval, mentorship program management, analytics, and settings.

- **Alumni Directory**
  - Search and filter alumni by name, program, department, employer, location, etc.
  - Profile cards show graduation year, employer, job title, verification status.

- **Events & RSVPs**
  - List of upcoming events with title, date, location, and description.
  - RSVP flow using `/api/events/[id]/rsvp` to record attendance in session/in-memory data.

- **Mentorship Hub**
  - **Find Mentors**: cards showing mentors, their expertise, availability, and rating.
  - **My Mentorships**: list of a users mentorship requests and their statuses.
  - **Request Mentorship** dialog that posts to `/api/mentorship` and updates local state.
  - **Become a Mentor** form for alumni to submit an application.
  - **Admin tabs** for Manage Program, Mentor Approval, Analytics, and Settings.
  - **Rating flow** so mentees can rate mentors on completed mentorships.

- **Donations**
  - Donation campaigns with title, description, and goal/raised information.
  - Demo donation form to simulate contributions (no real payments).

- **Notifications & Messaging**
  - Notification bell with unread count.
  - Notifications page listing new mentor applications, mentorship requests, upcoming events, etc.
  - Messages list and conversation view for demo mentor/mentee communication.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** React components with Tailwind-style utility classes and custom UI primitives (`Button`, `Card`, `Tabs`, `Dialog`, etc.).
- **Backend (demo):** Next.js API routes in `src/app/api/*`.
- **Data:** JSON fixtures under `src/data` converted from CSV.
- **Auth & State:** Custom auth store using Zustand-style patterns (`src/stores/auth-store.ts`, `src/hooks/use-auth-store.ts`).
- **Database Layer (future):** Prisma schema + SQLite dev DB (`prisma/schema.prisma`, `prisma/dev.db`).

## Architecture Overview

The project is structured around three main layers:

1. **UI Layer (Pages & Components)**
   - Next.js App Router pages in `src/app/*` implement screens like directory, events, mentorship, donations, notifications, messages, profile, and admin.
   - Shared layout components (`MainLayout`, `Navbar`) provide consistent navigation and branding.

2. **API Layer (Next.js API Routes)**
   - `src/app/api/*` contains REST-style endpoints for auth, directory, events, RSVPs, mentorship, donations, messages, notifications, and admin stats.
   - These routes read JSON data via the Data Service layer and use in-memory/session arrays for demo writes (e.g., RSVPs, mentorship requests).

3. **Data Layer (Data Service + JSON fixtures)**
   - `src/lib/data-service.ts` imports JSON fixtures and exposes typed methods like `AlumniDataService.getAll()`.
   - `src/data/*.json` holds the actual data (alumni, events, donations, mentorship, RSVPs, engagement).
   - Because UI and APIs only talk to the Data Service, switching to a real database later requires minimal changes.

## Data & Demo Authentication

### JSON Data Sources (`src/data`)

- `slu_alumni_data.json`  alumni profiles (converted from `slu_alumni_data.csv`).
- `slu_events_data.json`  event listings.
- `slu_donations_data.json`  donation campaigns and sample transaction data.
- `slu_mentorship_data.json`  mentorship relationships/history for analytics.
- `slu_rsvp_data.json`  RSVP records.
- `slu_engagement_data.json`  aggregate engagement metrics.

### Data Service (`src/lib/data-service.ts`)

Examples of exposed methods:

- `AlumniDataService.getAll()`  returns normalized alumni records.
- `EventsDataService.getAll()`  returns events.
- `DonationsDataService.getAll()`  returns donation campaigns.
- `MentorshipDataService.getAll()`  mentorship analytics.
- `RSVPDataService.getAll()`  RSVP records.
- `EngagementDataService.getAll()` / `StatsDataService.getDashboardStats()`  derived dashboard metrics.

### Demo Auth & Roles

- Server-side helpers: `src/lib/auth-utils.ts`.
- Client-side state: `src/stores/auth-store.ts`, `src/hooks/use-auth-store.ts`.
- `getCurrentUser(request)` reads `x-user-email` and resolves a user from alumni JSON or a default profile.
- Roles:
  - `ADMIN`  full access to admin tabs and settings.
  - `ALUMNI`  student/alumni experience.

**Demo credentials (example):**

- Admin: `admin@slu.edu` / `admin123` (or configured in the login route).
- Alumni: any email present in `slu_alumni_data.json` with the demo password used in `/api/auth/login` (e.g. `password123`).

> Note: This is intentionally simplified for prototype/demo use and should be replaced with real authentication in production.

## Getting Started

### Prerequisites

- Node.js (LTS recommended, e.g. 18+).
- npm (bundled with Node) or pnpm/yarn.

### Install Dependencies

```bash
npm install
```

### Environment Variables

- See `env.example` for optional environment variables (DB URL, email provider keys, etc.).
- For the JSON-based prototype, the app will run with sensible defaults even if most env vars are not set.

### Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

High-level layout (simplified):

```text
src/
  app/
    layout.tsx          # Root layout (HTML skeleton, global styles)
    page.tsx            # Landing / dashboard
    login/page.tsx      # Login form
    signup/page.tsx     # Registration form (prototype)
    directory/page.tsx  # Alumni directory
    events/page.tsx     # Events listing & admin view
    mentorship/page.tsx # Mentorship hub (student + admin tabs)
    donate/page.tsx     # Donation campaigns
    notifications/page.tsx
    messages/page.tsx
    messages/[id]/page.tsx
    profile/page.tsx
    admin/page.tsx      # Admin dashboard

    api/
      auth/login/route.ts
      auth/register/route.ts
      directory/route.ts
      directory/[id]/route.ts
      events/route.ts
      events/[id]/route.ts
      events/[id]/rsvp/route.ts
      donations/route.ts
      donations/campaigns/route.ts
      mentorship/route.ts
      messages/route.ts
      messages/[id]/route.ts
      notifications/route.ts
      notifications/newsletter/route.ts
      notifications/send/route.ts
      admin/stats/route.ts
      admin/users/route.ts

  components/
    layout/main-layout.tsx
    navigation/navbar.tsx
    auth/protected-route.tsx
    notifications/notification-bell.tsx
    messaging/*
    ui/*                 # Button, Card, Dialog, Tabs, etc.

  data/
    slu_alumni_data.json
    slu_events_data.json
    slu_donations_data.json
    slu_mentorship_data.json
    slu_rsvp_data.json
    slu_engagement_data.json

  lib/
    data-service.ts
    auth-utils.ts
    config.ts
    db.ts
    email-service.ts
    messages-store.ts
    registered-users.ts
    utils.ts

  stores/
    auth-store.ts

  hooks/
    use-auth-store.ts

prisma/
  schema.prisma
  dev.db
  seed.ts
```

## Main App Routes

- `/`  Landing / dashboard page.
- `/login`  Login for admin and alumni.
- `/signup`  Prototype registration page.
- `/directory`  Alumni directory search and cards.
- `/events`  Events listing and management.
- `/mentorship`  Mentorship hub (student tabs + admin tabs).
- `/donate`  Donation campaigns.
- `/notifications`  Notifications list.
- `/messages`  Messages overview.
- `/messages/[id]`  Single conversation view.
- `/profile`  User profile & completeness.
- `/admin`  Admin dashboard with stats.

## API Routes

All API routes live under `src/app/api` and use the Next.js 16 handler signature.

Key endpoints:

- `POST /api/auth/login`  Demo login, returns user object with role.
- `POST /api/auth/register`  Prototype registration using Prisma (for future use).

- `GET /api/directory`  Returns alumni list.
- `GET/PUT/DELETE /api/directory/[id]`  Single alumni profile operations (in-memory for demo).

- `GET /api/events`  Events list.
- `GET/PUT/DELETE /api/events/[id]`  Event details and management.
- `POST /api/events/[id]/rsvp`  Record a new RSVP.
- `GET /api/events/[id]/rsvp`  List attendees for an event.

- `GET/POST /api/mentorship`  Mentorship analytics & create mentorship requests.

- `GET/POST /api/donations`  Donation data and new donation posts (demo).
- `GET /api/donations/campaigns`  Donation campaign definitions.

- `GET /api/messages`  List message threads.
- `GET /api/messages/[id]`  Get messages for a thread.

- `GET /api/notifications`  Demo notifications.
- `POST /api/notifications/send`  Prototype send endpoint.
- `POST /api/notifications/newsletter`  Demo newsletter subscription.

- `GET /api/admin/stats`  Dashboard statistics derived from JSON and sample data.
- `GET /api/admin/users`  Admin view of users (prototype).

> Most write operations in the prototype use in-memory arrays or demo logic. They illustrate intended behavior without requiring persistent infrastructure.

## Data Integration Design

The application uses a **Data Service + JSON fixtures** pattern:

- UI components and API routes **never** access files or CSVs directly.
- All reads go through `src/lib/data-service.ts`, which:
  - imports the relevant JSON file,
  - normalizes data into TypeScript objects,
  - exposes convenient getters.
- Writes (RSVPs, mentorship requests, messages) are stored in in-memory/session arrays for the lifetime of the server process.

### Path to a Real Database

- A full Prisma schema already exists under `prisma/schema.prisma`.
- To move from JSON to a real DB:
  1. Configure a database URL (e.g., Postgres) in `.env`.
  2. Run Prisma migrations and seeds.
  3. Update methods in `data-service.ts` and API routes to use Prisma instead of JSON.
  4. The React components and pages can remain largely unchanged.

## Deployment to Vercel

1. **Push code to GitHub** (already configured for this project).
2. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **"New Project" > "Import Git Repository"** and select this repo.
4. Verify the following settings:
   - Framework: **Next.js**
   - Build command: `npm run build`
   - Output directory: `.next`
5. Add any required environment variables (optional for the JSON-only demo).
6. Click **Deploy**. Vercel will build and host the app at a `*.vercel.app` URL.

## Manual Testing Guide

Suggested flows to test the prototype:

1. **Login**
   - Test admin login.
   - Test alumni login using an email from `slu_alumni_data.json` and the demo password.

2. **Directory**
   - Search for several alumni by name, department, and employer.
   - Open multiple cards to verify data mapping.

3. **Events & RSVPs**
   - View events list.
   - RSVP to an event; confirm UI reflects the change.

4. **Mentorship Hub (Student/Alumni)**
   - Browse mentors and filter by area.
   - Request mentorship and verify the new card under **My Mentorships**.
   - Mark a mentorship as completed (admin) and set a rating as the mentee.

5. **Mentorship Hub (Admin)**
   - Log in as admin and check the Mentorship tabs.
   - Update request statuses and adjust program settings.

6. **Donations**
   - View campaigns and submit a demo donation.

7. **Notifications & Messages**
   - Open the notifications page from the bell.
   - View message threads and send a demo message.

## Future Enhancements

- Replace demo authentication with a real identity provider (email/password, SSO, or OAuth).
- Swap JSON fixtures for a hosted relational database using Prisma.
- Implement real email/SMS notifications and calendar integration for mentorship scheduling.
- Add richer analytics dashboards for alumni engagement and fundraising.
- Extend the messaging system with real-time updates (WebSockets or similar).

---

If you have questions or suggestions, feel free to open an issue or PR in this repository.
