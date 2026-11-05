import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Table } from 'lucide-react';
import { parseSalesCsv } from '../utils/csvParser';
import { SAMPLE_SALES_CSV, downloadSampleCsv } from '../utils/sampleData';
import { SalesOrderRow } from '../types/sales';

interface CsvUploaderProps {
  onDataLoaded: (data: SalesOrderRow[], fileName: string) => void;
  currentData: SalesOrderRow[];
  currentFileName: string;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onDataLoaded,
  currentData,
  currentFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrors(['Please upload a valid .csv file format.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleCsvText(text, file.name);
    };
    reader.onerror = () => {
      setErrors(['Failed to read the file. Please check file permissions and try again.']);
    };
    reader.readAsText(file);
  };

  const handleCsvText = (text: string, fileName: string) => {
    const result = parseSalesCsv(text);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      setWarnings(result.warnings);
      return;
    }

    setErrors([]);
    setWarnings(result.warnings);
    onDataLoaded(result.data, fileName);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleLoadSample = () => {
    handleCsvText(SAMPLE_SALES_CSV, 'sales_orders_q1_q4_sample.csv');
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Sales Orders CSV Upload</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Required columns: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">quarter, region, channel, product, units, discount_pct, revenue</code>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-lg transition-colors cursor-pointer"
            title="Load ready-to-analyze sample dataset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Load Sample Dataset
          </button>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            title="Download CSV format template"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop your sales orders CSV
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Supports CSV files up to 10MB</p>
          </div>
        </div>
      </div>

      {/* Errors & Warnings */}
      {errors.length > 0 && (
        <div className="mt-4 p-3.5 bg-rose-50/90 border border-rose-200 rounded-lg text-rose-800 text-xs">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Could not process CSV</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <div className="font-semibold mb-1">Formatting Notices:</div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700 pl-1">
            {warnings.slice(0, 3).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {warnings.length > 3 && <li>...and {warnings.length - 3} more minor notices</li>}
          </ul>
        </div>
      )}

      {/* Active File Summary Bar */}
      {currentData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-200/60">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Active Dataset Loaded
            </span>
            <span className="font-medium text-slate-800">{currentFileName}</span>
            <span className="text-slate-400">•</span>
            <span>{currentData.length.toLocaleString()} orders</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
            {isPreviewOpen ? 'Hide CSV Data Preview' : 'Show CSV Data Preview'}
            {isPreviewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Raw Data Preview Accordion */}
      {isPreviewOpen && currentData.length > 0 && (
        <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden animate-fadeIn">
          <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 border-b border-slate-200 flex justify-between items-center">
            <span>First {Math.min(currentData.length, 10)} of {currentData.length} records</span>
            <span className="text-[11px] text-slate-400">All columns mapped</span>
          </div>
          <div className="overflow-x-auto max-h-60 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100/70 text-slate-600 text-[11px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-semibold">Quarter</th>
                  <th className="px-3 py-2 font-semibold">Region</th>
                  <th className="px-3 py-2 font-semibold">Channel</th>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold text-right">Units</th>
                  <th className="px-3 py-2 font-semibold text-right">Discount %</th>
                  <th className="px-3 py-2 font-semibold text-right">Revenue ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {currentData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-1.5 font-sans font-medium text-indigo-700">{row.quarter}</td>
                    <td className="px-3 py-1.5 font-sans text-slate-800">{row.region}</td>
                    <td className="px-3 py-1.5 font-sans text-slate-600">{row.channel}</td>
                    <td className="px-3 py-1.5 font-sans text-slate-700">{row.product}</td>
                    <td className="px-3 py-1.5 text-right text-slate-800">{row.units.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-slate-600">{(row.discount_pct * 100).toFixed(1)}%</td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-900">${row.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
