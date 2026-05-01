import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

export function StockChart({ data, height = 300 }) {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const handleResize = () => {
      if (chartContainerRef.current) {
         chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#94a3b8',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.5)' },
        horzLines: { color: 'rgba(51, 65, 85, 0.5)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Ensure data is sorted and cleaned
    const cleanedData = [...data]
      .sort((a, b) => {
        const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time * 1000;
        const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time * 1000;
        return timeA - timeB;
      })
      .map(item => {
        // If time is a UNIX timestamp (seconds), convert it to YYYY-MM-DD string to avoid timezone/midnight strictness issues in lightweight-charts for daily data
        let formattedTime = item.time;
        if (typeof item.time === 'number') {
            const d = new Date(item.time * 1000);
            formattedTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return {
          time: formattedTime,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        };
      });

    // Deduplicate exact timestamps
    const uniqueData = cleanedData.filter((v,i,a)=>a.findIndex(v2=>(v2.time===v.time))===i);

    series.setData(uniqueData);
    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height]);

  if (!data || data.length === 0) {
      return <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>Loading chart data...</div>;
  }

  return <div ref={chartContainerRef} className="w-full relative" style={{ height }} />;
}
