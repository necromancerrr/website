import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const [membersResult, jobsResult] = await Promise.all([
      supabaseAdmin.from('members').select('id, is_active', { count: 'exact' }),
      supabaseAdmin.from('jobs').select('id', { count: 'exact' }),
    ]);

    const members = membersResult.data || [];
    const jobs = jobsResult.data || [];

    return NextResponse.json({
      totalMembers: members.length,
      activeMembers: members.filter(m => m.is_active).length,
      totalJobs: jobs.length,
      activeJobs: jobs.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
