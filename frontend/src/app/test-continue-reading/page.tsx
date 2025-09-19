'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function TestContinueReadingPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createTestProgress = async () => {
    setLoading(true)
    try {
      const response = await api.post('/api/v1/reading/debug/create-test-progress')
      setResult(response.data)
    } catch (error) {
      console.error('Error creating test progress:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkProgress = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/reading/debug/simple-progress')
      setResult(response.data)
    } catch (error) {
      console.error('Error checking progress:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkContinueReading = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/reading/continue-reading?limit=5')
      setResult(response.data)
    } catch (error) {
      console.error('Error checking continue reading:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkBooks = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/reading/debug/books')
      setResult(response.data)
    } catch (error) {
      console.error('Error checking books:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Continue Reading</h1>
      
      <div className="space-y-4">
        <button
          onClick={createTestProgress}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Create Test Progress'}
        </button>
        
        <button
          onClick={checkProgress}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Loading...' : 'Check Progress'}
        </button>
        
        <button
          onClick={checkContinueReading}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Loading...' : 'Check Continue Reading'}
        </button>
        
        <button
          onClick={checkBooks}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Loading...' : 'Check Books'}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}