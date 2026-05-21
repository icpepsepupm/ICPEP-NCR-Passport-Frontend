import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[API] PUT /api/admin/schools/${params.id}`);
  try {
    const supabase = await createServerSupabaseClient();
    const id = params.id;
    const body = await request.json();

    if (!body.name || !body.code || body.code.length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Valid school name and 3-character code are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('schools')
      .update({
        name: body.name,
        code: body.code.toUpperCase()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'School name or code already exists' }, { status: 400 });
      }
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

    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("Schools API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete school' }, { status: 500 });
  }
}