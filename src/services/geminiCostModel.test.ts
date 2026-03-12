import { describe, expect, it } from 'vitest';
import { buildGeminiCostDashboardData } from './geminiCostModel';

describe('gemini cost model', () => {
  it('shows lower annual cost for the optimized runtime than the legacy insights-on-flash mix', () => {
    const report = buildGeminiCostDashboardData('en');

    expect(report.runtimeAnnualCostPerUser).toBeLessThan(report.legacyAnnualCostPerUser);
    expect(report.annualSavingsPerUser).toBeGreaterThan(0);
    expect(report.annualSavingsRate).toBeGreaterThan(0);
  });

  it('scales monthly estimates up with DAU', () => {
    const report = buildGeminiCostDashboardData('en');
    const [small, medium, large] = report.monthlyScaleRows;

    expect(small.runtimeMonthlyCost).toBeLessThan(medium.runtimeMonthlyCost);
    expect(medium.runtimeMonthlyCost).toBeLessThan(large.runtimeMonthlyCost);
    expect(small.monthlySavings).toBeLessThan(medium.monthlySavings);
    expect(medium.monthlySavings).toBeLessThan(large.monthlySavings);
  });

  it('keeps stage labels localized', () => {
    const report = buildGeminiCostDashboardData('ko');
    expect(report.stageCostRows[0]?.label).toBe('1일차');
    expect(report.stageCostRows[report.stageCostRows.length - 1]?.label).toBe('181-365일차');
  });
});
