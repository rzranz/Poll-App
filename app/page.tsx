'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePoll() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const validOptions = options.filter(opt => opt.trim() !== '')
    
    if (!question.trim() || validOptions.length < 2) {
      alert('Question and at least 2 valid options are required.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options: validOptions })
      })

      const data = await res.json()

      if (res.ok && data.id) {
        router.push(`/poll/${data.id}`)
      } else {
        alert(data.error || 'Failed to create poll')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200 text-black">
      <h1 className="text-2xl font-bold mb-6">Create a Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Question</label>
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
          {options.map((option, index) => (
            <input key={index} type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 mb-2" placeholder={`Option ${index + 1}`} required={index < 2} />
          ))}
          <button type="button" onClick={handleAddOption} className="text-sm text-blue-600 mt-2 font-medium">+ Add option</button>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-md disabled:bg-gray-400 font-bold">
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </main>
  )
}