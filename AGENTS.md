# UW Blockchain Career Portal - Project Overview

## Project Summary

The **UW Blockchain Career Portal** is a full-stack web application designed to connect UW Blockchain club members with career opportunities in the blockchain, crypto, and Web3 space. The platform enables users to build professional profiles, explore job opportunities from industry partners, and allows administrators to manage job postings and member data.

### Key Objectives
- Provide a centralized platform for career profile management
- Facilitate job discovery for blockchain/crypto roles
- Enable admin management of members and job postings
- Support the UW Blockchain club's industry partnerships and alumni network

---

## Technology Stack

### Frontend Framework
- **Next.js 16.0.10** - React meta-framework for production applications
  - App Router for file-based routing
  - Server and client components for optimal performance
  - Built-in API routes for backend functionality
  - TypeScript support for type safety

### UI/Styling
- **React 19.2.0** - Component library and state management
- **TailwindCSS 4** - Utility-first CSS framework for responsive design
- **Framer Motion 12.23.24** - Animation library for smooth, engaging UI transitions
- **Lucide React 0.561.0** - Icon library for consistent iconography

### Backend & Database
- **Supabase 2.89.0** - Open-source Firebase alternative
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication (email/password, role-based access)
  - Service role for elevated permissions

### Development Tools
- **TypeScript 5** - Typed JavaScript for safer code
- **ESLint 9** - Code linting and quality checking
- **Babel Plugin React Compiler** - Optimized React compilation
- **PostCSS 4** - CSS transformation tool

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── profile/
│   │       └── route.ts          # Profile save/load API endpoint
│   ├── career-portal/
│   │   ├── page.tsx              # User dashboard (Profile tab)
│   │   ├── jobs/
│   │   │   └── page.tsx          # Job postings page
│   │   └── admin/
│   │       ├── page.tsx          # Admin dashboard
│   │       ├── manage-members/
│   │       │   └── page.tsx      # Member management
│   │       └── manage-jobs/
│   │           └── page.tsx      # Job posting management
│   ├── engineering/
│   ├── team/
│   ├── reset-password/
│   ├── update-password/
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Homepage
├── components/
│   ├── Navbar.tsx                # Navigation component
│   ├── Footer.tsx                # Footer component
│   ├── ClientNavigation.jsx
│   ├── Cards.jsx                 # Reusable card component
│   ├── Hero.jsx
│   ├── TypewriterText.tsx
│   └── ... (other components)
├── data/
│   └── team.js                   # Team member data
└── api/
    └── supabase.ts               # Supabase client config
```

---

## Core Features

### 1. User Career Portal (`/career-portal`)

#### Profile Management
- **Personal Information**: Email (read-only), graduation date, degree program
- **Career Interests**: Multi-select checkboxes with categories
  - Engineering: Software Engineering, Blockchain Development, DevOps
  - Finance, Product Management, Data Science, UI/UX Design
  - Business Development, Research/Academia, Marketing, Legal, Security, Venture
- **Social Links**: LinkedIn and GitHub URLs
- **Notes**: Text area for additional preferences
- **Save Functionality**: Server-side API endpoint for data persistence

#### Job Postings (`/career-portal/jobs`)
- Display job listings from industry partners
- Search and filter capabilities (job type, location)
- Responsive card-based layout
- Placeholder for future job listing features

### 2. Admin Panel (`/career-portal/admin`)

#### Authentication
- Admin-only access (email: `blockchn@uw.edu`)
- Role-based access control
- Session management with Supabase

#### Admin Dashboard
- Statistics overview (applications, members)
- Recent applications table
- Quick action buttons
- Activity feed and system status

#### Member Management (`/career-portal/admin/manage-members`)
- View/edit member information
- Application tracking
- Status management
- Bulk operations

#### Job Management (`/career-portal/admin/manage-jobs`)
- Create/edit/delete job postings
- Status management (active, draft, expired)
- Application tracking per job
- Company and posting statistics
- Import/export functionality
- Search and filter

---

## Database Schema

### `profiles` Table
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| created_at | timestamp | Record creation time |
| last_updated | timestamp | Last update time |
| email | text | User email (unique) |
| expected_graduation | integer | Graduation year |
| degree | text | Degree/program name |
| career_interests | json | Array of selected interests |
| social_linkedin | text | LinkedIn profile URL |
| social_github | text | GitHub/portfolio URL |
| notes | text | User preferences/notes |

### `job_postings`
- Job title, description, company
- Location and employment type
- Posted date and application deadline
- Required skills and experience level
- Status tracking

### `user_job_interactions`
- Tracks saved jobs and applications
- User engagement metrics

---

## API Endpoints

### Profile Management
```
POST /api/profile
- Save or update user profile
- Handles create/update logic
- Uses service role for elevated permissions

