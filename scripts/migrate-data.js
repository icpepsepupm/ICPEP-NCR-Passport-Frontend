#!/usr/bin/env node

/**
 * Data Migration Script: Spring Boot → Supabase
 * 
 * This script migrates existing data from Spring Boot PostgreSQL to Supabase.
 * 
 * Usage:
 *   1. Update SOURCE_* and TARGET_* connection strings below
 *   2. Run: node scripts/migrate-data.js
 *   3. Verify data in Supabase Dashboard
 * 
 * WARNING: This script will DELETE existing Supabase data. Backup first!
 */

const { createClient } = require('@supabase/supabase-js')
const pg = require('pg')

const SOURCE_DB = {
  host: process.env.SOURCE_DB_HOST || 'localhost',
  port: process.env.SOURCE_DB_PORT || 5432,
  database: process.env.SOURCE_DB_NAME || 'passport_db',
  user: process.env.SOURCE_DB_USER || 'postgres',
  password: process.env.SOURCE_DB_PASSWORD || 'password',
}

const TARGET_SUPABASE = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

if (!TARGET_SUPABASE.url || !TARGET_SUPABASE.key) {
  console.error('❌ Error: Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

const sourcePool = new pg.Pool(SOURCE_DB)
const supabase = createClient(TARGET_SUPABASE.url, TARGET_SUPABASE.key)

async function migrate() {
  try {
    console.log('🚀 Starting data migration...\n')

    // 1. Migrate Schools
    console.log('📍 Migrating schools...')
    const schoolsResult = await sourcePool.query('SELECT * FROM schools')
    if (schoolsResult.rows.length > 0) {
      const { error } = await supabase.from('schools').insert(schoolsResult.rows)
      if (error) throw error
      console.log(`   ✅ Migrated ${schoolsResult.rows.length} schools`)
    }

    // 2. Migrate Users (flatten inheritance if needed)
    console.log('📍 Migrating users...')
    const usersResult = await sourcePool.query(`
      SELECT 
        id,
        first_name,
        last_name,
        username,
        email,
        CASE 
          WHEN user_type = 'ADMIN' THEN 'ADMIN'
          WHEN user_type = 'SCANNER' THEN 'SCANNER'
          ELSE 'MEMBER'
        END as role,
        school_id,
        member_id,
        qr_code_url,
        ecertificate_url,
        created_at,
        updated_at
      FROM users
    `)

    if (usersResult.rows.length > 0) {
      // Note: User IDs must match auth.uid() if coming from Supabase Auth
      // If migrating from Spring Boot, you may need to create auth users first
      const { error } = await supabase.from('users').insert(usersResult.rows)
      if (error) throw error
      console.log(`   ✅ Migrated ${usersResult.rows.length} users`)
    }

    // 3. Migrate Events
    console.log('📍 Migrating events...')
    const eventsResult = await sourcePool.query(`
      SELECT 
        id,
        name,
        schedule,
        venue_name,
        venue_image,
        description,
        badge,
        event_type,
        created_at,
        updated_at
      FROM events
    `)

    if (eventsResult.rows.length > 0) {
      const { error } = await supabase.from('events').insert(eventsResult.rows)
      if (error) throw error
      console.log(`   ✅ Migrated ${eventsResult.rows.length} events`)
    }

    // 4. Migrate Passports
    console.log('📍 Migrating passports...')
    const passportsResult = await sourcePool.query(`
      SELECT 
        id,
        member_id,
        created_at,
        updated_at
      FROM passports
    `)

    if (passportsResult.rows.length > 0) {
      const { error } = await supabase.from('passports').insert(passportsResult.rows)
      if (error) throw error
      console.log(`   ✅ Migrated ${passportsResult.rows.length} passports`)
    }

    // 5. Migrate Stamps
    console.log('📍 Migrating stamps...')
    const stampsResult = await sourcePool.query(`
      SELECT 
        id,
        passport_id,
        event_id,
        scanner_id,
        stamp_date,
        created_at
      FROM stamps
    `)

    if (stampsResult.rows.length > 0) {
      const { error } = await supabase.from('stamps').insert(stampsResult.rows)
      if (error) throw error
      console.log(`   ✅ Migrated ${stampsResult.rows.length} stamps`)
    }

    console.log('\n✅ Migration complete!\n')
    console.log('📊 Summary:')
    console.log(`   Schools:  ${schoolsResult.rows.length}`)
    console.log(`   Users:    ${usersResult.rows.length}`)
    console.log(`   Events:   ${eventsResult.rows.length}`)
    console.log(`   Passports: ${passportsResult.rows.length}`)
    console.log(`   Stamps:   ${stampsResult.rows.length}`)
    console.log('\n⚠️  Next steps:')
    console.log('   1. Verify data in Supabase Dashboard')
    console.log('   2. Check RLS policies are working')
    console.log('   3. Test QR code generation')
    console.log('   4. Verify authentication flows')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await sourcePool.end()
  }
}

migrate()
