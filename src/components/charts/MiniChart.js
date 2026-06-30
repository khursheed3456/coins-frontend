'use client';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function MiniChart({ data = [], isPositive }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const color = isPositive ? '#00e676' : '#ff1744';
    const fill = isPositive ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)';

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data: data.map(d => parseFloat(d.price)),
          borderColor: color,
          backgroundColor: fill,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        animation: false,
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [data, isPositive]);

  if (!data.length) return <div className="w-24 h-10" />;

  return (
    <div style={{ width: 96, height: 40 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
