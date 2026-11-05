import React, { useState, useId } from 'react';
import { RegionQuarterMatrix } from '../types/sales';
import { formatCurrency, formatPercent } from '../utils/salesCalculator';
import { BarChart3, Layers, GitCompare, HelpCircle } from 'lucide-react';

interface RevenueChartProps {
  data: RegionQuarterMatrix;
}

const QUARTER_COLORS: Record<string, { fill: string; stroke: string; labelBg: string }> = {
  Q1: { fill: '#6366f1', stroke: '#4f46e5', labelBg: 'bg-indigo-500' },
  Q2: { fill: '#f59e0b', stroke: '#d97706', labelBg: 'bg-amber-500' },
  Q3: { fill: '#f43f5e', stroke: '#e11d48', labelBg: 'bg-rose-500' },
  Q4: { fill: '#10b981', stroke: '#059669', labelBg: 'bg-emerald-500' },
};

const REGION_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartId = useId();
  const [viewMode, setViewMode] = useState<'byRegion' | 'byQuarter' | 'q2q3Compare'>('byRegion');
  const [hoveredBar, setHoveredBar] = useState<{
    group: string;
    subItem: string;
    revenue: number;
    sharePct?: number;
    x: number;
    y: number;
  } | null>(null);

  const { quarters, regions, matrix, regionTotals, grandTotal } = data;

  if (regions.length === 0 || quarters.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No revenue data available to chart.</p>
      </div>
    );
  }

  // Find max values for proper scaling
  let maxBarValue = 0;
  if (viewMode === 'byRegion') {
    regions.forEach((r) => {
      quarters.forEach((q) => {
        const val = matrix[r]?.[q] || 0;
        if (val > maxBarValue) maxBarValue = val;
      });
    });
  } else if (viewMode === 'byQuarter') {
    quarters.forEach((q) => {
      regions.forEach((r) => {
        const val = matrix[r]?.[q] || 0;
        if (val > maxBarValue) maxBarValue = val;
      });
    });
  } else {
    // Q2 vs Q3
    regions.forEach((r) => {
      const q2 = matrix[r]?.['Q2'] || 0;
      const q3 = matrix[r]?.['Q3'] || 0;
      if (q2 > maxBarValue) maxBarValue = q2;
      if (q3 > maxBarValue) maxBarValue = q3;
    });
  }

  if (maxBarValue <= 0) maxBarValue = 1000;
  // Round maxBarValue up to clean upper bound
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxBarValue)));
  const yAxisMax = Math.ceil((maxBarValue * 1.15) / magnitude) * magnitude;
  const yTicks = [0, yAxisMax * 0.25, yAxisMax * 0.5, yAxisMax * 0.75, yAxisMax];

  // SVG dimensions
  const svgWidth = 860;
  const svgHeight = 360;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 60;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    return paddingTop + plotHeight - (val / yAxisMax) * plotHeight;
  };

  const hasQ2Q3 = quarters.includes('Q2') && quarters.includes('Q3');

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-base font-semibold text-slate-900">Total Revenue by Region & Quarter</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated order revenue across all {regions.length} regions and {quarters.length} quarters
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setViewMode('byRegion')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'byRegion'
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Group by Region
          </button>
          <button
            type="button"
            onClick={() => setViewMode('byQuarter')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'byQuarter'
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Group by Quarter
          </button>
          {hasQ2Q3 && (
            <button
              type="button"
              onClick={() => setViewMode('q2q3Compare')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'q2q3Compare'
                  ? 'bg-white text-rose-600 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Q2 vs Q3 Focus
            </button>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-1 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Legend:</span>
          {viewMode === 'byRegion' &&
            quarters.map((q) => {
              const color = QUARTER_COLORS[q] || { fill: '#94a3b8', stroke: '#64748b', labelBg: 'bg-slate-400' };
              return (
                <div key={q} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: color.fill }} />
                  <span className="font-medium text-slate-700">{q}</span>
                </div>
              );
            })}
          {viewMode === 'byQuarter' &&
            regions.map((r, i) => {
              const color = REGION_PALETTE[i % REGION_PALETTE.length];
              return (
                <div key={r} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: color }} />
                  <span className="font-medium text-slate-700">{r}</span>
                </div>
              );
            })}
          {viewMode === 'q2q3Compare' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500" />
                <span className="font-medium text-slate-700">Q2 Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500" />
                <span className="font-medium text-slate-700">Q3 Revenue</span>
              </div>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Hover over any bar to view exact revenue & share
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-x-auto w-full pt-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[700px] h-auto select-none"
        >
          {/* Subtle horizontal grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? undefined : '3,3'}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-mono"
                >
                  {formatCurrency(tick)}
                </text>
              </g>
            );
          })}

          {/* Baseline axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* MODE 1: Grouped by Region */}
          {viewMode === 'byRegion' && (() => {
            const groupWidth = plotWidth / regions.length;
            const innerPadding = groupWidth * 0.15;
            const barGroupWidth = groupWidth - innerPadding * 2;
            const barWidth = Math.min(28, barGroupWidth / quarters.length);
            const totalBarsWidth = barWidth * quarters.length;
            const startOffset = (groupWidth - totalBarsWidth) / 2;

            return regions.map((region, rIdx) => {
              const groupX = paddingLeft + rIdx * groupWidth;
              const regionTotal = regionTotals[region] || 0;

              return (
                <g key={region}>
                  {quarters.map((quarter, qIdx) => {
                    const revenue = matrix[region]?.[quarter] || 0;
                    const barHeight = (revenue / yAxisMax) * plotHeight;
                    const barX = groupX + startOffset + qIdx * barWidth;
                    const barY = paddingTop + plotHeight - barHeight;
                    const color = QUARTER_COLORS[quarter] || { fill: '#64748b', stroke: '#475569' };

                    return (
                      <g key={quarter}>
                        <rect
                          x={barX}
                          y={barY}
                          width={Math.max(2, barWidth - 3)}
                          height={Math.max(0, barHeight)}
                          fill={color.fill}
                          rx={3}
                          className="transition-opacity hover:opacity-85 cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBar({
                              group: region,
                              subItem: quarter,
                              revenue,
                              sharePct: regionTotal > 0 ? (revenue / regionTotal) * 100 : 0,
                              x: barX + barWidth / 2,
                              y: barY,
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      </g>
                    );
                  })}

                  {/* Region X-axis label */}
                  <text
                    x={groupX + groupWidth / 2}
                    y={paddingTop + plotHeight + 22}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-slate-700"
                  >
                    {region}
                  </text>
                  <text
                    x={groupX + groupWidth / 2}
                    y={paddingTop + plotHeight + 38}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    Tot: {formatCurrency(regionTotal)}
                  </text>
                </g>
              );
            });
          })()}

          {/* MODE 2: Grouped by Quarter */}
          {viewMode === 'byQuarter' && (() => {
            const groupWidth = plotWidth / quarters.length;
            const innerPadding = groupWidth * 0.15;
            const barGroupWidth = groupWidth - innerPadding * 2;
            const barWidth = Math.min(26, barGroupWidth / regions.length);
            const totalBarsWidth = barWidth * regions.length;
            const startOffset = (groupWidth - totalBarsWidth) / 2;

            return quarters.map((quarter, qIdx) => {
              const groupX = paddingLeft + qIdx * groupWidth;
              const quarterTotal = data.quarterTotals[quarter] || 0;

              return (
                <g key={quarter}>
                  {regions.map((region, rIdx) => {
                    const revenue = matrix[region]?.[quarter] || 0;
                    const barHeight = (revenue / yAxisMax) * plotHeight;
                    const barX = groupX + startOffset + rIdx * barWidth;
                    const barY = paddingTop + plotHeight - barHeight;
                    const color = REGION_PALETTE[rIdx % REGION_PALETTE.length];

                    return (
                      <rect
                        key={region}
                        x={barX}
                        y={barY}
                        width={Math.max(2, barWidth - 3)}
                        height={Math.max(0, barHeight)}
                        fill={color}
                        rx={3}
                        className="transition-opacity hover:opacity-85 cursor-pointer"
                        onMouseEnter={() => {
                          setHoveredBar({
                            group: quarter,
                            subItem: region,
                            revenue,
                            sharePct: quarterTotal > 0 ? (revenue / quarterTotal) * 100 : 0,
                            x: barX + barWidth / 2,
                            y: barY,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    );
                  })}

                  <text
                    x={groupX + groupWidth / 2}
                    y={paddingTop + plotHeight + 22}
                    textAnchor="middle"
                    className="text-xs font-bold fill-slate-800"
                  >
                    {quarter}
                  </text>
                  <text
                    x={groupX + groupWidth / 2}
                    y={paddingTop + plotHeight + 38}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    Sum: {formatCurrency(quarterTotal)}
                  </text>
                </g>
              );
            });
          })()}

          {/* MODE 3: Q2 vs Q3 Focus Spotlight */}
          {viewMode === 'q2q3Compare' && (() => {
            const groupWidth = plotWidth / regions.length;
            const barWidth = Math.min(36, groupWidth * 0.32);
            const gap = 6;

            return regions.map((region, rIdx) => {
              const groupX = paddingLeft + rIdx * groupWidth;
              const q2Rev = matrix[region]?.['Q2'] || 0;
              const q3Rev = matrix[region]?.['Q3'] || 0;
              const delta = q3Rev - q2Rev;
              const pct = q2Rev > 0 ? (delta / q2Rev) * 100 : 0;

              const q2Height = (q2Rev / yAxisMax) * plotHeight;
              const q3Height = (q3Rev / yAxisMax) * plotHeight;

              const center = groupX + groupWidth / 2;
              const q2X = center - barWidth - gap / 2;
              const q3X = center + gap / 2;

              const q2Y = paddingTop + plotHeight - q2Height;
              const q3Y = paddingTop + plotHeight - q3Height;

              return (
                <g key={region}>
                  {/* Q2 Bar */}
                  <rect
                    x={q2X}
                    y={q2Y}
                    width={barWidth}
                    height={Math.max(0, q2Height)}
                    fill="#f59e0b"
                    rx={3}
                    className="transition-opacity hover:opacity-85 cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredBar({
                        group: region,
                        subItem: 'Q2',
                        revenue: q2Rev,
                        x: q2X + barWidth / 2,
                        y: q2Y,
                      })
                    }
                    onMouseLeave={() => setHoveredBar(null)}
                  />

                  {/* Q3 Bar */}
                  <rect
                    x={q3X}
                    y={q3Y}
                    width={barWidth}
                    height={Math.max(0, q3Height)}
                    fill="#f43f5e"
                    rx={3}
                    className="transition-opacity hover:opacity-85 cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredBar({
                        group: region,
                        subItem: 'Q3',
                        revenue: q3Rev,
                        x: q3X + barWidth / 2,
                        y: q3Y,
                      })
                    }
                    onMouseLeave={() => setHoveredBar(null)}
                  />

                  {/* Trend Indicator Pill above bars */}
                  <g transform={`translate(${center}, ${Math.min(q2Y, q3Y) - 14})`}>
                    <rect
                      x={-34}
                      y={-10}
                      width={68}
                      height={18}
                      rx={9}
                      fill={delta >= 0 ? '#ecfdf5' : '#fff1f2'}
                      stroke={delta >= 0 ? '#10b981' : '#f43f5e'}
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${delta >= 0 ? 'fill-emerald-700' : 'fill-rose-700'}`}
                    >
                      {formatPercent(pct)}
                    </text>
                  </g>

                  {/* Region Label */}
                  <text
                    x={center}
                    y={paddingTop + plotHeight + 22}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-slate-800"
                  >
                    {region}
                  </text>
                  <text
                    x={center}
                    y={paddingTop + plotHeight + 38}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-medium ${delta >= 0 ? 'fill-emerald-600' : 'fill-rose-600'}`}
                  >
                    {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                  </text>
                </g>
              );
            });
          })()}
        </svg>

        {/* Floating Tooltip */}
        {hoveredBar && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(hoveredBar.x / svgWidth) * 100}%`,
              top: `${(hoveredBar.y / svgHeight) * 100}%`,
            }}
          >
            <div className="font-semibold text-slate-200">
              {hoveredBar.group} &bull; {hoveredBar.subItem}
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {formatCurrency(hoveredBar.revenue)}
            </div>
            {hoveredBar.sharePct !== undefined && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {hoveredBar.sharePct.toFixed(1)}% of {hoveredBar.group} total
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
