'use client';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function PriceChart({ data, coinName, color = '#00e5ff', height = 200 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;

    const labels = data.map(d => {
      const date = new Date(d.recordedAt || d.time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const prices = data.map(d => parseFloat(d.price));

    const isUp = prices.length > 1 && prices[prices.length - 1] >= prices[0];
    const lineColor = isUp ? '#00e676' : '#ff1744';
    const fillColor = isUp ? 'rgba(0,230,118,0.08)' : 'rgba(255,23,68,0.08)';

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: coinName || 'Price',
          data: prices,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1423',
            borderColor: '#1e2a3a',
            borderWidth: 1,
            titleColor: '#8899bb',
            bodyColor: '#e8f0fe',
            callbacks: {
              label: (ctx) => ` PKR ${parseFloat(ctx.raw).toFixed(8)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#1e2a3a', drawTicks: false },
            ticks: {
              color: '#4a5568',
              maxTicksLimit: 6,
              font: { size: 10, family: 'JetBrains Mono' },
            },
          },
          y: {
            grid: { color: '#1e2a3a', drawTicks: false },
            ticks: {
              color: '#4a5568',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (v) => `${v.toFixed(4)}`,
            },
          },
        },
        interaction: { mode: 'index', intersect: false },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data, coinName, color]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
