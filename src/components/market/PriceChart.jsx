import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';

const RANGES = [
  { label: '1H', ms: 60 * 60 * 1000 },
  { label: '6H', ms: 6 * 60 * 60 * 1000 },
  { label: '1D', ms: 24 * 60 * 60 * 1000 },
  { label: '3D', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: 'All', ms: Infinity },
];

export function PriceChart({ priceHistory = [], yesPrice, noPrice }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const yesSeriesRef = useRef(null);
  const noSeriesRef = useRef(null);
  const [range, setRange] = useState('All');

  const filterData = useCallback(
    (data) => {
      if (range === 'All' || !data.length) return data;
      const cutoff = new Date(Date.now() - RANGES.find((r) => r.label === range).ms);
      return data.filter((d) => new Date(d.recorded_at) >= cutoff);
    },
    [range]
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#1a1d27' },
        textColor: '#9aa0b0',
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: '#242836' },
        horzLines: { color: '#242836' },
      },
      timeScale: {
        borderColor: '#2a2e3d',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2e3d',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      crosshair: {
        vertLine: { color: '#5c6370', width: 1, style: 3 },
        horzLine: { color: '#5c6370', width: 1, style: 3 },
      },
    });

    const yesSeries = chart.addAreaSeries({
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.3)',
      bottomColor: 'rgba(34, 197, 94, 0.02)',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    const noSeries = chart.addAreaSeries({
      lineColor: '#ef4444',
      topColor: 'rgba(239, 68, 68, 0.3)',
      bottomColor: 'rgba(239, 68, 68, 0.02)',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    chartRef.current = chart;
    yesSeriesRef.current = yesSeries;
    noSeriesRef.current = noSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(chartContainerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      yesSeriesRef.current = null;
      noSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!yesSeriesRef.current || !noSeriesRef.current) return;

    const filtered = filterData(priceHistory);
    const yesData = filtered.map((d) => ({
      time: new Date(d.recorded_at).getTime() / 1000,
      value: d.yes_price,
    }));
    const noData = filtered.map((d) => ({
      time: new Date(d.recorded_at).getTime() / 1000,
      value: d.no_price,
    }));

    yesSeriesRef.current.setData(yesData);
    noSeriesRef.current.setData(noData);
    chartRef.current?.timeScale().fitContent();
  }, [priceHistory, filterData]);

  if (!priceHistory.length) {
    return (
      <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-[var(--space-4)]">
        <div className="flex h-[300px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]">
          <p className="text-sm text-[var(--text-muted)]">No trades yet. Prices start at 50/50.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-[var(--space-4)]">
      <div ref={chartContainerRef} className="h-[300px] w-full" />
      <div className="flex gap-[var(--space-2)]">
        {RANGES.map((r) => (
          <button
            key={r.label}
            className={`cursor-pointer rounded-[var(--radius-sm)] border px-[var(--space-3)] py-[var(--space-1)] text-xs font-semibold transition-all duration-[var(--transition-fast)] ${
              range === r.label
                ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-muted)] text-[var(--accent-blue)]'
                : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setRange(r.label)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex justify-between font-mono text-sm font-bold">
        <span className="text-[var(--color-yes)]">YES {Math.round((yesPrice || 0.5) * 100)}c</span>
        <span className="text-[var(--color-no)]">NO {Math.round((noPrice || 0.5) * 100)}c</span>
      </div>
    </div>
  );
}
