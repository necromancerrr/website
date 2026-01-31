import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Job, CareerField } from '@/types/career';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      company,
      position,
      job_posting_url,
      experience_level,
      notes,
      career_fields,
    } = body as {
      company?: string;
      position?: string;
      job_posting_url?: string;
      experience_level?: string;
      notes?: string;
      career_fields?: CareerField[];
    };

    // Validate required fields
    if (!job_posting_url) {
      return NextResponse.json(
        { error: 'Job posting URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(job_posting_url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid job posting URL format' },
        { status: 400 }
      );
    }

    const jobData = {
      company: company?.trim() || null,
      position: position?.trim() || null,
      job_posting_url: job_posting_url.trim(),
      experience_level: experience_level?.trim() || null,
      notes: notes?.trim() || null,
      career_fields: career_fields || null,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create job posting' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Job posting created successfully', data: data as Job },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job postings' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: (jobs || []) as Job[] },
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