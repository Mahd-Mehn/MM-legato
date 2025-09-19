'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function ReadingTest() {
  const [bookId, setBookId] = useState('')
  const [chapterId, setChapterId] = useState('')

  const handleTestReading = () => {
    if (bookId && chapterId) {
      window.open(`/reading/${bookId}/${chapterId}`, '_blank')
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Test Reading Interface</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Book ID</label>
          <Input
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            placeholder="Enter book ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chapter ID</label>
          <Input
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            placeholder="Enter chapter ID"
          />
        </div>
        <Button 
          onClick={handleTestReading}
          disabled={!bookId || !chapterId}
          className="w-full"
        >
          Test Reading Interface
        </Button>
      </div>
    </Card>
  )
}