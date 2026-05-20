# Supabase-Native Architecture Migration Guide

## Overview

This project has been completely migrated from Spring Boot to a **Supabase-native backend architecture**. The system uses:

- **Supabase PostgreSQL** for data storage and business logic
- **Supabase Auth** for user authentication and session management
- **Supabase Storage** for file management (QR codes, certificates, images)
- **Next.js** as a frontend + minimal BFF layer (optional API routes)
- **Row Level Security (RLS)** for authorization at the database level

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Next.js Frontend                   │
│  (ICPEP-NCR-Passport-Frontend)         │
└──────────────┬──────────────────────────┘
               │
               ├─ Supabase Client SDK (direct queries)
               │
               └─ Next.js Route Handlers (minimal)
                  - QR generation
                  - Admin imports
                  - Reporting

               ↓

┌──────────────────────────────────────────────────────────┐
│              Supabase Backend                            │
├──────────────────────────────────────────────────────────┤
│ • PostgreSQL (Schema + RLS + Functions)                 │
│ • Auth (Supabase-managed)                               │
│ • Storage (passport-assets bucket)                      │
└──────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### 1. Install Dependencies

```bash
cd ICPEP-NCR-Passport-Frontend
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

**Required values:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=passport-assets
```

**Optional (for admin operations):**
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Create Storage Bucket

In Supabase Dashboard:

1. Go to **Storage** > **Buckets**
2. Create new bucket: `passport-assets`
3. Set public access (or configure signed URLs as needed)
4. Create folders:
   - `qr/` - QR codes
   - `events/` - Event images
   - `certificates/` - E-certificates
   - `members/` - Member files

---

## Database Schema

The complete PostgreSQL schema is in:
```
supabase/migrations/001_initial_schema.sql
```

### Key Tables

#### Users
- Multi-role: ADMIN, SCANNER, MEMBER
- Flattened from Spring Boot inheritance model
- Includes QR code and certificate URLs

#### Events
- Event types: GENERAL_ASSEMBLY, COMPETITION, WEBINAR, OTHERS
- Attendance tracking via Stamps

#### Passports & Stamps
- 1-1 relationship: Passport ↔ Member
- Stamps track attendance (passport + event + scanner)
- Duplicate prevention via unique constraint + PL/pgSQL function

#### Schools
- Organization grouping

---

## Row Level Security (RLS)

All tables have RLS enabled. Authorization happens at the database level:

### Admin Access
- Full access to all tables
- Identified by `auth.jwt() ->> 'role' = 'ADMIN'`

### Scanner Access
- Can insert stamps
- Can read their own stamps
- Identified by `auth.jwt() ->> 'role' = 'SCANNER'`

### Member Access
- Can read their own profile
- Can read their passport & attendance
- Identified by `auth.jwt() ->> 'role' = 'MEMBER'`

---

## Authentication Flow

### 1. Sign Up / Onboarding

```typescript
import { authClient } from '@/lib/supabase/auth'

// For admin-created users or public registration
const { data, error } = await authClient.signUp(
  'user@example.com',
  'password123'
)
```

### 2. Sign In

```typescript
const { data, error } = await authClient.signIn(
  'user@example.com',
  'password123'
)
```

### 3. Session Management

```typescript
const { useAuth } = require('@/lib/hooks/useAuth')

// In React component
function MyComponent() {
  const { user, loading, error } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Welcome, {user.email}</div>
}
```

---

## API Routes (Minimal)

### QR Code Generation
**POST** `/api/qr/generate`
```json
{
  "memberId": "uuid"
}
```
- Generates QR code
- Uploads to Storage
- Updates user.qr_code_url

### Stamp Creation (QR Scan)
**POST** `/api/stamps/create`
```json
{
  "passportId": 123,
  "eventId": 456
}
```
- SCANNER role required
- Calls PL/pgSQL function `create_stamp()`
- Prevents duplicate stamps

### Admin - Bulk Import Users
**POST** `/api/admin/users/import`
```json
{
  "users": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "MEMBER",
      "memberId": "MEM001",
      "schoolId": 1
    }
  ]
}
```

### Admin - Event Attendance Report
**GET** `/api/admin/reports/event-attendance?eventId=123`
- Returns list of attendees
- Calls PL/pgSQL function `get_event_attendance()`

---

## Data Access Patterns

### 1. Direct Supabase Queries (Recommended)

**In Client Components:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function EventList() {
  const supabase = createClient()
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .then(({ data }) => setEvents(data || []))
  }, [])

  return (
    <ul>
      {events.map(e => <li key={e.id}>{e.name}</li>)}
    </ul>
  )
}
```

### 2. Utility Functions

**Using Pre-built Queries:**
```typescript
import { eventQueries } from '@/lib/supabase/events'

