import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    let walletAddress
    try {
      const body = await request.json()
      walletAddress = body?.walletAddress
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    console.log('API: Checking wallet authorization for:', walletAddress)

    if (!supabase) {
      console.error('Supabase admin client not initialized')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: member, error } = await supabase
      .from('members')
      .select('id, wallet_address, is_active, email, first_name, last_name')
      .ilike('wallet_address', walletAddress.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('API Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('API: Member found:', member)

    if (!member) {
      return NextResponse.json({ authorized: false, error: 'You are not authorized' })
    }

    if (!member.is_active) {
      return NextResponse.json({ 
        authorized: false, 
        error: 'Your account has been deactivated. Please contact an administrator.' 
      })
    }

    return NextResponse.json({ 
      authorized: true, 
      member: {
        id: member.id,
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
      }
    })
  } catch (err) {
    console.error('API Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
