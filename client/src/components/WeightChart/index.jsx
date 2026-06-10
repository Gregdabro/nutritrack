import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--nt-text3)' }}>
        Нет данных о весе
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getDate()}.${d.getMonth() + 1}`;
            }}
            stroke="var(--nt-text3)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="var(--nt-text3)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickCount={5}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '0.5px solid var(--nt-border)' }}
            labelFormatter={(label) => label}
          />
          <Line 
            type="monotone" 
            dataKey="weightKg" 
            stroke="var(--nt-text)" 
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--nt-text)' }}
            activeDot={{ r: 5 }}
            name="Вес (кг)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
