import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  console.log('[API] GET /api/admin/schools');
  try {
    const supabase = await createServerSupabaseClient();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Fetch single school by ID
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Fetch all schools
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    console.error('Schools API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch schools' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('[API] POST /api/admin/schools');
  try {
    const supabase = await createServerSupabaseClient();

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (typeof body?.name !== 'string' || typeof body?.code !== 'string') {
      return NextResponse.json({ success: false, error: 'Name and code must be strings' }, { status: 400 });
    }

    const name = body.name.trim();
    const code = body.code.trim();

    if (!name || code.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Valid school name and at least 3-character code are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: name,
        code: code.toUpperCase()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'School name or code already exists' }, { status: 409 });
      }
      if (error.code === '42501') {
        return NextResponse.json({ success: false, error: 'Unauthorized: Row-Level Security (RLS) policy blocked this action' }, { status: 403 });
      }
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Schools API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create school' }, { status: 500 });
  }
}