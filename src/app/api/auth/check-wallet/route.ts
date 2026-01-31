import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/api/supabase-server'

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    console.log('API: Checking wallet authorization for:', walletAddress)

    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select('id, wallet_address, is_active, email, first_name, last_name')
      .ilike('wallet_address', walletAddress.toLowerCase())
      .maybeSingle()

    console.log('API: Member query result:', { member, error })

    if (error) {
      console.error('API Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

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
