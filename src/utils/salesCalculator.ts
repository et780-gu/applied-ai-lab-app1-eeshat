import {
  SalesOrderRow,
  RegionQuarterMatrix,
  Q2Q3Analysis,
  RegionChangeDetail,
  ProductDriver,
  ChannelDriver,
} from '../types/sales';

export function calculateRegionQuarterMatrix(rows: SalesOrderRow[]): RegionQuarterMatrix {
  const regionsSet = new Set<string>();
  const quartersSet = new Set<string>();
  const matrix: Record<string, Record<string, number>> = {};
  const regionTotals: Record<string, number> = {};
  const quarterTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (const row of rows) {
    const { region, quarter, revenue } = row;
    regionsSet.add(region);
    quartersSet.add(quarter);

    if (!matrix[region]) {
      matrix[region] = {};
    }
    matrix[region][quarter] = (matrix[region][quarter] || 0) + revenue;
    regionTotals[region] = (regionTotals[region] || 0) + revenue;
    quarterTotals[quarter] = (quarterTotals[quarter] || 0) + revenue;
    grandTotal += revenue;
  }

  // Natural sort order for quarters (Q1, Q2, Q3, Q4 first, then others)
  const quarterOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  const sortedQuarters = Array.from(quartersSet).sort((a, b) => {
    const oA = quarterOrder[a] ?? 99;
    const oB = quarterOrder[b] ?? 99;
    if (oA !== oB) return oA - oB;
    return a.localeCompare(b);
  });

  // Sort regions by total revenue descending
  const sortedRegions = Array.from(regionsSet).sort((a, b) => {
    return (regionTotals[b] || 0) - (regionTotals[a] || 0);
  });

  return {
    quarters: sortedQuarters,
    regions: sortedRegions,
    matrix,
    regionTotals,
    quarterTotals,
    grandTotal,
  };
}

