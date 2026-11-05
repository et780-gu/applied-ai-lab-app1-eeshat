/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CsvUploader } from './components/CsvUploader';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { AISummaryCard } from './components/AISummaryCard';
import { parseSalesCsv } from './utils/csvParser';
import { SAMPLE_SALES_CSV } from './utils/sampleData';
import { calculateRegionQuarterMatrix, analyzeQ2Q3, formatCurrency } from './utils/salesCalculator';
import { SalesOrderRow } from './types/sales';
import {
  TrendingUp,
  DollarSign,
  Globe2,
  Calendar,
  Sparkles,
  BarChart2,
  FileSpreadsheet,
} from 'lucide-react';

export default function App() {
  // Initialize with the sample dataset so the user has immediate insights
  const initialData = useMemo(() => {
    const res = parseSalesCsv(SAMPLE_SALES_CSV);
    return res.data;
  }, []);

  const [salesData, setSalesData] = useState<SalesOrderRow[]>(initialData);
  const [fileName, setFileName] = useState<string>('sales_orders_q1_q4_sample.csv');

  // Compute calculated matrix & Q2-Q3 shift analysis
  const matrixData = useMemo(() => {
    return calculateRegionQuarterMatrix(salesData);
  }, [salesData]);

  const q2q3Analysis = useMemo(() => {
    return analyzeQ2Q3(salesData);
  }, [salesData]);

  const handleDataLoaded = (data: SalesOrderRow[], newFileName: string) => {
    setSalesData(data);
    setFileName(newFileName);
  };

  const topRegion = matrixData.regions[0] || 'N/A';
  const topRegionRevenue = matrixData.regionTotals[topRegion] || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Sales Regional Intelligence
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Q2 &rarr; Q3 AI Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Quarterly sales breakdown, pivot analytics & strict 3-sentence AI driver summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-[11px]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              {salesData.length} records
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Total Revenue</div>
              <div className="text-lg font-bold text-slate-900 font-mono">
                {formatCurrency(matrixData.grandTotal)}
              </div>
              <div className="text-[11px] text-slate-400">{matrixData.quarters.length} Quarters Aggregated</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Top Revenue Region</div>
              <div className="text-lg font-bold text-slate-900 truncate max-w-[150px]">{topRegion}</div>
              <div className="text-[11px] text-slate-400 font-mono">{formatCurrency(topRegionRevenue)} total</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Largest Q2 &rarr; Q3 Shift</div>
              <div className="text-lg font-bold text-slate-900 truncate max-w-[150px]">
                {q2q3Analysis.topRegionByDollar?.name || 'N/A'}
              </div>
              <div className="text-[11px] font-mono font-medium text-rose-600">
                {q2q3Analysis.topRegionByDollar
                  ? `${q2q3Analysis.topRegionByDollar.dollarChange >= 0 ? '+' : ''}${formatCurrency(q2q3Analysis.topRegionByDollar.dollarChange)} (${(q2q3Analysis.topRegionByDollar.percentChange).toFixed(1)}%)`
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Quarters & Regions</div>
              <div className="text-lg font-bold text-slate-900">
                {matrixData.regions.length} Regions &bull; {matrixData.quarters.length} Qtrs
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {matrixData.quarters.join(', ')}
              </div>
            </div>
          </div>
        </section>

        {/* 1. CSV Upload Section */}
        <section>
          <CsvUploader
            onDataLoaded={handleDataLoaded}
            currentData={salesData}
            currentFileName={fileName}
          />
        </section>

        {/* 2. Executive AI 3-Sentence Summary Section */}
        <section>
          <AISummaryCard analysis={q2q3Analysis} />
        </section>

        {/* 3. Total Revenue by Region and Quarter - Chart Section */}
        <section>
          <RevenueChart data={matrixData} />
        </section>

        {/* 4. Total Revenue by Region and Quarter - Table Section */}
        <section>
          <RevenueTable data={matrixData} rawRows={salesData} />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Sales Regional Intelligence &bull; Quantitative Q2 to Q3 Analytics</p>
          <p className="text-[11px]">Strict 3-Sentence Verification &bull; Certified App Calculations</p>
        </div>
      </footer>
    </div>
  );
}
