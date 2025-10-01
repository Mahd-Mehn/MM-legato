'use client'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { DailyEarning } from '@/types/analytics'
import { format, parseISO } from 'date-fns'

interface EarningsChartProps {
  data: DailyEarning[]
}

export function EarningsChart({ data }: EarningsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
        No earnings data available
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd'),
    fullDate: item.date
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {format(parseISO(data.fullDate), 'MMMM dd, yyyy')}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Earnings: {payload[0].value} coins
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          <XAxis 
            dataKey="formattedDate"
            className="text-xs fill-slate-500 dark:fill-slate-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs fill-slate-500 dark:fill-slate-400"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#earningsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}