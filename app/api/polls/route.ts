import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!.trim()
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { question, options } = await request.json()

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 })
    }

    const validOptions = options.filter((opt: any) => typeof opt === 'string' && opt.trim() !== '')
    if (validOptions.length < 2) {
      return NextResponse.json({ error: 'Minimum 2 valid options required' }, { status: 400 })
    }

    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert([{ question: question.trim() }])
      .select('id')
      .single()

    if (pollError) throw pollError

    const optionsData = validOptions.map((text: string) => ({
      poll_id: pollData.id,
      text: text.trim()
    }))

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsData)

    if (optionsError) throw optionsError

    return NextResponse.json({ id: pollData.id })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}