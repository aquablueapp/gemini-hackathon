import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export interface PieDataPoint {
  name: string
  value: number
}

interface CategoryPieChartProps {
  data: PieDataPoint[]
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#6b7280']

interface LabelProps {
  name?: string
  percent?: number
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
        No Data Available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props: LabelProps) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ color: '#ccc' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