export function analyzeQ2Q3(rows: SalesOrderRow[]): Q2Q3Analysis {
  const hasQ2 = rows.some((r) => r.quarter === 'Q2');
  const hasQ3 = rows.some((r) => r.quarter === 'Q3');

  if (!hasQ2 || !hasQ3) {
    return {
      hasQ2,
      hasQ3,
      topRegionByDollar: null,
      topRegionByPercent: null,
      totalCompany: { q2Revenue: 0, q3Revenue: 0, dollarChange: 0, percentChange: 0 },
      allRegionsRanked: [],
    };
  }

  // Group by region and quarter
  const regionStats: Record<
    string,
    {
      q2Rev: number;
      q3Rev: number;
      q2Units: number;
      q3Units: number;
      q2DiscountSum: number;
      q3DiscountSum: number;
      q2Count: number;
      q3Count: number;
      products: Record<string, { q2Rev: number; q3Rev: number; q2Units: number; q3Units: number }>;
      channels: Record<string, { q2Rev: number; q3Rev: number }>;
    }
  > = {};

  let compQ2Rev = 0;
  let compQ3Rev = 0;

  for (const row of rows) {
    if (row.quarter !== 'Q2' && row.quarter !== 'Q3') continue;

    const r = row.region;
    if (!regionStats[r]) {
      regionStats[r] = {
        q2Rev: 0,
        q3Rev: 0,
        q2Units: 0,
        q3Units: 0,
        q2DiscountSum: 0,
        q3DiscountSum: 0,
        q2Count: 0,
        q3Count: 0,
        products: {},
        channels: {},
      };
    }

    const reg = regionStats[r];
    const prod = row.product;
    const chan = row.channel;

    if (!reg.products[prod]) {
      reg.products[prod] = { q2Rev: 0, q3Rev: 0, q2Units: 0, q3Units: 0 };
    }
    if (!reg.channels[chan]) {
      reg.channels[chan] = { q2Rev: 0, q3Rev: 0 };
    }

    if (row.quarter === 'Q2') {
      reg.q2Rev += row.revenue;
      reg.q2Units += row.units;
      reg.q2DiscountSum += row.discount_pct;
      reg.q2Count += 1;
      reg.products[prod].q2Rev += row.revenue;
      reg.products[prod].q2Units += row.units;
      reg.channels[chan].q2Rev += row.revenue;
      compQ2Rev += row.revenue;
    } else if (row.quarter === 'Q3') {
      reg.q3Rev += row.revenue;
      reg.q3Units += row.units;
      reg.q3DiscountSum += row.discount_pct;
      reg.q3Count += 1;
      reg.products[prod].q3Rev += row.revenue;
      reg.products[prod].q3Units += row.units;
      reg.channels[chan].q3Rev += row.revenue;
      compQ3Rev += row.revenue;
    }
  }

  const allRegionsRanked = Object.entries(regionStats).map(([region, stats]) => {
    const dollarChange = stats.q3Rev - stats.q2Rev;
    const percentChange = stats.q2Rev !== 0 ? (dollarChange / stats.q2Rev) * 100 : 0;
    return {
      region,
      q2Revenue: stats.q2Rev,
      q3Revenue: stats.q3Rev,
      dollarChange,
      percentChange,
      absDollarChange: Math.abs(dollarChange),
    };
  });

  // Sort by absolute dollar change descending
  allRegionsRanked.sort((a, b) => b.absDollarChange - a.absDollarChange);

  // Helper to build deep detail for a region
  const buildDetail = (regionName: string): RegionChangeDetail => {
    const stats = regionStats[regionName];
    const dollarChange = stats.q3Rev - stats.q2Rev;
    const percentChange = stats.q2Rev !== 0 ? (dollarChange / stats.q2Rev) * 100 : 0;

    const productDrivers: ProductDriver[] = Object.entries(stats.products).map(
      ([product, pStats]) => ({
        product,
        q2Revenue: pStats.q2Rev,
        q3Revenue: pStats.q3Rev,
        deltaRevenue: pStats.q3Rev - pStats.q2Rev,
        q2Units: pStats.q2Units,
        q3Units: pStats.q3Units,
      })
    );
    // Sort product drivers by greatest absolute dollar impact
    productDrivers.sort((a, b) => Math.abs(b.deltaRevenue) - Math.abs(a.deltaRevenue));

    const channelDrivers: ChannelDriver[] = Object.entries(stats.channels).map(
      ([channel, cStats]) => ({
        channel,
        q2Revenue: cStats.q2Rev,
        q3Revenue: cStats.q3Rev,
        deltaRevenue: cStats.q3Rev - cStats.q2Rev,
      })
    );
    channelDrivers.sort((a, b) => Math.abs(b.deltaRevenue) - Math.abs(a.deltaRevenue));

    return {
      name: regionName,
      q2Revenue: stats.q2Rev,
      q3Revenue: stats.q3Rev,
      dollarChange,
      percentChange,
      isIncrease: dollarChange >= 0,
      q2Units: stats.q2Units,
      q3Units: stats.q3Units,
      unitDelta: stats.q3Units - stats.q2Units,
      q2AvgDiscountPct: stats.q2Count > 0 ? stats.q2DiscountSum / stats.q2Count : 0,
      q3AvgDiscountPct: stats.q3Count > 0 ? stats.q3DiscountSum / stats.q3Count : 0,
      topProductDrivers: productDrivers.slice(0, 4),
      topChannelDrivers: channelDrivers.slice(0, 3),
    };
  };

  const topRegionByDollar = allRegionsRanked.length > 0 ? buildDetail(allRegionsRanked[0].region) : null;

  // Also check top region by percentage change
  const byPct = [...allRegionsRanked].sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  const topRegionByPercent = byPct.length > 0 ? buildDetail(byPct[0].region) : null;

  const compDollarChange = compQ3Rev - compQ2Rev;
  const compPctChange = compQ2Rev !== 0 ? (compDollarChange / compQ2Rev) * 100 : 0;

  return {
    hasQ2,
    hasQ3,
    topRegionByDollar,
    topRegionByPercent,
    totalCompany: {
      q2Revenue: compQ2Rev,
      q3Revenue: compQ3Rev,
      dollarChange: compDollarChange,
      percentChange: compPctChange,
    },
    allRegionsRanked,
  };
}

export function formatCurrency(val: number): string {
  return `$${val.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrencyDetailed(val: number): string {
  return `$${val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}
