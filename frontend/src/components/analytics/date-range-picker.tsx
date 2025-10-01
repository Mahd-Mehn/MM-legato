'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from '@/types/analytics'
import { CalendarIcon } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presets = [
    {
      label: 'Last 7 days',
      range: {
        startDate: subDays(new Date(), 7),
        endDate: new Date()
      }
    },
    {
      label: 'Last 30 days',
      range: {
        startDate: subDays(new Date(), 30),
        endDate: new Date()
      }
    },
    {
      label: 'This month',
      range: {
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
      }
    },
    {
      label: 'All time',
      range: {
        startDate: null,
        endDate: null
      }
    }
  ]

  const formatDateRange = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return 'All time'
    }
    if (dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, 'MMM dd')} - ${format(dateRange.endDate, 'MMM dd')}`
    }
    if (dateRange.startDate) {
      return `From ${format(dateRange.startDate, 'MMM dd')}`
    }
    if (dateRange.endDate) {
      return `Until ${format(dateRange.endDate, 'MMM dd')}`
    }
    return 'Select dates'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !dateRange.startDate && !dateRange.endDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-slate-200 dark:border-slate-700">
            <div className="p-3">
              <h4 className="text-sm font-medium mb-2">Presets</h4>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      onDateRangeChange(preset.range)
                      setIsOpen(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.startDate || undefined,
                to: dateRange.endDate || undefined
              }}
              onSelect={(range) => {
                onDateRangeChange({
                  startDate: range?.from || null,
                  endDate: range?.to || null
                })
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}