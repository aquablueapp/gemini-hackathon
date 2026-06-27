import React from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface BarDataPoint {
  name: string
  value: number
  type: 'before' | 'after'
}

interface PerformanceBarChartProps {
  data: BarDataPoint[]
}

export default function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
        No Data Available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="name" stroke="#888" />
        <YAxis stroke="#888" unit="ms" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Bar dataKey="value">
          {data.map((entry, index) => {
            const fill = entry.type === 'after' ? '#10b981' : '#6b7280'
            return <Cell key={`cell-${index}`} fill={fill} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
