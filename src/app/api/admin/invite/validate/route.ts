import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token is required' },
      { status: 400 }
    );
  }

  const { data: invite, error } = await supabase
    .from('invites')
    .select('email, expires_at, used')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 400 }
    );
  }

  if (invite.used) {
    return NextResponse.json(
      { valid: false, error: 'This invite has already been used' },
      { status: 400 }
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: 'This invite has expired' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
  });
}
