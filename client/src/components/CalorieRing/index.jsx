import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import styles from './CalorieRing.module.css';

export default function CalorieRing({ eaten = 0, goal = 2000, burned = 0 }) {
  const adjustedGoal = goal + burned;
  const percentage = Math.min(100, Math.round((eaten / (adjustedGoal || 1)) * 100));

  // Determine color based on progress
  let fill = 'var(--nt-green-mid)'; // Normal
  if (percentage >= 100) {
    fill = 'var(--nt-amber-mid)'; // Warning if over goal
  }
  if (percentage > 110) {
    fill = 'var(--nt-coral-mid)'; // Danger if way over goal
  }

  const data = [
    {
      name: 'Калории',
      value: percentage,
      fill: fill,
    }
  ];

  return (
    <div className={styles.ringContainer}>
      <RadialBarChart
        width={140}
        height={140}
        cx={70}
        cy={70}
        innerRadius={50}
        outerRadius={70}
        barSize={10}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          minAngle={15}
          background={{ fill: 'var(--nt-surface2)' }}
          clockWise
          dataKey="value"
          cornerRadius={10}
        />
      </RadialBarChart>
      
      <div className={styles.ringCenter}>
        <div className={styles.eatenVal}>{eaten}</div>
        <div className={styles.goalVal}>/ {adjustedGoal} ккал</div>
        {burned > 0 && (
          <div className={styles.burnedVal}>🔥 {burned}</div>
        )}
      </div>
    </div>
  );
}
