import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!.trim()
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { poll_id, option_id } = await request.json()
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip_address = forwardedFor ? forwardedFor.split(',')[0] : 'unknown-ip'

    if (!poll_id || !option_id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const { error } = await supabase
      .from('votes')
      .insert([{ poll_id, option_id, ip_address }])

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already voted from this IP' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}