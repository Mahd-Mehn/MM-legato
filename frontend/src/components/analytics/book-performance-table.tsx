'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { BookAnalytics } from '@/types/analytics'
import { Eye, DollarSign, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'

interface BookPerformanceTableProps {
  books: BookAnalytics[]
  showPagination?: boolean
}

export function BookPerformanceTable({ books, showPagination = false }: BookPerformanceTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No book performance data available
      </div>
    )
  }

  // Sort books by views (descending)
  const sortedBooks = [...books].sort((a, b) => b.views - a.views)

  // Pagination
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBooks = showPagination 
    ? sortedBooks.slice(startIndex, endIndex)
    : sortedBooks

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book Title</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Eye className="h-4 w-4" />
                  Views
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Eye className="h-4 w-4" />
                  Unique
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  Sales
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="h-4 w-4" />
                  Earnings
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBooks.map((book) => (
              <TableRow key={book.book_id}>
                <TableCell className="font-medium">
                  <div className="max-w-[200px] truncate" title={book.title}>
                    {book.title}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {book.views.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {book.unique_viewers.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {book.purchases.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {book.earnings} coins
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedBooks.length)} of {sortedBooks.length} books
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}