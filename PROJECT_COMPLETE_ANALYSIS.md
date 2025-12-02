# 🎓 SLU Alumni Connect - Complete Project Analysis

**Madhukaku, Please call Madhu to explain this document in detail (Maku inka okasari madhu tho call petinchandi)**

---

## 📋 Table of Contents

1. [Complete Application Overview](#1-complete-application-overview)
2. [Frontend-Backend Architecture & File Connections](#2-frontend-backend-architecture--file-connections)
3. [Database Connection & Authentication System](#3-database-connection--authentication-system)
4. [Main Problem & Proposed Solution](#4-main-problem--proposed-solution)
5. [Technology Tools & Frameworks Explanation](#5-technology-tools--frameworks-explanation)
6. [Deployment Process](#6-deployment-process)
7. [Data Flow & Component Communication](#7-data-flow--component-communication)
8. [Security, Policies & Permissions](#8-security-policies--permissions)
9. [Complete File-by-File Breakdown](#9-complete-file-by-file-breakdown)

---

## 1. Complete Application Overview

### What is this Application?

**SLU Alumni Connect** is a comprehensive web application built to strengthen the Saint Louis University (SLU) alumni network. It's a centralized platform that combines networking, professional development, event management, and fundraising - similar to LinkedIn but specifically designed for SLU's alumni community.

### Main Purpose

- **Problem**: Universities struggle to maintain meaningful connections with alumni after graduation. Alumni networks are fragmented, mentorship is informal, and engagement tracking is minimal.
- **Solution**: A unified digital platform that facilitates alumni networking, provides structured mentorship programs, manages event RSVPs, tracks donations, and offers real-time analytics on community engagement.

### Key Features

#### 1. **Alumni Directory** (Professional Networking)
- Comprehensive searchable database of all SLU graduates
- Filter by graduation year, department, employer, location
- Profile completeness tracking (encourages alumni to update information)
- Verification status badges (Verified/Unverified/Pending)

#### 2. **Events Management System**
- Create and manage alumni events (reunions, networking mixers, career fairs)
- RSVP system with guest count tracking
- Event types: Alumni Reunion, Networking Mixer, Career Fair, Fundraising Gala, Webinar
- Check-in status tracking for attendance verification
- Department-specific event filtering

#### 3. **Mentorship Hub** (Career Development)
- Find mentors by expertise area (Career Development, Technical Skills, Leadership, Entrepreneurship)
- Request mentorship with personalized messages
- Become a mentor application system with admin approval workflow
- Track mentorship status: Requested → Active → Completed
- Rating system for completed mentorships
- Analytics on mentor performance and engagement

#### 4. **Donation Platform**
- Multiple donation campaigns (Scholarship Fund, General Fund, Endowment, Research)
- Real-time fundraising progress tracking
- Donor recognition and anonymity options
- Recurring donation support (Monthly, Quarterly, Annual)
- Tax-deductible receipt generation

#### 5. **Messaging System**
- Direct messaging between alumni
- Conversation threads with mentors
- Notification integration for new messages

#### 6. **Analytics Dashboard**
- Real-time statistics on alumni engagement
- Growth charts showing alumni community expansion
- Donation trends over time
- Event attendance patterns
- Mentorship program effectiveness metrics

### User Roles & Permissions

| Role | Access Level | Key Capabilities |
|------|-------------|------------------|
| **ALUMNI (Regular User)** | Standard Access | Browse directory, RSVP to events, request mentorship, donate, message other alumni, update own profile |
| **ADMIN** | Full Access | All alumni capabilities PLUS: Create/delete events, approve mentor applications, manage mentorship requests, view all analytics, add/remove users, access admin dashboard |

### Real-World Use Cases

1. **Recent Graduate**: Uses directory to find alumni in their field, requests mentorship from experienced professionals
2. **Mid-Career Professional**: Becomes an approved mentor, helps 3-4 mentees, attends networking events
3. **University Administrator**: Tracks engagement metrics, manages annual giving campaigns, organizes reunion events
4. **Corporate Recruiter**: Finds SLU alumni in specific departments for job opportunities

---

## 2. Frontend-Backend Architecture & File Connections

### Technology Stack

```
Frontend Framework: Next.js 16 (React 19 + TypeScript)
Backend: Next.js API Routes (Serverless Functions)
Database: PostgreSQL (Neon Cloud) - CONFIGURED BUT NOT FULLY USED
Current Data Storage: JSON Files in src/data/
ORM: Prisma (Set up but not integrated)
Authentication: Custom JWT + Zustand
State Management: Zustand with localStorage persistence
Styling: Tailwind CSS v4 + Custom CSS
UI Components: Radix UI + Custom components
Charts: Recharts (React charting library)
Email: Custom email service (demo mode)
Deployment: Vercel (Serverless platform)
```

### Project Structure (Complete File Organization)

```
slu-alumni-connect/
├── src/
│   ├── app/                          # Next.js 16 App Router (Pages & APIs)
│   │   ├── layout.tsx               # Root layout wrapper
│   │   ├── page.tsx                 # Landing page with hero section
│   │   ├── globals.css              # Global Tailwind styles
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx             # Login form with auth
│   │   ├── signup/
│   │   │   └── page.tsx             # Registration form
│   │   │
│   │   ├── directory/
│   │   │   └── page.tsx             # Alumni directory search
│   │   ├── events/
│   │   │   └── page.tsx             # Events listing & RSVP
│   │   ├── mentorship/
│   │   │   └── page.tsx             # Mentorship hub (4682 lines!)
│   │   ├── donate/
│   │   │   └── page.tsx             # Donation campaigns
│   │   ├── messages/
│   │   │   ├── page.tsx             # Messages list
│   │   │   └── [id]/page.tsx        # Individual conversation
│   │   ├── profile/
│   │   │   └── page.tsx             # User profile management
│   │   ├── notifications/
│   │   │   └── page.tsx             # Notifications center
│   │   └── admin/
│   │       └── page.tsx             # Admin dashboard
│   │
│   │   └── api/                     # Backend API Routes
│   │       ├── auth/
│   │       │   ├── login/route.ts   # POST /api/auth/login
│   │       │   └── register/route.ts # POST /api/auth/register
│   │       ├── directory/
│   │       │   ├── route.ts         # GET/POST /api/directory
│   │       │   └── [id]/route.ts    # GET/PUT/DELETE /api/directory/:id
│   │       ├── events/
│   │       │   ├── route.ts         # GET/POST /api/events
│   │       │   └── [id]/
│   │       │       ├── route.ts     # GET/PUT/DELETE /api/events/:id
│   │       │       └── rsvp/route.ts # POST /api/events/:id/rsvp
│   │       ├── donations/
│   │       │   ├── route.ts         # GET/POST /api/donations
│   │       │   └── campaigns/route.ts # GET /api/donations/campaigns
│   │       ├── mentorship/
│   │       │   ├── route.ts         # GET/POST/PUT /api/mentorship
│   │       │   ├── apply/route.ts   # POST (become mentor)
│   │       │   ├── approve/route.ts # POST (admin approves)
│   │       │   ├── requests/route.ts # GET/POST (requests)
│   │       │   ├── analytics/route.ts # GET (stats)
│   │       │   └── mentors/route.ts # GET/POST (mentor list)
│   │       ├── messages/
│   │       │   ├── route.ts         # GET/POST /api/messages
│   │       │   └── [id]/route.ts    # GET /api/messages/:id
│   │       ├── notifications/
│   │       │   ├── route.ts         # GET /api/notifications
│   │       │   ├── send/route.ts    # POST (send notification)
│   │       │   └── newsletter/route.ts # POST (subscribe)
│   │       ├── stats/
│   │       │   └── route.ts         # GET /api/stats (dashboard)
│   │       ├── profile/
│   │       │   └── route.ts         # GET/PUT /api/profile
│   │       └── admin/
│   │           ├── stats/route.ts   # GET (admin analytics)
│   │           └── users/route.ts   # GET (user management)
│   │
│   ├── components/                  # Reusable UI Components
│   │   ├── slu-logo.tsx            # University logo component
│   │   ├── layout/
│   │   │   └── main-layout.tsx     # Page wrapper with navbar
│   │   ├── navigation/
│   │   │   └── navbar.tsx          # Top navigation bar
│   │   ├── auth/
│   │   │   └── protected-route.tsx # Route protection HOC
│   │   ├── notifications/
│   │   │   └── notification-bell.tsx # Bell icon with count
│   │   ├── messaging/
│   │   │   └── ...                 # Chat components
│   │   └── ui/                     # Base UI components
│   │       ├── button.tsx          # Button variants
│   │       ├── card.tsx            # Card containers
│   │       ├── input.tsx           # Form inputs
│   │       ├── badge.tsx           # Status badges
│   │       ├── dialog.tsx          # Modal dialogs
│   │       ├── tabs.tsx            # Tab navigation
│   │       ├── avatar.tsx          # User avatars
│   │       └── sheet.tsx           # Mobile drawer
│   │
│   ├── data/                        # JSON Data Storage (Current System)
│   │   ├── slu_alumni_data.json    # 77,156 lines! Alumni profiles
│   │   ├── slu_events_data.json    # Event listings
│   │   ├── slu_donations_data.json # Donation records
│   │   ├── slu_mentorship_data.json # Mentorship relationships
│   │   ├── slu_rsvp_data.json      # Event RSVPs
│   │   ├── slu_engagement_data.json # Engagement metrics
│   │   ├── registered_users.json   # New signups
│   │   ├── approved_mentors.json   # Approved mentor list
│   │   ├── mentor_applications.json # Pending applications
│   │   ├── mentorship_requests.json # Mentorship requests
│   │   ├── session_events.json     # Admin-created events
│   │   ├── deleted_events.json     # Soft-deleted event IDs
│   │   ├── campaigns.json          # Donation campaigns
│   │   ├── messages.json           # Chat messages
│   │   ├── notifications.json      # User notifications
│   │   └── connections.json        # Alumni connections
│   │
│   ├── lib/                         # Utility Libraries & Services
│   │   ├── data-service.ts         # Main data handler (760+ lines)
│   │   ├── auth-utils.ts           # Server-side auth helpers
│   │   ├── registered-users.ts     # New user management
│   │   ├── admin-data-store.ts     # Admin-specific data
│   │   ├── messages-store.ts       # Message handling
│   │   ├── notification-service.ts # Notification logic
│   │   ├── email-service.ts        # Email integration (demo)
│   │   ├── connection-service.ts   # Alumni connections
│   │   ├── csv-parser.ts           # CSV import utility
│   │   ├── db.ts                   # Prisma client
│   │   ├── config.ts               # App configuration
│   │   └── utils.ts                # Helper functions
│   │
│   ├── stores/                      # Client-side State Management
│   │   └── auth-store.ts           # Zustand auth state
│   │
│   └── hooks/                       # Custom React Hooks
│       └── use-auth-store.ts       # Auth store with hydration
│
├── prisma/                          # Database Schema (Not Fully Used)
│   ├── schema.prisma               # PostgreSQL schema definition
│   ├── seed.ts                     # Database seeding script
│   └── migrations/                 # Database migrations
│       └── 20251116070045_init_neon/
│           └── migration.sql
│
├── public/                          # Static Assets
│   └── ...                         # Images, icons, etc.
│
├── .env                            # Environment variables (DATABASE_URL)
├── package.json                    # Dependencies & scripts
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── components.json                 # Shadcn UI configuration
```

### What is Next.js? (Complete Framework Explanation)

**Simple Restaurant Analogy:**
- **Traditional Website**: Customer orders (frontend) → Waiter takes order → Kitchen cooks (backend) → Food delivered
- **Next.js**: Customer orders → Kitchen is INSIDE the restaurant → Instant service

**Next.js = Complete Full-Stack Framework (Frontend + Backend Together)**

#### Frontend Capabilities
- **React Components**: Building blocks for user interfaces
- **Server-Side Rendering (SSR)**: Pages load faster, better SEO
- **Client-Side Navigation**: Instant page transitions without full reloads
- **Automatic Code Splitting**: Only loads JavaScript needed for each page
- **Image Optimization**: Automatic image resizing and lazy loading

#### Backend Capabilities
- **API Routes**: Serverless functions (no need for separate Express server)
- **Server Components**: React components that run on the server
- **Middleware**: Request interceptors for authentication checks
- **Edge Functions**: Deploy code closer to users globally
- **Built-in Routing**: File-based routing system

### Complete Tool Stack Breakdown

| Category | Tool | Version | What It Does | Why We Use It |
|----------|------|---------|--------------|---------------|
| **Core Framework** | Next.js | 16.0.2 | Full-stack React framework | Combines frontend + backend, automatic optimizations |
| **UI Library** | React | 19.2.0 | Component-based UI | Industry standard, huge ecosystem |
| **Language** | TypeScript | 5.x | Typed JavaScript | Catches errors before runtime, better IDE support |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS | Rapid UI development, consistent design |
| **State Management** | Zustand | 5.0.8 | Client-side state | Lightweight, persists login state |
| **Database ORM** | Prisma | 6.19.0 | Database toolkit | Type-safe database queries (NOT FULLY USED) |
| **UI Components** | Radix UI | Various | Headless components | Accessible, customizable components |
| **Charts** | Recharts | 3.4.1 | React charts | Beautiful, responsive data visualizations |
| **Form Validation** | Zod | 4.1.12 | Schema validation | Type-safe form validation |
| **Date Handling** | date-fns | 4.1.0 | Date utilities | Format and manipulate dates |
| **Icons** | Lucide React | 0.553.0 | Icon library | Consistent icon set |
| **Password Hashing** | bcryptjs | 3.0.3 | Secure hashing | Password security (demo only) |

### How Files Connect (Complete Data Flow Architecture)

#### 1. **Authentication Flow** (Login Process - Step by Step)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE LOGIN FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: User opens browser
        ↓
        Visits: http://localhost:3000/
        File: src/app/page.tsx (Landing page)

STEP 2: User clicks "Sign In" button
        ↓
        Navigates to: /login
        File: src/app/login/page.tsx
        
STEP 3: Login form renders
        ↓
        Component useState: [email, setEmail], [password, setPassword]
        File: src/app/login/page.tsx (lines 10-15)

STEP 4: User types credentials and submits
        ↓
        onClick handler: handleSubmit(e)
        Code: e.preventDefault()
        
STEP 5: Frontend makes API call
        ↓
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
        File: src/app/login/page.tsx (lines 18-22)

STEP 6: Request reaches backend API
        ↓
        Route: /api/auth/login
        File: src/app/api/auth/login/route.ts
        Handler: async function POST(request: NextRequest)

STEP 7: Backend validates credentials
        ↓
        THREE checks in order:
        
        CHECK 1: Is it admin?
        if (email === 'admin@slu.edu' && password === 'admin123')
        → Return admin user object
        File: src/app/api/auth/login/route.ts (lines 16-30)
        
        CHECK 2: Is it newly registered user?
        registeredUsers.get(emailLower)
        → Reads src/data/registered_users.json
        File: src/lib/registered-users.ts (lines 30-45)
        
        CHECK 3: Is it CSV alumni?
        AlumniDataService.getAll()
        → Reads src/data/slu_alumni_data.json (77,000 lines!)
        Password must be 'password123'
        File: src/lib/data-service.ts (lines 50-100)

STEP 8: Backend updates last login timestamp
        ↓
        AlumniDataService.update(id, {
          lastActive: today,
          lastLoginDate: today
        })
        Writes back to JSON file
        File: src/lib/data-service.ts (lines 150-170)

STEP 9: Backend returns response
        ↓
        NextResponse.json({
          message: "Login successful",
          user: { id, email, role, profile }
        })

STEP 10: Frontend receives response
         ↓
         const data = await response.json()
         if (response.ok) {
           login(data.user)  // Zustand store action
         }

STEP 11: User data stored in browser
         ↓
         File: src/stores/auth-store.ts
         Zustand store: set({ user, isAuthenticated: true })
         Persisted to: localStorage['auth-storage']

STEP 12: Page redirects to home
         ↓
         router.push("/")
         File: src/app/page.tsx shows dashboard
         Navbar shows: "Welcome, [FirstName]!"
```

#### 2. **Directory Search Flow** (Alumni Lookup)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DIRECTORY SEARCH FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: User navigates to /directory
        File: src/app/directory/page.tsx

STEP 2: Page loads with search form
        useState hooks initialize:
        - [searchTerm, setSearchTerm]
        - [selectedDepartment, setSelectedDepartment]
        - [selectedYear, setSelectedYear]
        - [alumni, setAlumni]
        - [loading, setLoading]

STEP 3: useEffect triggers on mount
        useEffect(() => {
          fetchAlumni()
        }, [])

STEP 4: API call to fetch all alumni
        const response = await fetch('/api/directory')
        Headers include: { 'x-user-email': user.email }

STEP 5: Backend API route handles request
        File: src/app/api/directory/route.ts
        
        Validates authentication:
        const user = await getCurrentUser(request)
        File: src/lib/auth-utils.ts (reads x-user-email header)
        
        Extracts query parameters:
        const search = searchParams.get('search')
        const department = searchParams.get('department')
        const graduationYear = searchParams.get('graduationYear')
        const location = searchParams.get('location')

STEP 6: Data Service performs search
        File: src/lib/data-service.ts
        
        AlumniDataService.search({
          search,
          department,
          graduationYear,
          location
        })
        
        Algorithm:
        1. Start with all alumni (77,000+ records)
        2. Filter by search term (checks firstName, lastName, email, employer, jobTitle)
        3. Filter by department if specified
        4. Filter by graduation year if specified
        5. Filter by location (city or state)
        6. Return filtered results

STEP 7: Results returned to frontend
        NextResponse.json({ alumni: filteredAlumni })

STEP 8: Frontend updates state
        setAlumni(data.alumni)
        setLoading(false)

STEP 9: React re-renders cards
        alumni.map(alumnus => (
          <AlumniCard key={alumnus.id} {...alumnus} />
        ))

STEP 10: User sees results grid
         Display shows:
         - Profile photo (or initials)
         - Full name
         - Graduation year
         - Current employer & job title
         - Department & program
         - Location
         - Verification status badge
```

#### 3. **Event RSVP Flow** (Complete Process)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT RSVP FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: User browses events
        File: src/app/events/page.tsx
        
        useEffect calls: fetch('/api/events')
        
STEP 2: Backend loads events
        File: src/app/api/events/route.ts
        
        THREE data sources merged:
        1. CSV events: EventsDataService.getAll()
           → src/data/slu_events_data.json
        2. Admin-created events: loadPersistedEvents()
           → src/data/session_events.json
        3. Deleted events filter: loadDeletedEventIds()
           → src/data/deleted_events.json
        
        Dynamic registered count:
        For each event:
          - Base registered count from JSON
          - + RSVPs from session_rsvps.json
          - + Guest counts

STEP 3: Events displayed with filters
        - Upcoming events (date >= today)
        - Past events (date < today)
        - Sorted by date

STEP 4: User clicks "RSVP" button
        Opens dialog: <RSVPDialog event={event} />
        
        Form fields:
        - Guest count (number input)
        - Special requirements (textarea)

STEP 5: User submits RSVP form
        onClick: handleRSVP()
        
        Validation:
        - Check if already RSVPed
        - Validate guest count <= available capacity
        - Check login status

STEP 6: API call to record RSVP
        fetch(`/api/events/${eventId}/rsvp`, {
          method: 'POST',
          body: JSON.stringify({
            guestCount,
            specialRequirements,
            status: 'Confirmed'
          })
        })

STEP 7: Backend RSVP route processes
        File: src/app/api/events/[id]/rsvp/route.ts
        
        Creates RSVP record:
        {
          id: `RSVP-${Date.now()}`,
          alumniId: user.id,
          eventId: eventId,
          status: 'Confirmed',
          guestCount: parseInt(guestCount),
          specialRequirements,
          checkInStatus: 'NOT_YET',
          createdAt: new Date()
        }
        
        Saves to: src/data/session_rsvps.json
        
        Updates event registered count

STEP 8: Email notification sent (demo)
        emailService.sendEmail({
          to: user.email,
          subject: `RSVP Confirmed: ${event.title}`,
          body: HTML template with event details
        })
        File: src/lib/email-service.ts

STEP 9: Success response returned
        NextResponse.json({
          message: 'RSVP recorded successfully',
          rsvp: newRSVP
        })

STEP 10: Frontend updates UI
         - Close dialog
         - Show success toast
         - Update event card to show "Registered"
         - Refresh events list
```

---

## 3. Frontend Code (Pages & Components)

```
📁 src/app/
├── page.tsx              → Homepage (dashboard with stats, charts)
├── layout.tsx            → Main template (wraps all pages)
├── globals.css           → Global styles
├── login/
│   └── page.tsx          → Login form
├── signup/
│   └── page.tsx          → Registration form
├── directory/
│   └── page.tsx          → Alumni directory search
├── events/
│   └── page.tsx          → Events list and RSVP
├── mentorship/
│   └── page.tsx          → Mentorship hub (BIGGEST file - 4682 lines!)
├── donate/
│   └── page.tsx          → Donation campaigns
├── messages/
│   └── page.tsx          → Messages list
│   └── [id]/page.tsx     → Individual conversation
├── profile/
│   └── page.tsx          → User profile
├── notifications/
│   └── page.tsx          → Notifications list
└── admin/
    └── page.tsx          → Admin dashboard
```

### UI Components (Reusable Building Blocks)

```
📁 src/components/
├── layout/
│   └── main-layout.tsx   → Page wrapper with navbar
├── navigation/
│   └── navbar.tsx        → Top navigation bar
├── auth/
│   └── protected-route.tsx → Blocks pages if not logged in
├── ui/
│   ├── button.tsx        → Button component
│   ├── card.tsx          → Card boxes
│   ├── input.tsx         → Text input fields
│   ├── badge.tsx         → Status badges
│   ├── tabs.tsx          → Tab navigation
│   ├── dialog.tsx        → Popup dialogs
│   ├── avatar.tsx        → User profile pictures
│   └── sheet.tsx         → Mobile menu slider
├── notifications/
│   └── notification-bell.tsx → Bell icon with count
└── messaging/
    └── ...               → Chat components
```

---

## 4. Backend Code

### Backend = Server Logic (Hidden from User)

All backend code is in: `src/app/api/` folder

**Important:** Next.js API routes work like this:
- File at `src/app/api/auth/login/route.ts` → Creates URL `/api/auth/login`

### API Route Files (Server Endpoints)

```
📁 src/app/api/
├── auth/
│   ├── login/route.ts    → POST /api/auth/login (handles login)
│   └── register/route.ts → POST /api/auth/register (handles signup)
├── directory/
│   ├── route.ts          → GET/POST /api/directory (list/add alumni)
│   └── [id]/route.ts     → GET/PUT/DELETE /api/directory/:id
├── events/
│   ├── route.ts          → GET/POST /api/events (list/create events)
│   └── [id]/
│       ├── route.ts      → GET/PUT/DELETE /api/events/:id
│       └── rsvp/route.ts → POST /api/events/:id/rsvp
├── donations/
│   ├── route.ts          → GET/POST /api/donations
│   └── campaigns/route.ts → GET /api/donations/campaigns
├── mentorship/
│   ├── route.ts          → GET/POST/PUT /api/mentorship
│   ├── apply/route.ts    → POST (become a mentor)
│   ├── approve/route.ts  → POST (admin approves mentor)
│   ├── requests/route.ts → GET/POST (mentorship requests)
│   ├── analytics/route.ts → GET (mentorship stats)
│   └── mentors/route.ts  → GET/POST (list mentors)
├── messages/
│   ├── route.ts          → GET/POST /api/messages
│   └── [id]/route.ts     → GET /api/messages/:id
├── notifications/
│   ├── route.ts          → GET /api/notifications
│   ├── send/route.ts     → POST (send notification)
│   └── newsletter/route.ts → POST (subscribe)
├── stats/
│   └── route.ts          → GET /api/stats (dashboard stats)
├── admin/
│   ├── stats/route.ts    → GET (admin statistics)
│   └── users/route.ts    → GET (admin user list)
└── profile/
    └── route.ts          → GET/PUT /api/profile
```

---

## 5. How Frontend and Backend Connect

### The Connection Flow (Step by Step)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USER ACTION EXAMPLE: LOGIN                            │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: User types email/password on LOGIN PAGE
         📁 src/app/login/page.tsx
         ↓
Step 2: User clicks "Sign In" button
         Code runs: fetch("/api/auth/login", { method: "POST", body: {email, password} })
         ↓
Step 3: Request goes to BACKEND API
         📁 src/app/api/auth/login/route.ts
         ↓
Step 4: Backend checks:
         - Is it admin@slu.edu with admin123? → Return admin user
         - Is email in registered_users.json? → Check password, return user
         - Is email in slu_alumni_data.json? → Password must be 'password123'
         ↓
Step 5: Backend sends response back
         { message: "Login successful", user: { id, email, role, profile } }
         ↓
Step 6: Frontend receives response, stores user in ZUSTAND STORE
         📁 src/stores/auth-store.ts → login(user)
         ↓
Step 7: Page redirects to homepage, shows "Welcome, [Name]"
```

### Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   USER (Browser)                                                                │
│       │                                                                         │
│       ▼                                                                         │
│   ┌─────────────────┐                                                           │
│   │  FRONTEND PAGE  │  (React Components)                                       │
│   │  login/page.tsx │                                                           │
│   └────────┬────────┘                                                           │
│            │ fetch("/api/auth/login")                                           │
│            ▼                                                                    │
│   ┌─────────────────┐                                                           │
│   │  API ROUTE      │  (Next.js Server)                                         │
│   │  route.ts       │                                                           │
│   └────────┬────────┘                                                           │
│            │ Calls data-service.ts                                              │
│            ▼                                                                    │
│   ┌─────────────────┐                                                           │
│   │  DATA SERVICE   │  (Business Logic)                                         │
│   │  data-service.ts│                                                           │
│   └────────┬────────┘                                                           │
│            │ Reads/Writes                                                       │
│            ▼                                                                    │
│   ┌─────────────────┐                                                           │
│   │  JSON FILES     │  (Data Storage)                                           │
│   │  src/data/      │                                                           │
│   │  *.json         │                                                           │
│   └─────────────────┘                                                           │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow

### Where is Data Stored?

**Current System: JSON Files (NOT a real database!)**

```
📁 src/data/
├── slu_alumni_data.json        → 77,156 lines! All alumni profiles
├── slu_events_data.json        → All events
├── slu_donations_data.json     → Donation records
├── slu_mentorship_data.json    → Mentorship relationships
├── slu_rsvp_data.json          → Event RSVPs
├── slu_engagement_data.json    → Engagement metrics
├── registered_users.json       → NEW users who signed up
├── approved_mentors.json       → Approved mentor list
├── mentor_applications.json    → Pending mentor applications
├── mentorship_requests.json    → Mentorship requests
├── campaigns.json              → Donation campaigns
├── session_events.json         → Events created by admin
├── deleted_events.json         → IDs of deleted events
├── messages.json               → Chat messages
├── notifications.json          → User notifications
└── connections.json            → Alumni connections
```

### Data Service - The Middle Layer

📁 **`src/lib/data-service.ts`** - This is the MAIN data handling file (760+ lines)

```typescript
// WHAT IT DOES:
// 1. Loads JSON files on startup
// 2. Provides methods to get/create/update/delete data
// 3. Writes changes back to JSON files

// EXAMPLE:
class AlumniDataService {
  static getAll() { return alumniData; }              // Get all alumni
  static getById(id) { ... }                          // Get one alumni
  static create(alumni) { /* Add new + save file */ } // Create alumni
  static update(id, data) { /* Update + save file */} // Update alumni
  static delete(id) { /* Remove + save file */ }      // Delete alumni
  static search(filters) { ... }                      // Search with filters
}
```

---

## 7. Analytics and Charts - How Dynamic Data Works

### Is AI/ML Used? NO!

**The analytics are NOT using AI or Machine Learning.** They are simple calculations.

### How Charts Get Data

```typescript
// EXAMPLE: Homepage Stats Chart
// 📁 src/app/page.tsx

// 1. When page loads, it calls API
useEffect(() => {
  fetch('/api/stats')   // Calls the stats API
    .then(response => response.json())
    .then(data => setStats(data));
}, []);

// 2. Stats API (src/app/api/stats/route.ts) does:
//    - Count all alumni from JSON file
//    - Count unique countries
//    - Sum all donations
//    - Return { totalAlumni, totalCountries, totalRaised, growthData }

// 3. Frontend uses RECHARTS library to draw the chart
<ResponsiveContainer>
  <ComposedChart data={growthData}>
    <Line dataKey="donations" />
    <Area dataKey="alumni" />
  </ComposedChart>
</ResponsiveContainer>
```

### Analytics Calculations (Simple Math, Not AI)

```typescript
// From data-service.ts:

// Count verified alumni
verifiedAlumni = alumniData.filter(a => a.verificationStatus === 'Verified').length;

// Calculate average mentor rating
avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

// Get donations by purpose
donationsByPurpose = donations.forEach(d => {
  byPurpose[d.purpose] = (byPurpose[d.purpose] || 0) + d.amount;
});
```

---

## 8. Database Connection Explained

### Current Situation: TWO SYSTEMS! (This is the problem)

#### System 1: JSON Files (ACTUALLY USED)
```
📁 src/data/*.json
- All data is stored in JSON files
- Read/write happens through data-service.ts
- Data persists to files on the server
```

#### System 2: Prisma + Neon Database (PARTIALLY SET UP, NOT FULLY USED!)

```
📁 prisma/
├── schema.prisma    → Database structure definition
└── seed.ts          → Script to add initial data to database

📁 .env
DATABASE_URL="postgresql://neondb_owner:npg_ZsIijyxW60Yb@ep-plain-waterfall..."
                        ↑
                        This is a REAL cloud database URL (Neon)
```

**BUT:** The database is NOT being used for actual data storage!

### Why Two Systems?

The project was started with JSON files for quick prototyping. Later, a database was set up (Prisma + Neon PostgreSQL) but the code was **never fully migrated** to use it.

### What's in the Database?

The `seed.ts` file creates only 3 users:
```typescript
// admin@slu.edu / admin123
// john.doe@slu.edu / password123
// sarah.johnson@slu.edu / password123
```

**Everything else uses JSON files!**

---

## 9. The Main Problem - Why Data Doesn't Persist After Logout

### The Problem Statement

> "Creating and signing up works but updates don't save. After logout and login, changes are gone. Why?"

### Root Cause Analysis

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          THE PROBLEM EXPLAINED                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHEN YOU SIGN UP:                                                               │
│  ─────────────────                                                               │
│  1. Registration API saves to TWO places:                                        │
│     a) registered_users.json (password + user info) ✅                          │
│     b) slu_alumni_data.json (adds new alumni record) ✅                          │
│                                                                                  │
│  2. These files are MODIFIED on the server                                       │
│                                                                                  │
│  WHEN YOU LOGIN AFTER SIGNUP:                                                    │
│  ────────────────────────────                                                    │
│  1. Login API checks registered_users.json ✅                                    │
│  2. Finds your email and password ✅                                             │
│  3. Returns user data ✅                                                         │
│                                                                                  │
│  THE CATCH - SERVER RESTART PROBLEM:                                             │
│  ────────────────────────────────────                                            │
│  On Vercel (production), servers are "serverless"                                │
│  - Each request may run on a DIFFERENT server                                    │
│  - In-memory cache (global.__alumniDataCache) gets lost                          │
│  - BUT JSON files are in the code bundle, they CAN persist...                    │
│  - ACTUALLY, Vercel file system is READ-ONLY in production! ❌                   │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────┐                     │
│  │     THIS IS THE MAIN PROBLEM!                          │                     │
│  │                                                         │                     │
│  │  On VERCEL production deployment:                       │                     │
│  │  - fs.writeFileSync() APPEARS to work                   │                     │
│  │  - But the file changes are TEMPORARY                   │                     │
│  │  - Next request might hit a fresh server                │                     │
│  │  - All changes are LOST                                 │                     │
│  │                                                         │                     │
│  │  This is why DEVELOPMENT (localhost) works fine         │                     │
│  │  but PRODUCTION (vercel) loses data!                    │                     │
│  └────────────────────────────────────────────────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Specific Code Issues

**Issue 1: In-memory caching**
```typescript
// src/lib/data-service.ts

// This global cache only works per-server instance
declare global {
  var __alumniDataCache: any[] | undefined;
}

// On Vercel, each request might hit different server
// = different cache = inconsistent data
```

**Issue 2: Writing to read-only filesystem**
```typescript
// This works locally but NOT on Vercel production
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
// Error: EROFS: read-only file system
```

**Issue 3: Client-side storage (Zustand) doesn't sync with server**
```typescript
// src/stores/auth-store.ts
// User data is stored in browser localStorage
// But if JSON files on server are different, they won't match
```

---

## 10. Proposed Solution

### To Fix This Project Properly:

#### Solution 1: Use the Database Properly (RECOMMENDED)

```
STEP 1: Update all API routes to use Prisma instead of JSON files

// BEFORE (current):
const alumni = AlumniDataService.getAll();

// AFTER (proper):
const alumni = await prisma.user.findMany({
  include: { profile: true }
});
```

```
STEP 2: Migrate data from JSON to database

- Run: npx prisma db push
- Run: npx prisma db seed (update seed.ts with all CSV data)
```

```
STEP 3: Update registration to write to database

// src/app/api/auth/register/route.ts
const newUser = await prisma.user.create({
  data: {
    email,
    password: await bcrypt.hash(password, 12),
    role: 'ALUMNI',
    profile: { create: { firstName, lastName, ... } }
  }
});
```

#### Solution 2: Quick Fix (Use External Storage)

If you want to keep JSON file approach but make it work on Vercel:

1. **Use Vercel KV or Redis** for caching
2. **Use Vercel Blob Storage** for file storage
3. **Use MongoDB Atlas** (free tier) as document database

### What Changes Are Needed

| File | Current Problem | Fix Required |
|------|-----------------|--------------|
| `data-service.ts` | Uses JSON + in-memory | Switch to Prisma queries |
| `auth/login/route.ts` | Reads from JSON | Query Prisma User model |
| `auth/register/route.ts` | Writes to JSON | Insert into Prisma User model |
| `directory/route.ts` | JSON-based | Prisma Profile queries |
| All API routes | File-based storage | Database queries |

---

## 11. Deployment

### How Was It Deployed?

**Platform: Vercel** (by the creators of Next.js)

### Deployment Steps

```bash
# 1. Push code to GitHub
git add .
git commit -m "Update"
git push origin main

# 2. Vercel automatically detects Next.js project
# 3. Runs: npm run build
# 4. Deploys to: https://slu-alumni-connect.vercel.app/
```

### Vercel Configuration

- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:** DATABASE_URL is set

### Why Vercel?

1. **Free tier** available
2. **Automatic deployments** on git push
3. **Serverless functions** for API routes
4. **Edge network** for fast loading
5. **Built by Next.js creators** - best compatibility

---

## 12. Security and Permissions

### Current Authentication System

**Type: Demo/Prototype Authentication** (NOT production-ready!)

```typescript
// ADMIN LOGIN (hardcoded)
if (email === 'admin@slu.edu' && password === 'admin123') {
  return { user: adminUser };
}

// ALUMNI LOGIN (from JSON)
if (password === 'password123') {  // All CSV users use this password!
  return { user: alumniUser };
}
```

### What's Protected?

| Route | Protection | How It Works |
|-------|------------|--------------|
| `/api/directory` | Login required | Checks `getCurrentUser(request)` |
| `/api/admin/*` | Admin only | Checks `isAdmin(user)` |
| `/mentorship` | Login required | `ProtectedRoute` component |
| `/profile` | Login required | `ProtectedRoute` component |

### How User is Identified in API?

```typescript
// src/lib/auth-utils.ts
export async function getCurrentUser(request: NextRequest) {
  // Reads from header: x-user-email
  const userEmail = request.headers.get('x-user-email');
  
  // If admin
  if (email === 'admin@slu.edu') return adminUser;
  
  // Check registered users
  if (registeredUsers.has(email)) return registeredUser;
  
  // Check alumni JSON
  const alumni = AlumniDataService.getAll();
  return alumni.find(a => a.email === email);
}
```

### Security Issues (For Production Fix)

1. **Passwords not hashed** - Using plain text in JSON
2. **No real session management** - Using localStorage only
3. **No CSRF protection** - API accepts any request
4. **Hardcoded admin credentials** - Should be in environment
5. **No rate limiting** - Anyone can spam API

### What's NOT Implemented

- Email verification
- Password reset
- Two-factor authentication
- Session timeouts
- IP-based security
- HTTPS enforcement (Vercel handles this)

---

## 9. Complete File-by-File Breakdown

### Frontend Page Files (Detailed Explanation)

#### **`src/app/layout.tsx`** (Root Layout - 32 lines)

**Purpose:** Root HTML wrapper for entire application

**What it contains:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLU Alumni Connect",
  description: "Saint Louis University Alumni Network"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Key Functions:**
1. Loads Google Fonts (Geist Sans, Geist Mono)
2. Sets up HTML document structure
3. Applies global CSS (globals.css)
4. Provides metadata for SEO
5. Wraps all pages with consistent styling

**Important:** This is the ONLY place where `<html>` and `<body>` tags exist

---

#### **`src/app/page.tsx`** (Landing Page - 450+ lines)

**Purpose:** Homepage with hero section, stats, and growth charts

**Main Sections:**

1. **Hero Section** (Lines 45-95)
   - Full-screen background image
   - Welcome message (changes based on login status)
   - CTA buttons: "Join the Network" or "Find Alumni"
   
2. **Dynamic Stats Dashboard** (Lines 97-140)
   ```typescript
   useEffect(() => {
     const fetchStats = async () => {
       const response = await fetch('/api/stats');
       const data = await response.json();
       setStats(data);
     }
     fetchStats();
   }, []);
   ```
   
   Displays:
   - Total Alumni (e.g., "5.2k+")
   - Countries represented (e.g., "45+")
   - Total raised for scholarships (e.g., "$2.5M")
   - Growth chart (Recharts ComposedChart)

3. **Growth Chart Visualization** (Lines 142-180)
   ```typescript
   <ComposedChart data={growthData}>
     <Area dataKey="alumni" fill="url(#colorAlumni)" />
     <Line dataKey="donations" stroke="#FDB913" strokeWidth={3} />
   </ComposedChart>
   ```
   
   Shows:
   - Alumni community growth over years
   - Scholarship fundraising trends
   - Dual Y-axis (alumni count + donation amounts)

4. **Why Join Section** (Lines 220-260)
   - Feature cards: Directory, Events, Mentorship, Giving Back
   - Icons using Lucide React
   - Hover animations with Tailwind

5. **Upcoming Events** (Lines 262-330, authenticated users only)
   - Fetches events from `/api/stats`
   - Displays 6 upcoming events
   - Event cards with date, location, description
   - "View All Events" CTA

6. **Alumni Success Stories** (Lines 332-380)
   - Three featured alumni profiles
   - Testimonials
   - Graduation year badges
   - Profile images (from Unsplash)

7. **Final CTA Section** (Lines 382-395)
   - "Ready to Reconnect?" banner
   - Blue background with accent button

**Data Flow:**
```
page.tsx → fetch('/api/stats') → src/app/api/stats/route.ts
         → StatsService.getOverview()
         → Returns { totalAlumni, totalCountries, totalRaised, growthData, upcomingEvents }
         → State updates → Charts re-render
```

---

#### **`src/app/login/page.tsx`** (Login Form - 250 lines)

**Purpose:** Authentication page with credential validation

**Visual Design:**
- Full-screen background image (`/login-bg.png`)
- Glassmorphism card (frosted glass effect)
- Backdrop blur with gradient overlay

**Form Fields:**
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Submit Handler:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    login(data.user);  // Zustand store action
    router.push("/");   // Redirect to home
  } else {
    setError(data.error);
  }
};
```

**Features:**
- Real-time error display
- Loading spinner during authentication
- "Forgot Password" link (placeholder)
- "Sign Up" link to registration
- IT Help Desk contact info
- Responsive design (mobile-friendly)

**Demo Credentials Display:**
- Admin: admin@slu.edu / admin123
- Alumni: [any-email-from-csv] / password123

---

#### **`src/app/signup/page.tsx`** (Registration - 350 lines)

**Purpose:** New user registration with profile creation

**Form Fields:**
1. First Name (required)
2. Last Name (required)
3. Email (required, validated with regex)
4. Graduation Year (number, 1950-2030)
5. Program (dropdown):
   - Computer Science
   - Business Administration
   - Engineering
   - Liberal Arts
   - Medicine
   - Nursing
   - Law
   - Education
6. Password (required, min 6 chars)
7. Confirm Password (must match)

**Password Toggle:**
```typescript
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

<Input type={showPassword ? "text" : "password"} />
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff /> : <Eye />}
</button>
```

**Validation Logic:**
```typescript
// Email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(formData.email)) {
  setError('Please enter a valid email address');
  return;
}

// Password match
if (formData.password !== formData.confirmPassword) {
  setError('Passwords do not match');
  return;
}

// Password strength
if (formData.password.length < 6) {
  setError('Password must be at least 6 characters long');
  return;
}
```

**Department Mapping:**
```typescript
const department = 
  formData.program.includes('Computer Science') || formData.program.includes('Engineering') 
    ? 'STEM'
  : formData.program.includes('Business') 
    ? 'BUSINESS'
  : formData.program.includes('Medicine') || formData.program.includes('Nursing') 
    ? 'HEALTHCARE'
  : formData.program.includes('Social Work') || formData.program.includes('Education') 
    ? 'SOCIAL_SCIENCES' 
    : 'HUMANITIES';
```

**After Successful Registration:**
1. Notification added for admin verification
   ```typescript
   if (data.notificationData) {
     addSignupNotification(data.notificationData);
   }
   ```
2. Success alert shown
3. Redirect to login page
4. User appears in directory immediately (with "Pending" verification status)

---

#### **`src/app/directory/page.tsx`** (Alumni Search - 400 lines)

**Purpose:** Searchable alumni directory with advanced filters

**Search Features:**
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [filters, setFilters] = useState({
  department: "",
  graduationYear: "",
  location: "",
  verificationStatus: ""
});
```

**API Query Construction:**
```typescript
const params = new URLSearchParams({
  search: searchTerm,
  department: filters.department,
  graduationYear: filters.graduationYear,
  location: filters.location
});

const response = await fetch(`/api/directory?${params}`);
```

**Alumni Card Component:**
```typescript
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <Avatar>
      <span>{firstName[0]}{lastName[0]}</span>
    </Avatar>
    <div>
      <h3>{firstName} {lastName}</h3>
      <Badge>{verificationStatus}</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p>{jobTitle} at {currentEmployer}</p>
    <p>{city}, {state}</p>
    <p>Class of {graduationYear}</p>
  </CardContent>
</Card>
```

**Performance Optimization:**
- Debounced search (500ms delay)
- Pagination (50 results per page)
- Virtualized scrolling for large lists
- Loading skeletons during fetch

---

#### **`src/app/mentorship/page.tsx`** (Mentorship Hub - **4,682 LINES!**)

**Purpose:** Complete mentorship system with multiple user interfaces

**WHY SO BIG?**
This is the most complex page in the entire application. It contains:

1. **Student/Alumni Interface** (~2000 lines)
   - Find Mentors tab
   - My Mentorships tab  
   - Become a Mentor tab
   - User Analytics tab

2. **Admin Interface** (~1500 lines)
   - Manage Mentorships
   - Mentor Approval  
   - Program Analytics
   - Settings

3. **Shared Components** (~1182 lines)
   - Search & filter logic
   - Request dialog
   - Rating system
   - Status management
   - Charts and visualizations

**Main State Variables (50+):**
```typescript
const [mentors, setMentors] = useState<Mentor[]>([]);
const [mentorshipRequests, setMentorshipRequests] = useState([]);
const [incomingMentorshipRequests, setIncomingMentorshipRequests] = useState([]);
const [pendingApplications, setPendingApplications] = useState([]);
const [activeTab, setActiveTab] = useState("find-mentors");
const [searchTerm, setSearchTerm] = useState("");
const [selectedArea, setSelectedArea] = useState("");
const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
const [mentorApplicationStatus, setMentorApplicationStatus] = useState('none');
// ... 40+ more state variables
```

**Tab Structure:**
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    {!isAdmin && (
      <>
        <TabsTrigger value="find-mentors">Find Mentors</TabsTrigger>
        <TabsTrigger value="my-mentorships">My Mentorships</TabsTrigger>
        <TabsTrigger value="become-mentor">Become a Mentor</TabsTrigger>
        <TabsTrigger value="user-analytics">Analytics</TabsTrigger>
      </>
    )}
    {isAdmin && (
      <>
        <TabsTrigger value="manage-mentorships">Manage Program</TabsTrigger>
        <TabsTrigger value="mentor-approval">Mentor Approval</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </>
    )}
  </TabsList>
</Tabs>
```

**Find Mentors Logic:**
```typescript
// Filter mentors
const filteredMentors = mentors.filter(mentor => {
  const matchesSearch = 
    mentor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
  const matchesArea = !selectedArea || 
    mentor.mentorshipAreas.includes(selectedArea);
    
  const matchesCompany = !selectedCompany || 
    mentor.company === selectedCompany;
    
  return matchesSearch && matchesArea && matchesCompany;
});

// Pagination
const totalPages = Math.ceil(filteredMentors.length / itemsPerPage);
const paginatedMentors = filteredMentors.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
```

**Request Mentorship Flow:**
```typescript
const handleRequestMentorship = async (mentor: Mentor) => {
  const response = await fetch('/api/mentorship', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mentorId: mentor.id,
      mentorEmail: mentor.email,
      mentorName: `${mentor.firstName} ${mentor.lastName}`,
      area: mentorshipArea,
      message: mentorshipMessage
    })
  });
  
  if (response.ok) {
    alert(`Mentorship request sent to ${mentor.firstName}!`);
    setActiveTab("my-mentorships");
  }
};
```

**Analytics Charts:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={mentorshipAreasDistribution}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#003DA5" />
  </BarChart>
</ResponsiveContainer>

<PieChart>
  <Pie data={mentorRatingsDistribution} dataKey="value">
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

**Why Not Split Into Multiple Files?**
The page was intentionally kept as one file to:
1. Maintain tab state consistency
2. Share state between student/admin views
3. Avoid prop drilling through multiple components
4. Keep related mentorship logic together

**Performance Note:**
Despite the size, the page is optimized with:
- Lazy loading of tabs (only active tab renders)
- Memoized calculations using `useMemo`
- Debounced search inputs
- Pagination to limit rendered items

#### `src/stores/auth-store.ts`
**Purpose:** Manages login state in browser
**What it does:**
- Uses Zustand library for state management
- Persists to localStorage (survives page refresh)
- Provides `login()`, `logout()`, `updateProfile()` methods

#### `src/lib/data-service.ts`
**Purpose:** MAIN DATA HANDLING FILE
**What it does:**
- Loads all JSON data on server start
- Provides classes: `AlumniDataService`, `EventsDataService`, `DonationsDataService`, `MentorshipDataService`, etc.
- Writes changes back to JSON files

#### `src/lib/auth-utils.ts`
**Purpose:** Server-side authentication helpers
**What it does:**
- `getCurrentUser()` - Gets logged-in user from request headers
- `isAdmin()` - Checks if user is admin
- `requireAdmin()` - Returns error if not admin

#### `src/lib/registered-users.ts`
**Purpose:** Manages newly registered users
**What it does:**
- Loads registered_users.json
- Provides Map-like interface to get/set/delete users
- Auto-saves to file on changes

### API Files

#### `src/app/api/auth/login/route.ts`
**Purpose:** Handle login requests
**Flow:**
1. Receive email + password
2. Check if admin
3. Check registered users
4. Check alumni JSON
5. Return user or error

#### `src/app/api/auth/register/route.ts`
**Purpose:** Handle signup requests
**Flow:**
1. Validate email, password, name
2. Check if email already exists
3. Add to registered_users.json
4. Add to slu_alumni_data.json
5. Return success

#### `src/app/api/stats/route.ts`
**Purpose:** Provide dashboard statistics
**Returns:**
- Total alumni count
- Total countries
- Total donations
- Growth data for charts
- Upcoming events

#### `src/app/api/directory/route.ts`
**Purpose:** Alumni directory CRUD
**Methods:**
- GET: List/search alumni
- POST: Add new alumni (admin only)

#### `src/app/api/events/route.ts`
**Purpose:** Events management
**Methods:**
- GET: List events
- POST: Create event (admin only)
**Special:** Manages session_events.json and deleted_events.json

#### `src/app/api/mentorship/route.ts`
**Purpose:** Mentorship system
**Methods:**
- GET: List mentors, get areas
- POST: Request mentorship
- PUT: Accept/decline/complete mentorship

### Component Files

#### `src/components/navigation/navbar.tsx`
**Purpose:** Top navigation bar
**What it does:**
- Shows logo
- Navigation links
- Login/logout buttons
- Notification bell
- Admin badge for admins

#### `src/components/auth/protected-route.tsx`
**Purpose:** Block unauthenticated users
**What it does:**
- Checks if user is logged in
- Shows loading state
- Redirects to login if not authenticated

#### `src/components/notifications/notification-bell.tsx`
**Purpose:** Notification icon with count
**What it does:**
- Shows bell icon
- Displays unread count badge
- Links to notifications page

---

## Summary: Quick Reference

### File Locations Summary

| What You Need | Where To Find It |
|--------------|------------------|
| Page UI code | `src/app/[page]/page.tsx` |
| API endpoints | `src/app/api/[route]/route.ts` |
| Reusable UI components | `src/components/` |
| Data handling | `src/lib/data-service.ts` |
| Authentication logic | `src/lib/auth-utils.ts` |
| Login state (browser) | `src/stores/auth-store.ts` |
| Database schema | `prisma/schema.prisma` |
| All data files | `src/data/*.json` |
| Global styles | `src/app/globals.css` |
| Environment config | `.env` |

### The Main Problem (One Line)

**The app uses JSON files for data storage, but Vercel's serverless functions have a read-only filesystem, so any data written to files is lost between requests.**

### The Solution (One Line)

**Switch from JSON file storage to using the Prisma database that is already configured but not being used.**

---

## Contact for Clarification

If you need more explanation on any part, please have Madhu call and explain this document. All technical details are documented here for reference.

**Maku inka okasari madhu tho call petinchandi** - This document contains everything, but a call will help clarify any doubts.

---

*Document created: December 2, 2025*
*Project: SLU Alumni Connect*
*Analysis Version: Complete*
