# Shift Scheduler (Public Viewer + Admin)

A simple, secure shift scheduler:

- Public users can view all schedules without logging in.
- Anyone who can log in to /admin has full admin access (no role checking).
- Admins can add members, and add/update/delete shifts.
- Responsive, accessible UI with shadcn/ui and Tailwind.
- Clean database with Row Level Security (RLS): public read, authenticated write.

## Architecture

- Next.js App Router (client components where appropriate)
- Supabase:
  - Auth: simple login (no signup page, no role checking)
  - Database: `members`, `shifts`
  - RLS: `SELECT` for everyone; writes allowed for any authenticated user

## Routes

- `/` Public landing and schedule viewer (no auth)
- `/admin` Admin area
  - If not signed in: admin sign-in form
  - If signed in: full CRUD on members and shifts

## Installation

1) Clone or install this project via the v0 "Download Code" button.

2) Configure environment variables:
- Locally in `.env.local` (for real projects), or in your Vercel project:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# For seeding admin:
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin1234
ADMIN_NAME=Administrator
\`\`\`

3) Initialize the database:
- In Supabase SQL editor, run in order:
  - `scripts/01_schema.sql` (creates tables and RLS policies)
  - `scripts/02_seed_members.sql` (adds sample members)
  - `scripts/03_seed_shifts.sql` (adds sample shift data with colors)

4) Create an admin user:
- In Supabase Auth dashboard, manually create a user with:
  - Email: admin@gmail.com
  - Password: admin1234
  - Confirm email: true
- Or use the Supabase Auth API to create the user programmatically.

5) Start the app:
\`\`\`
npm install
npm run dev
\`\`\`
- Public: http://localhost:3000/
- Admin: http://localhost:3000/admin (use admin@gmail.com / admin1234)

## Data Model

- `public.members`
  - `id` uuid PK, `employee_id` unique, `name`
- `public.shifts`
  - `id` uuid PK, `member_id` FK -> members(id), `date` (unique per member), `shift_type`

RLS:
- Public `SELECT` on both tables (anyone can read)
- Authenticated `INSERT/UPDATE/DELETE` on both tables (any logged-in user can write)

Indexes:
- `idx_members_employee_id`, `idx_shifts_member_id`, `idx_shifts_date`

## Features

### 🎨 **Color-Coded Shifts**
- Morning Shift: Yellow
- Evening Shift: Purple  
- Night Shift: Green
- Offday: Blue
- Leave: Red
- Absent: Gray

### 📅 **Calendar Interface**
- Click any date to assign/change shifts
- Visual color coding for easy identification
- Monthly navigation with preset data
- Shift time indicators (7AM-3PM, 3PM-11PM, 11PM-7AM)

### 👥 **Member Management**
- Add/remove team members
- Auto-select first member on load
- Employee ID and name tracking

### 📊 **Monthly Summary**
- Count of each shift type per member
- Visual statistics with color coding

## Admin Flow

- Open `/admin`
- Sign in with admin@gmail.com / admin1234
- View preset shift data with colors
- Select any team member to see their colorful schedule
- Click on calendar dates to:
  - Assign new shifts
  - Change existing shifts  
  - Remove shifts (click same type twice)

## Sample Data

The system comes with:
- 15 sample team members
- Preset shift data for current and next month
- Variety of shift types to demonstrate color coding
- Realistic shift patterns with some unassigned days

## Troubleshooting

- **RLS Policy Errors**: 
  - Ensure you ran `scripts/01_schema.sql` completely
  - Check that the user is authenticated in Supabase
  - Verify policies exist with: `SELECT * FROM pg_policies WHERE tablename IN ('members', 'shifts');`

- **No Colors Showing**: 
  - Run `scripts/03_seed_shifts.sql` to add sample data
  - Check that shifts exist: `SELECT COUNT(*) FROM shifts;`
  - Verify shift types match exactly with constants in `constants/shift-types.ts`

- **Cannot log in as admin**:
  - Ensure the user exists in Supabase Auth with email admin@gmail.com
  - Verify the password is admin1234
  - Check that email confirmation is enabled

- **Public page empty**:
  - Add members: run `scripts/02_seed_members.sql`
  - Add shifts: run `scripts/03_seed_shifts.sql`

## License

MIT