GET /api/profile?email={email}
- Retrieve user profile data
- Returns existing profile or null
```

---

## Design System

### Color Palette
- **Primary**: Electric Purple (`#6A0DFF`)
- **Secondary**: Electric Alt (`#7C3AED`)
- **Background**: Dark (`#000000`)
- **Text**: White (`#FFFFFF`), Muted (`#9CA3AF`)

### Typography
- **Heading**: Space Grotesk
- **Body**: IBM Plex Sans
- **Mono**: JetBrains Mono

### UI Patterns
- **Glassmorphism**: `bg-black/40 backdrop-blur-sm border border-white/10`
- **Button Gradient**: Purple to violet gradient
- **Animations**: Smooth transitions with Framer Motion
- **Responsive**: Mobile-first approach with Tailwind breakpoints

---

## Authentication & Authorization

### Authentication Flow
1. User enters email/password in sign-in form
2. Supabase validates credentials
3. JWT session token issued
4. User redirected to dashboard

### Authorization Rules
- **Public Routes**: Homepage, team page, engineering page
- **Protected Routes**: `/career-portal` (requires user login)
- **Admin Routes**: `/career-portal/admin/*` (requires `blockchn@uw.edu`)
- **API Routes**: Service role key for database operations

---

## Development Guidelines

### Code Standards
- **Language**: TypeScript for type safety
- **Component Style**: Functional components with hooks
- **State Management**: React hooks (useState, useEffect)
- **Styling**: Tailwind CSS utility classes
- **Animations**: Framer Motion for transitions

### Key Implementation Patterns

#### Authentication
```typescript
// Check session and authorize user
const { data: { session } } = await supabase.auth.getSession();
if (session?.user && session.user.email !== "blockchn@uw.edu") {
  await supabase.auth.signOut(); // Unauthorized
}
```

#### API Integration
```typescript
// Client-side API calls
const response = await fetch('/api/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profileData)
});
```

#### Database Operations (Backend)
```typescript
// Use service role for elevated permissions
const supabase = createClient(url, serviceRoleKey);
const { data, error } = await supabase
  .from('profiles')
  .upsert(profileData);
```

---

## Environment Configuration

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Configuration Details
- `NEXT_PUBLIC_*` variables are exposed to the client
- Service role key kept private (server-only)
- Session persistence enabled in Supabase config

---

## Common Tasks & Workflows

### Adding a New Feature
1. Create component in appropriate directory
2. Add route in `app/` directory if needed
3. Style with Tailwind classes
4. Add animations with Framer Motion
5. Implement TypeScript types

### Modifying Database Schema
1. Update Supabase database structure
2. Update RLS policies if needed
3. Update API endpoints to match schema
4. Update TypeScript types

### Creating Admin Pages
1. Add authentication check for `blockchn@uw.edu`
2. Use admin dashboard layout pattern
3. Implement CRUD operations via API
4. Add error handling and loading states

### Connecting Components to Data
1. Create API endpoint in `/api`
2. Use fetch in component useEffect
3. Handle loading and error states
4. Update component state with data

---

## Important Notes for Next Agents

### Current Status
- ✅ Authentication system implemented
- ✅ Profile page with career interests
- ✅ Admin dashboard with member management
- ✅ Job posting management page (boilerplate)
- ⏳ Job listing display (partial)
- ⏳ Job application system (planned)
- ⏳ Resume uploads (removed, planned for future)
- ⏳ Email notifications (planned)

### Known Limitations
- Job postings currently use sample data
- Resume upload feature removed (can be re-implemented)
- Application tracking not fully integrated
- Analytics and reporting in planning phase

### Next Priority Tasks
1. Connect job postings to database
2. Implement job application flow
3. Add email notification system
4. Create analytics/reporting dashboard
5. Implement search and recommendation engine

---

## Resources & References

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Useful Patterns
- See `/src/app/career-portal/page.tsx` for authentication pattern
- See `/src/app/api/profile/route.ts` for API endpoint pattern
- See `/src/components/Navbar.tsx` for component pattern
- See PRD.md and CAREER_PORTAL_FEATURES.md for requirements

---

## Contact & Support

For questions about the codebase structure or implementation details, refer to:
- Project requirements: `PRD.md`
- Feature specifications: `CAREER_PORTAL_FEATURES.md`
- Code structure: This AGENTS.md file
- Existing implementations: Look at similar pages and components

---

**Last Updated**: December 2024
**Project Version**: 0.1.0
**Status**: Active Development
