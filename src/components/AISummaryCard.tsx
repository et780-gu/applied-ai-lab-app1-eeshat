import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, RefreshCw, Copy, Check, ShieldCheck, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Q2Q3Analysis } from '../types/sales';
import { formatCurrencyDetailed, formatPercent } from '../utils/salesCalculator';

interface AISummaryCardProps {
  analysis: Q2Q3Analysis;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ analysis }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [highlightNumbers, setHighlightNumbers] = useState(true);

  const { topRegionByDollar, totalCompany, allRegionsRanked, hasQ2, hasQ3 } = analysis;

  const fetchSummary = async () => {
    if (!topRegionByDollar || !hasQ2 || !hasQ3) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        topRegion: topRegionByDollar,
        totalCompany,
        allRegionsRanked,
      };

      const res = await fetch('/api/analyze-q2-q3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.summary || '');
      setSentences(data.sentences || []);
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setError(err?.message || 'Could not connect to analysis service.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when top region changes
  useEffect(() => {
    if (topRegionByDollar && hasQ2 && hasQ3) {
      fetchSummary();
    }
  }, [topRegionByDollar?.name, topRegionByDollar?.dollarChange, hasQ2, hasQ3]);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to highlight calculated numbers in text
  const renderHighlightedText = (text: string) => {
    if (!highlightNumbers) return text;

    // Regex matching currency ($123,456.78), percentages (15.5%, +20%), units (e.g. 150 units), quarters (Q2, Q3)
    const regex = /(\$[0-9,]+(?:\.[0-9]{2})?|[+-]?[0-9]+(?:\.[0-9]+)?%|\bQ[1-4]\b|[0-9,]+\s+(?:units|orders))/gi;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <span
            key={i}
            className="px-1 py-0.5 mx-0.5 rounded bg-indigo-50 text-indigo-900 font-mono font-semibold text-[13px] border border-indigo-200/70"
            title="App-calculated verified figure"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!hasQ2 || !hasQ3) {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-amber-800 text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Q2 and Q3 Data Required for Comparison</span>
        </div>
        <p className="mt-1 text-amber-700">
          The uploaded dataset does not contain both Q2 and Q3 records. Please upload a dataset with Q2 and Q3 to generate the 3-sentence regional shift summary.
        </p>
      </div>
    );
  }

  if (!topRegionByDollar) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-lg border border-indigo-800/50 p-6 transition-all relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </span>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Executive AI Summary: Q2 to Q3 Shift
            </h3>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1">
            Strict 3-sentence synthesis answering which region changed most and why, using only app-calculated figures
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setHighlightNumbers(!highlightNumbers)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              highlightNumbers
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-indigo-900/60 text-indigo-200 border-indigo-700 hover:bg-indigo-800/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Highlight Numbers
          </button>

          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-200 bg-indigo-900/60 hover:bg-indigo-800/80 rounded-lg border border-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Regenerate summary with AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!summary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Copy 3-sentence summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative z-10 mt-5">
        {loading ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-indigo-300 text-xs animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing calculated Q2 to Q3 statistics with Gemini...</span>
            </div>
            <div className="h-4 bg-indigo-900/60 rounded-md w-full animate-pulse" />
            <div className="h-4 bg-indigo-900/50 rounded-md w-5/6 animate-pulse" />
            <div className="h-4 bg-indigo-900/40 rounded-md w-4/6 animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200 text-xs">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Error generating summary</span>
            </div>
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchSummary}
              className="mt-3 px-3 py-1 bg-rose-800/80 hover:bg-rose-700 rounded text-white text-xs font-medium cursor-pointer"
            >
              Retry Analysis
            </button>
          </div>
        ) : summary ? (
          <div>
            {/* The 3-Sentence Summary Content */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-900/80 text-slate-100 text-sm leading-relaxed space-y-2">
              {sentences.length === 3 ? (
                sentences.map((sent, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-slate-200">{renderHighlightedText(sent)}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-200">{renderHighlightedText(summary)}</p>
              )}
            </div>

            {/* Validation Badges */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Strict 3-Sentence Format Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-medium text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  100% Calculated Figures
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAudit(!showAudit)}
                className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showAudit ? 'Hide Calculated Data Proof' : 'View Calculated Data Proof'}</span>
                {showAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : null}

        {/* Calculated Numbers Audit Drawer */}
        {showAudit && topRegionByDollar && (
          <div className="mt-4 pt-4 border-t border-indigo-900/60 text-xs animate-fadeIn">
            <div className="font-semibold text-indigo-200 mb-2 flex items-center gap-1.5">
              <span>App Calculated Metrics Feeding the AI (Ground Truth):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-300">
              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40">
                <div className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Top Changed Region</div>
                <div className="text-base font-bold text-white mt-1">{topRegionByDollar.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Absolute Delta: {topRegionByDollar.dollarChange >= 0 ? '+' : ''}
                  {formatCurrencyDetailed(topRegionByDollar.dollarChange)} ({formatPercent(topRegionByDollar.percentChange)})
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40">
                <div className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Q2 &rarr; Q3 Baseline</div>
                <div className="mt-1 font-mono text-xs">
                  <div>Q2 Rev: <span className="font-bold text-white">{formatCurrencyDetailed(topRegionByDollar.q2Revenue)}</span></div>
                  <div>Q3 Rev: <span className="font-bold text-white">{formatCurrencyDetailed(topRegionByDollar.q3Revenue)}</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40">
                <div className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Volume & Discounts</div>
                <div className="mt-1 font-mono text-xs">
                  <div>Units: <span className="font-bold text-white">{topRegionByDollar.q2Units.toLocaleString()} &rarr; {topRegionByDollar.q3Units.toLocaleString()}</span> ({topRegionByDollar.unitDelta >= 0 ? '+' : ''}{topRegionByDollar.unitDelta})</div>
                  <div>Discount: <span className="font-bold text-white">{(topRegionByDollar.q2AvgDiscountPct * 100).toFixed(1)}% &rarr; {(topRegionByDollar.q3AvgDiscountPct * 100).toFixed(1)}%</span></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40">
                <div className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Total Company Q2 &rarr; Q3</div>
                <div className="mt-1 font-mono text-xs">
                  <div>Q2: <span className="font-bold text-white">{formatCurrencyDetailed(totalCompany.q2Revenue)}</span></div>
                  <div>Q3: <span className="font-bold text-white">{formatCurrencyDetailed(totalCompany.q3Revenue)}</span></div>
                  <div>Shift: <span className="font-bold text-indigo-300">{totalCompany.dollarChange >= 0 ? '+' : ''}{formatCurrencyDetailed(totalCompany.dollarChange)}</span></div>
                </div>
              </div>
            </div>

            {/* Top Product Driver breakdown */}
            {topRegionByDollar.topProductDrivers.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40">
                <div className="text-[11px] font-semibold text-indigo-300 mb-1.5">
                  Calculated Product Drivers in {topRegionByDollar.name}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {topRegionByDollar.topProductDrivers.map((p) => (
                    <div key={p.product} className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded px-2">
                      <span className="text-slate-300 truncate">{p.product}</span>
                      <span className={p.deltaRevenue >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {p.deltaRevenue >= 0 ? '+' : ''}{formatCurrencyDetailed(p.deltaRevenue)} ({p.q2Units} &rarr; {p.q3Units} units)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
