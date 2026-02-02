import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CareerField } from '@/types/career';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobIdStr } = await params;
    console.log('PUT: Updating job ID:', jobIdStr, 'Type:', typeof jobIdStr);
    
    // Safely parse job ID
    const jobId = parseInt(jobIdStr);
    if (isNaN(jobId)) {
      console.error('Invalid job ID:', jobIdStr);
      return NextResponse.json(
        { error: 'Invalid job ID', details: `Cannot parse job ID: ${jobIdStr}` },
        { status: 400 }
      );
    }
    
    console.log('PUT: Parsed job ID:', jobId);
    const body = await request.json();
    console.log('PUT: Request body:', JSON.stringify(body, null, 2));

    const {
      company,
      position,
      job_posting_url,
      experience_level,
      notes,
      career_fields,
      referral_available,
    } = body as {
      company?: string;
      position?: string;
      job_posting_url?: string;
      experience_level?: string;
      notes?: string;
      career_fields?: CareerField[];
      referral_available?: boolean;
    };

    if (!job_posting_url) {
      return NextResponse.json(
        { error: 'Job posting URL is required' },
        { status: 400 }
      );
    }

    try {
      new URL(job_posting_url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid job posting URL format' },
        { status: 400 }
      );
    }

    const updateData = {
      company: company?.trim() || null,
      position: position?.trim() || null,
      job_posting_url: job_posting_url.trim(),
      experience_level: experience_level?.trim() || null,
      notes: notes?.trim() || null,
      career_fields: career_fields || null,
      referral_available: referral_available === true,
      last_updated: new Date().toISOString(),
    };
    console.log('PUT: Update data:', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    console.log('PUT: Supabase result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update job posting', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Job posting updated successfully', data },
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobIdStr } = await params;
    console.log('DELETE: Deleting job ID:', jobIdStr, 'Type:', typeof jobIdStr);
    
    // Safely parse job ID
    const jobId = parseInt(jobIdStr);
    if (isNaN(jobId)) {
      console.error('Invalid job ID:', jobIdStr);
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }
    
    console.log('DELETE: Parsed job ID:', jobId);

    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .select()
      .single();

    console.log('DELETE: Supabase result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete job posting' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Job posting deleted successfully', data },
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
