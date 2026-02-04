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

  const { data: resetInvite, error } = await supabase
    .from('password_reset_invites')
    .select('email, expires_at, used')
    .eq('token', token)
    .single();

  if (error || !resetInvite) {
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 400 }
    );
  }

  if (resetInvite.used) {
    return NextResponse.json(
      { valid: false, error: 'This password reset link has already been used' },
      { status: 400 }
    );
  }

  if (new Date(resetInvite.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: 'This password reset link has expired' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    email: resetInvite.email,
  });
}
