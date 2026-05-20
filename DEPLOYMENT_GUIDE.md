# Quick Start Deployment Guide

## Phase 1: Supabase Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy Project URL and Anon Key

### 2. Run Database Migrations
In Supabase Dashboard > SQL Editor:
1. New query
2. Copy & paste entire contents of `supabase/migrations/001_initial_schema.sql`
3. Execute

### 3. Create Storage Bucket
In Supabase Dashboard > Storage:
1. Create bucket: `passport-assets`
2. Create folders:
   ```
   passport-assets/
   ├── qr/
   ├── events/
   ├── certificates/
   └── members/
   ```

### 4. Configure Supabase Auth
In Supabase Dashboard > Authentication:
- Email/Password auth is enabled (default)
- Only ID + Password authentication (no OAuth)
- Emails auto-generated from username

---

## Phase 2: Frontend Setup (5 minutes)

### 1. Clone & Install
```bash
cd ICPEP-NCR-Passport-Frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=passport-assets
```

### 3. Test Locally
```bash
npm run dev
# Visit http://localhost:3000
```

---

## Phase 3: Create Initial Admin User (5 minutes)

### Option A: Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email & password
4. In `users` table, set:
   - `role` = 'ADMIN'
   - `first_name` = 'Admin'
   - `last_name` = 'User'

### Option B: Programmatically
```typescript
// In app/page.tsx or test file
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 1. Create auth user
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'secure-password-123',
})

// 2. Create user profile
const { error: profileError } = await supabase
  .from('users')
  .insert([{
    id: authData.user?.id,
    first_name: 'Admin',
    last_name: 'User',
    role: 'ADMIN',
    username: 'admin'
  }])
```

---

## Phase 4: Create Test Data (10 minutes)

### 1. Create School
```sql
INSERT INTO schools (name, code) VALUES
('ICPEP', 'ICPEP-001');
```

### 2. Create Scanner User
```sql
-- Create auth user first, then profile
INSERT INTO users (id, first_name, last_name, username, role, school_id) VALUES
('scanner-uuid-here', 'Scanner', 'User', 'scanner1', 'SCANNER', 1);
```

### 3. Create Member User
```sql
INSERT INTO users (id, first_name, last_name, username, role, school_id, member_id) VALUES
('member-uuid-here', 'John', 'Doe', 'johndoe', 'MEMBER', 1, 'MEM001');

-- Create passport for member
INSERT INTO passports (member_id) VALUES ('member-uuid-here');
```

### 4. Create Event
```sql
INSERT INTO events (name, schedule, venue_name, description, event_type) VALUES
('Welcome Event 2024', NOW() + INTERVAL '7 days', 'Main Auditorium', 'Welcome event', 'GENERAL_ASSEMBLY');
```

---

## Phase 5: Test Core Features (15 minutes)

### 1. Test Authentication
```bash
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: your-anon-key" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 2. Test QR Generation
```bash
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"memberId":"member-uuid"}'
```

### 3. Test Stamp Creation
```bash
curl -X POST http://localhost:3000/api/stamps/create \
  -H "Content-Type: application/json" \
  -d '{"passportId":1,"eventId":1}'
```

### 4. Test Admin Report
```bash
curl -X GET "http://localhost:3000/api/admin/reports/event-attendance?eventId=1" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Phase 6: Deploy to Production

### Option A: Vercel (Recommended)

1. Push to GitHub:
```bash
git add .
git commit -m "Supabase migration complete"
git push origin main
```

2. Import to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repo
   - Add environment variables
   - Deploy

### Option B: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t passport-app .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=yyy \
  passport-app
```

### Option C: Other Platforms
- AWS AppRunner
- Google Cloud Run
- Railway
- Fly.io

---

## Phase 7: Post-Deployment Checklist

- [ ] Test all user roles (ADMIN, SCANNER, MEMBER)
- [ ] Verify QR code generation works
- [ ] Test stamp creation for duplicate prevention
- [ ] Verify RLS policies are enforced
- [ ] Check Storage uploads are working
- [ ] Monitor application performance
- [ ] Set up error logging (Sentry, etc.)
- [ ] Configure CORS properly
- [ ] Set up backups
- [ ] Update documentation

---

## Common Issues & Solutions

### "Relation 'users' does not exist"
- Ensure migrations ran successfully
- Check Supabase project region

### "Permission denied for schema public"
- Verify RLS policies are configured
- Check user role in database

### "Storage: Bucket not found"
- Create `passport-assets` bucket
- Check bucket is public

### "CORS error on storage upload"
- Supabase Dashboard > Storage > bucket settings
- Add your domain to CORS

---

## Monitoring & Maintenance

### Database Health
- Monitor query performance in Supabase Dashboard
- Check for long-running queries
- Review RLS policy efficiency

### Application Metrics
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track user session metrics

### Backups
- Supabase includes automatic daily backups
- Export data weekly for archives
- Test backup restoration quarterly

---

## Next Steps

1. **User Onboarding**: Build admin panel for user management
2. **Certificate Generation**: Implement e-certificate creation
3. **Analytics Dashboard**: Build real-time analytics UI
4. **Mobile App**: Create native mobile client
5. **API Documentation**: Generate OpenAPI spec

---

## Support

For issues or questions:
1. Check `SUPABASE_MIGRATION.md` for detailed docs
2. Review schema in `supabase/migrations/001_initial_schema.sql`
3. Consult Supabase docs: https://supabase.com/docs
4. Check application logs in Supabase Dashboard
