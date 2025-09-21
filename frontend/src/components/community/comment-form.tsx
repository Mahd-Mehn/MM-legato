'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useCreateComment } from '@/hooks/useComments'
import { Loader2, Send } from 'lucide-react'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentFormProps {
  chapterId: string
  parentId?: string
  placeholder?: string
  onSuccess?: () => void
  onCancel?: () => void
  showCancel?: boolean
}

export function CommentForm({ 
  chapterId, 
  parentId, 
  placeholder = "Write a comment...",
  onSuccess,
  onCancel,
  showCancel = false
}: CommentFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const createComment = useCreateComment()

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  })

  const onSubmit = async (data: CommentFormData) => {
    try {
      await createComment.mutateAsync({
        chapter_id: chapterId,
        content: data.content,
        parent_id: parentId,
      })
      
      form.reset()
      setIsExpanded(false)
      onSuccess?.()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsExpanded(false)
    onCancel?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={placeholder}
                  className="min-h-[80px] resize-none"
                  onFocus={() => setIsExpanded(true)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {(isExpanded || showCancel) && (
          <div className="flex items-center gap-2 justify-end">
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={createComment.isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={createComment.isPending || !form.watch('content').trim()}
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  {parentId ? 'Reply' : 'Comment'}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}