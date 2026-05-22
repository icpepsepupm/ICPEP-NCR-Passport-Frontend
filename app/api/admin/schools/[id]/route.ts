import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[API] GET /api/admin/schools/${params.id}`);

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Schools API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch school",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[API] PUT /api/admin/schools/${params.id}`);
  try {
    const supabase = await createServerSupabaseClient();
    const id = params.id;

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
      .update({
        name: name,
        code: code.toUpperCase()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'School name or code already exists' }, { status: 409 });
      }
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
      }
      if (error.code === '42501') {
        return NextResponse.json({ success: false, error: 'Unauthorized: Row-Level Security (RLS) policy blocked this update' }, { status: 403 });
      }
      console.error('Supabase Update Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Schools API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update school' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[API] DELETE /api/admin/schools/${params.id}`);
  try {
    const supabase = await createServerSupabaseClient();
    const id = params.id;

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42501') {
        return NextResponse.json({ success: false, error: 'Unauthorized: Row-Level Security (RLS) policy blocked this deletion' }, { status: 403 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("Schools API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete school' }, { status: 500 });
  }
}