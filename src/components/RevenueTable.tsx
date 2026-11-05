import React, { useState } from 'react';
import { RegionQuarterMatrix, SalesOrderRow } from '../types/sales';
import { formatCurrency, formatPercent } from '../utils/salesCalculator';
import { Table, ArrowUpDown, ChevronRight, ChevronDown, TrendingUp, TrendingDown, Layers, Download } from 'lucide-react';

interface RevenueTableProps {
  data: RegionQuarterMatrix;
  rawRows: SalesOrderRow[];
}

type SortField = 'region' | 'total' | 'q2q3Delta' | string;

export const RevenueTable: React.FC<RevenueTableProps> = ({ data, rawRows }) => {
  const { quarters, regions, matrix, regionTotals, quarterTotals, grandTotal } = data;
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [breakdownType, setBreakdownType] = useState<'product' | 'channel'>('product');

  const hasQ2Q3 = quarters.includes('Q2') && quarters.includes('Q3');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numbers
    }
  };

  // Sort regions
  const sortedRegions = [...regions].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortField === 'region') {
      return sortAsc ? a.localeCompare(b) : b.localeCompare(a);
    } else if (sortField === 'total') {
      valA = regionTotals[a] || 0;
      valB = regionTotals[b] || 0;
    } else if (sortField === 'q2q3Delta') {
      valA = (matrix[a]?.['Q3'] || 0) - (matrix[a]?.['Q2'] || 0);
      valB = (matrix[b]?.['Q3'] || 0) - (matrix[b]?.['Q2'] || 0);
    } else {
      // By specific quarter
      valA = matrix[a]?.[sortField] || 0;
      valB = matrix[b]?.[sortField] || 0;
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  // Calculate deep breakdown for expanded region
  const getRegionBreakdown = (regionName: string) => {
    const subset = rawRows.filter((r) => r.region === regionName);
    const groups: Record<string, { total: number; q2: number; q3: number; quarters: Record<string, number> }> = {};

    subset.forEach((row) => {
      const key = breakdownType === 'product' ? row.product : row.channel;
      if (!groups[key]) {
        groups[key] = { total: 0, q2: 0, q3: 0, quarters: {} };
      }
      groups[key].total += row.revenue;
      groups[key].quarters[row.quarter] = (groups[key].quarters[row.quarter] || 0) + row.revenue;
      if (row.quarter === 'Q2') groups[key].q2 += row.revenue;
      if (row.quarter === 'Q3') groups[key].q3 += row.revenue;
    });

    return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
  };

  const copyTableToClipboard = () => {
    const headers = ['Region', ...quarters, ...(hasQ2Q3 ? ['Q2->Q3 Delta', 'Q2->Q3 %'] : []), 'Total Revenue'];
    const rows = sortedRegions.map((r) => {
      const rowVals = [
        r,
        ...quarters.map((q) => (matrix[r]?.[q] || 0).toFixed(2)),
      ];
      if (hasQ2Q3) {
        const delta = (matrix[r]?.['Q3'] || 0) - (matrix[r]?.['Q2'] || 0);
        const q2 = matrix[r]?.['Q2'] || 0;
        const pct = q2 > 0 ? (delta / q2) * 100 : 0;
        rowVals.push(delta.toFixed(2), `${pct.toFixed(1)}%`);
      }
      rowVals.push((regionTotals[r] || 0).toFixed(2));
      return rowVals.join('\t');
    });

    const tsv = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsv);
    alert('Table data copied to clipboard as TSV format (ready to paste in Sheets or Excel)!');
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Table className="w-5 h-5" />
            </span>
            <h3 className="text-base font-semibold text-slate-900">Regional Revenue Matrix</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pivot view comparing quarterly revenue, totals, and Q2-to-Q3 performance per region
          </p>
        </div>

        <button
          type="button"
          onClick={copyTableToClipboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Copy table data for Excel or Google Sheets"
        >
          <Download className="w-3.5 h-3.5" />
          Copy Table (TSV)
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-[11px] font-semibold uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('region')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors w-48"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {quarters.map((quarter) => (
                <th
                  key={quarter}
                  onClick={() => handleSort(quarter)}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/80 transition-colors font-mono"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{quarter}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}

              {hasQ2Q3 && (
                <th
                  onClick={() => handleSort('q2q3Delta')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/80 transition-colors bg-rose-50/40 border-l border-rose-100/80"
                >
                  <div className="flex items-center justify-end gap-1 text-rose-800">
                    <span>Q2 → Q3 Shift</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
              )}

              <th
                onClick={() => handleSort('total')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors font-semibold"
              >
                <div className="flex items-center justify-end gap-1 text-slate-900">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedRegions.map((region) => {
              const q2Rev = matrix[region]?.['Q2'] || 0;
              const q3Rev = matrix[region]?.['Q3'] || 0;
              const q2q3Delta = q3Rev - q2Rev;
              const q2q3Pct = q2Rev > 0 ? (q2q3Delta / q2Rev) * 100 : 0;
              const isExpanded = expandedRegion === region;

              return (
                <React.Fragment key={region}>
                  <tr className={`hover:bg-indigo-50/30 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={() => setExpandedRegion(isExpanded ? null : region)}
                        className="inline-flex items-center gap-1.5 text-left font-medium text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer group"
                      >
                        <span className="p-0.5 rounded text-slate-400 group-hover:text-indigo-600">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </span>
                        {region}
                      </button>
                    </td>

                    {quarters.map((quarter) => {
                      const rev = matrix[region]?.[quarter] || 0;
                      return (
                        <td key={quarter} className="py-3 px-3 text-right font-mono text-slate-700">
                          {rev > 0 ? formatCurrency(rev) : <span className="text-slate-300">-</span>}
                        </td>
                      );
                    })}

                    {hasQ2Q3 && (
                      <td className="py-3 px-3 text-right font-mono border-l border-slate-100">
                        <div className="flex items-center justify-end gap-1.5">
                          {q2q3Delta >= 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-emerald-200/50">
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              +{formatCurrency(q2q3Delta)} ({formatPercent(q2q3Pct)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-rose-200/50">
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                              {formatCurrency(q2q3Delta)} ({formatPercent(q2q3Pct)})
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(regionTotals[region] || 0)}
                    </td>
                  </tr>

                  {/* Expanded Sub-Breakdown Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={quarters.length + (hasQ2Q3 ? 2 : 1) + 1} className="p-4">
                        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-xs">
                                {region} Drilldown:
                              </span>
                              <div className="inline-flex rounded-md p-0.5 bg-slate-100 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => setBreakdownType('product')}
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    breakdownType === 'product' ? 'bg-white font-medium text-indigo-700 shadow-xs' : 'text-slate-600'
                                  }`}
                                >
                                  By Product
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBreakdownType('channel')}
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    breakdownType === 'channel' ? 'bg-white font-medium text-indigo-700 shadow-xs' : 'text-slate-600'
                                  }`}
                                >
                                  By Channel
                                </button>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Individual product & channel contributions
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {getRegionBreakdown(region).map(([item, itemStats]) => {
                              const delta = itemStats.q3 - itemStats.q2;
                              return (
                                <div key={item} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                                  <div className="font-semibold text-slate-800 text-xs truncate" title={item}>
                                    {item}
                                  </div>
                                  <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-[11px] text-slate-500">Total Rev:</span>
                                    <span className="font-mono text-xs font-medium text-slate-900">
                                      {formatCurrency(itemStats.total)}
                                    </span>
                                  </div>
                                  {hasQ2Q3 && (
                                    <div className="mt-1 flex items-baseline justify-between text-[11px]">
                                      <span className="text-slate-500">Q2 &rarr; Q3:</span>
                                      <span
                                        className={`font-mono font-semibold ${
                                          delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                      >
                                        {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Grand Totals Footer */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
              <td className="py-3 px-4 uppercase text-[11px] tracking-wider text-slate-700">
                Total (All Regions)
              </td>
              {quarters.map((quarter) => (
                <td key={quarter} className="py-3 px-3 text-right font-mono text-indigo-900">
                  {formatCurrency(quarterTotals[quarter] || 0)}
                </td>
              ))}
              {hasQ2Q3 && (() => {
                const totalQ2 = quarterTotals['Q2'] || 0;
                const totalQ3 = quarterTotals['Q3'] || 0;
                const totalDelta = totalQ3 - totalQ2;
                const totalPct = totalQ2 > 0 ? (totalDelta / totalQ2) * 100 : 0;
                return (
                  <td className="py-3 px-3 text-right font-mono border-l border-slate-200">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                        totalDelta >= 0 ? 'text-emerald-700 bg-emerald-100/70' : 'text-rose-700 bg-rose-100/70'
                      }`}
                    >
                      {totalDelta >= 0 ? '+' : ''}{formatCurrency(totalDelta)} ({formatPercent(totalPct)})
                    </span>
                  </td>
                );
              })()}
              <td className="py-3 px-4 text-right font-mono text-sm text-indigo-700 font-extrabold">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