const { data: events, error } = await eventQueries.getUpcomingEvents()
```

### 3. React Hooks

**Using Custom Hooks:**
```typescript
import { useEvents } from '@/lib/hooks/useEvents'

function Dashboard() {
  const { events, loading } = useEvents('upcoming')
  
  return loading ? <div>Loading...</div> : <EventList events={events} />
}
```

---

## QR Code Generation

### Frontend Preview

```typescript
import { qrCodeService } from '@/lib/qr/qr-service'

async function PreviewQR(memberId: string) {
  const text = qrCodeService.formatMemberQRText(memberId)
  const { dataUrl } = await qrCodeService.generateQRDataURL(text)
  
  return <img src={dataUrl} alt="QR Code" />
}
```

### Server-Side Generation & Upload

```typescript
import { qrCodeService } from '@/lib/qr/qr-service'
import { storageService } from '@/lib/storage/storage-service'

async function generateAndUploadQR(memberId: string) {
  const text = qrCodeService.formatMemberQRText(memberId)
  const { buffer } = await qrCodeService.generateQRBuffer(text)
  const { url } = await storageService.uploadQRCode(buffer, memberId)
  
  return url
}
```

**QR Format:**
```
MEMBER_ID:550e8400-e29b-41d4-a716-446655440000
```

---

## Business Logic (PL/pgSQL Functions)

### create_stamp()
Safely creates stamps with duplicate prevention.

```sql
SELECT * FROM create_stamp(
  p_passport_id := 1,
  p_event_id := 1,
  p_scanner_id := 'user-uuid'::uuid
);
```

Returns:
```json
{
  "success": true,
  "message": "Stamp created successfully"
}
```

Or:
```json
{
  "success": false,
  "error": "STAMP_ALREADY_EXISTS",
  "stamp_id": 42
}
```

### get_member_passport_summary()
Fetches passport attendance summary.

```sql
SELECT * FROM get_member_passport_summary('user-uuid'::uuid);
```

### get_event_attendance()
Returns list of attendees for an event.

```sql
SELECT * FROM get_event_attendance(123);
```

---

## SQL Views for Analytics

### event_stats
```sql
SELECT * FROM event_stats;
```
- `id`, `name`, `event_type`, `total_stamps`, `unique_attendees`

### member_attendance
```sql
SELECT * FROM member_attendance WHERE member_id = 'uuid';
```
- User's complete attendance history

---

## Role-Based Access Control (RBAC)

### Authentication Middleware

Protected routes enforce role checks:

```
/admin/*        → ADMIN only
/scanner/*      → SCANNER or ADMIN
/member/*       → Any authenticated user
```

See `middleware.ts` for implementation.

---

## Migration Checklist

### From Spring Boot → Supabase

- [x] Schema design (flat users, RLS)
- [x] Authentication (Supabase Auth)
- [x] Business logic (PL/pgSQL functions)
- [x] File handling (Supabase Storage)
- [x] Authorization (Row Level Security)
- [x] Data access layer (utility functions)
- [x] API routes (minimal - only when needed)
- [x] React hooks (for frontend convenience)
- [ ] Existing data migration (custom script needed)
- [ ] Performance testing
- [ ] Security audit
- [ ] User onboarding

---

## Performance Optimization

1. **Database Indexes**: Applied on all foreign keys and frequently queried fields
2. **SQL Views**: Use for complex analytics queries
3. **Pagination**: Push to Postgres using `.range()` in Supabase client
4. **Caching**: Implement with SWR or React Query if needed
5. **Full-Text Search**: Use PostgreSQL FTS for member/event search

---

## Security Best Practices

1. **Never expose service role key in client code**
2. **All row-level security policies are enforced**
3. **Admin operations use RLS checks**
4. **QR codes are uploaded to private/signed URLs if needed**
5. **Audit logging enabled on all tables**

---

## Troubleshooting

### "JWT verification failed"
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Ensure RLS policies are not too restrictive

### "User role not found"
- Verify user.role is set in database
- Check role value is one of: ADMIN, SCANNER, MEMBER

### "Storage upload failed"
- Verify bucket exists: `passport-assets`
- Check bucket folders are created
- Ensure CORS is configured if uploading from browser

### "Duplicate stamp error"
- Check unique constraint on (passport_id, event_id)
- `create_stamp()` function should prevent this naturally

---

## Development

### Run Local Environment

```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/rules-privileges.html)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## Contact & Support

For issues or questions about this migration, please refer to:
- Database schema: `supabase/migrations/001_initial_schema.sql`
- Configuration: `lib/supabase/` directory
- API routes: `app/api/` directory
