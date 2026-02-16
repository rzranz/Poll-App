'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function PollPage() {
  const params = useParams()
  const pollId = params?.id as string

  const [poll, setPoll] = useState<any>(null)
  const [options, setOptions] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pollId) return

    const fetchPoll = async () => {
      try {
        const { data: pollData } = await supabase.from('polls').select('*').eq('id', pollId).single()
        const { data: optionsData } = await supabase.from('options').select('*').eq('poll_id', pollId)
        const { data: votesData } = await supabase.from('votes').select('*').eq('poll_id', pollId)

        if (pollData) setPoll(pollData)
        if (optionsData) setOptions(optionsData)
        if (votesData) setVotes(votesData)

        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]')
        if (votedPolls.includes(pollId)) {
          setHasVoted(true)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()

    const channel = supabase.channel(`realtime-${pollId}`).on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'votes', filter: `poll_id=eq.${pollId}` },
      (payload) => setVotes((current) => [...current, payload.new])
    ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pollId])

  const handleVote = async (optionId: string) => {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId })
      })

      const data = await res.json()

      if (res.ok) {
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]')
        votedPolls.push(pollId)
        localStorage.setItem('votedPolls', JSON.stringify(votedPolls))
        setHasVoted(true)
      } else {
        alert(data.error || 'Vote failed')
      }
    } catch (error) {
      alert('Network error')
    }
  }

  if (loading) return <div className="max-w-md mx-auto mt-10 p-6 bg-white text-black text-center rounded-lg shadow-md border border-gray-200">Loading poll data...</div>
  if (!poll) return <div className="max-w-md mx-auto mt-10 p-6 bg-white text-black text-center rounded-lg shadow-md border border-gray-200">Poll not found.</div>

  const totalVotes = votes.length

  return (
    <main className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200 text-black">
      <h1 className="text-2xl font-bold mb-6">{poll.question}</h1>
      
      <div className="space-y-4">
        {options.map((opt) => {
          const optionVotes = votes.filter((v) => v.option_id === opt.id).length
          const percentage = totalVotes === 0 ? 0 : Math.round((optionVotes / totalVotes) * 100)

          return (
            <div key={opt.id} className="border border-gray-300 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{opt.text}</span>
                {hasVoted && <span className="text-sm font-bold text-gray-600">{percentage}% ({optionVotes})</span>}
              </div>
              
              {hasVoted ? (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                </div>
              ) : (
                <button onClick={() => handleVote(opt.id)} className="w-full bg-blue-100 text-blue-700 py-2 rounded-md hover:bg-blue-200 font-semibold transition-colors">
                  Vote
                </button>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}