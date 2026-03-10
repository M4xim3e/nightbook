'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  date: string
  livraisons: number
}

export function StockChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorLivraisons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a4731" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1a4731" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [value, 'Quantité livrée']}
          />
          <Area
            type="monotone"
            dataKey="livraisons"
            stroke="#1a4731"
            strokeWidth={2}
            fill="url(#colorLivraisons)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
