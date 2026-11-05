export interface SalesOrderRow {
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number; // e.g. 0.15 for 15%
  revenue: number;
}

export interface RegionQuarterMatrix {
  quarters: string[];
  regions: string[];
  matrix: Record<string, Record<string, number>>; // [region][quarter] = revenue
  regionTotals: Record<string, number>;
  quarterTotals: Record<string, number>;
  grandTotal: number;
}

export interface ProductDriver {
  product: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  q2Units: number;
  q3Units: number;
}

export interface ChannelDriver {
  channel: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
}

export interface RegionChangeDetail {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  dollarChange: number;
  percentChange: number;
  isIncrease: boolean;
  q2Units: number;
  q3Units: number;
  unitDelta: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  topProductDrivers: ProductDriver[];
  topChannelDrivers: ChannelDriver[];
}

export interface Q2Q3Analysis {
  hasQ2: boolean;
  hasQ3: boolean;
  topRegionByDollar: RegionChangeDetail | null;
  topRegionByPercent: RegionChangeDetail | null;
  totalCompany: {
    q2Revenue: number;
    q3Revenue: number;
    dollarChange: number;
    percentChange: number;
  };
  allRegionsRanked: Array<{
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarChange: number;
    percentChange: number;
    absDollarChange: number;
  }>;
}

export interface ParseResult {
  data: SalesOrderRow[];
  errors: string[];
  warnings: string[];
  rowCount: number;
}
