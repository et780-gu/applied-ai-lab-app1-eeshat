export const SAMPLE_SALES_CSV = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Direct Sales,Enterprise Cloud Suite,120,0.08,360000.00
Q1,North America,Partner Reseller,Security Shield AI,250,0.12,220000.00
Q1,North America,Online Self-Serve,Data Pipeline Pro,410,0.05,205000.00
Q1,North America,Direct Sales,Developer Toolkit,180,0.10,90000.00
Q1,Europe,Direct Sales,Enterprise Cloud Suite,95,0.06,285000.00
Q1,Europe,Partner Reseller,Security Shield AI,180,0.10,162000.00
Q1,Europe,Online Self-Serve,Data Pipeline Pro,320,0.04,160000.00
Q1,Europe,Direct Sales,Developer Toolkit,140,0.08,70000.00
Q1,Asia Pacific,Partner Reseller,Enterprise Cloud Suite,80,0.10,240000.00
Q1,Asia Pacific,Online Self-Serve,Data Pipeline Pro,390,0.06,195000.00
Q1,Asia Pacific,Direct Sales,Security Shield AI,110,0.05,104500.00
Q1,Latin America,Partner Reseller,Data Pipeline Pro,210,0.15,89250.00
Q1,Latin America,Online Self-Serve,Developer Toolkit,160,0.10,72000.00
Q2,North America,Direct Sales,Enterprise Cloud Suite,145,0.07,435000.00
Q2,North America,Partner Reseller,Security Shield AI,280,0.10,252000.00
Q2,North America,Online Self-Serve,Data Pipeline Pro,460,0.05,230000.00
Q2,North America,Direct Sales,Developer Toolkit,210,0.08,115500.00
Q2,Europe,Direct Sales,Enterprise Cloud Suite,115,0.05,345000.00
Q2,Europe,Partner Reseller,Security Shield AI,210,0.08,193200.00
Q2,Europe,Online Self-Serve,Data Pipeline Pro,360,0.05,171000.00
Q2,Europe,Direct Sales,Developer Toolkit,165,0.06,85470.00
Q2,Asia Pacific,Partner Reseller,Enterprise Cloud Suite,95,0.08,285000.00
Q2,Asia Pacific,Online Self-Serve,Data Pipeline Pro,420,0.05,210000.00
Q2,Asia Pacific,Direct Sales,Security Shield AI,135,0.06,126900.00
Q2,Latin America,Partner Reseller,Data Pipeline Pro,240,0.12,105600.00
Q2,Latin America,Online Self-Serve,Developer Toolkit,190,0.09,86450.00
Q3,North America,Direct Sales,Enterprise Cloud Suite,160,0.06,480000.00
Q3,North America,Partner Reseller,Security Shield AI,310,0.09,282100.00
Q3,North America,Online Self-Serve,Data Pipeline Pro,490,0.04,249900.00
Q3,North America,Direct Sales,Developer Toolkit,230,0.07,128340.00
Q3,Europe,Direct Sales,Enterprise Cloud Suite,52,0.18,127920.00
Q3,Europe,Partner Reseller,Security Shield AI,130,0.15,110500.00
Q3,Europe,Online Self-Serve,Data Pipeline Pro,240,0.10,108000.00
Q3,Europe,Direct Sales,Developer Toolkit,110,0.12,48400.00
Q3,Asia Pacific,Partner Reseller,Enterprise Cloud Suite,105,0.08,315000.00
Q3,Asia Pacific,Online Self-Serve,Data Pipeline Pro,445,0.05,222500.00
Q3,Asia Pacific,Direct Sales,Security Shield AI,150,0.05,142500.00
Q3,Latin America,Partner Reseller,Data Pipeline Pro,260,0.12,114400.00
Q3,Latin America,Online Self-Serve,Developer Toolkit,205,0.08,94300.00
Q4,North America,Direct Sales,Enterprise Cloud Suite,180,0.05,540000.00
Q4,North America,Partner Reseller,Security Shield AI,350,0.08,322000.00
Q4,North America,Online Self-Serve,Data Pipeline Pro,530,0.04,270300.00
Q4,North America,Direct Sales,Developer Toolkit,260,0.06,146640.00
Q4,Europe,Direct Sales,Enterprise Cloud Suite,85,0.10,229500.00
Q4,Europe,Partner Reseller,Security Shield AI,175,0.10,157500.00
Q4,Europe,Online Self-Serve,Data Pipeline Pro,310,0.06,145700.00
Q4,Europe,Direct Sales,Developer Toolkit,145,0.08,73950.00
Q4,Asia Pacific,Partner Reseller,Enterprise Cloud Suite,120,0.07,360000.00
Q4,Asia Pacific,Online Self-Serve,Data Pipeline Pro,480,0.04,240000.00
Q4,Asia Pacific,Direct Sales,Security Shield AI,170,0.04,163200.00
Q4,Latin America,Partner Reseller,Data Pipeline Pro,290,0.10,130500.00
Q4,Latin America,Online Self-Serve,Developer Toolkit,230,0.07,106950.00`;

export function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_SALES_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sales_orders_q1_q4_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
