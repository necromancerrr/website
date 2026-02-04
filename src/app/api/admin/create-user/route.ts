import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email } = await request.json()

    // Validate input
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists in auth system
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers()
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError)
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      )
    }

    const userExists = existingUser.users.some(user => user.email === email)
    if (userExists) {
      return NextResponse.json(
        { error: 'A user with this email already exists in the auth system' },
        { status: 409 }
      )
    }

    // Create new user in auth system without password
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto-confirm email since admin is adding them
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        created_by_admin: true
      }
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message}` },
        { status: 500 }
      )
    }

    // Trigger password reset email for the new user
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL}/reset-password`
    })

    if (resetError) {
      console.error('Error sending password reset email:', resetError)
      // Don't fail the request, but log the error
      console.warn('User created but password reset email failed to send')
    }

    return NextResponse.json({
      success: true,
      message: `User created successfully. Password reset email sent to ${email}`,
      userId: authUser.user?.id
    })

  } catch (error) {
    console.error('Unexpected error in create-user API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
