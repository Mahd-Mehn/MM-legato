'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)

  const testEndpoint = async (name: string, endpoint: string) => {
    setLoading(name)
    try {
      const response = await api.get(endpoint)
      setResults(prev=> ({ ...prev, [name]: { success: true, data: response.data } }))
    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          success: false, 
          error: error.response?.data || error.message 
        } 
      }))
    }
    setLoading(null)
  }

  const endpoints = [
    { name: 'Dashboard Stats', endpoint: '/api/v1/users/dashboard-stats' },
    { name: 'Continue Reading', endpoint: '/api/v1/library/continue-reading' },
    { name: 'Recommended Books', endpoint: '/api/v1/books/recommended' },
    { name: 'User Stories', endpoint: '/api/v1/books?author_id=me&limit=10' },
    { name: 'All Books', endpoint: '/api/v1/books?limit=5' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Endpoint Tests</h1>
      
      <div className="grid gap-4 mb-6">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.name} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{endpoint.name}</h3>
              <Button
                onClick={() => testEndpoint(endpoint.name, endpoint.endpoint)}
                disabled={loading === endpoint.name}
                size="sm"
              >
                {loading === endpoint.name ? 'Testing...' : 'Test'}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-2">{endpoint.endpoint}</p>
            
            {results[endpoint.name] && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                {results[endpoint.name].success ? (
                  <div>
                    <div className="text-green-600 font-semibold">✅ Success</div>
                    <pre className="mt-1 overflow-auto">
                      {JSON.stringify(results[endpoint.name].data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <div className="text-red-600 font-semibold">❌ Error</div>
                    <pre className="mt-1 overflow-auto">
                      {JSON.stringify(results[endpoint.name].error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button
        onClick={() => {
          endpoints.forEach(endpoint => {
            setTimeout(() => testEndpoint(endpoint.name, endpoint.endpoint), 
                     endpoints.indexOf(endpoint) * 500)
          })
        }}
        className="w-full"
        disabled={loading !== null}
      >
        Test All Endpoints
      </Button>
    </div>
  )
}