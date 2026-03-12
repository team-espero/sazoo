import { describe, expect, it } from 'vitest';
import { buildAnalyticsReport } from './summary.js';

describe('analytics summary', () => {
  it('aggregates launch metrics and product-health breakdowns', () => {
    const report = buildAnalyticsReport([
      {
        name: 'share',
        timestamp: '2026-03-12T01:00:00.000Z',
        payload: { source: 'daily_fortune' },
      },
      {
        name: 'onboarding_step_view',
        timestamp: '2026-03-12T01:00:01.000Z',
        payload: { step: 'landing_cta' },
      },
      {
        name: 'onboarding_step_complete',
        timestamp: '2026-03-12T01:00:02.000Z',
        payload: { step: 'birth_input' },
      },
      {
        name: 'coin_spent',
        timestamp: '2026-03-12T01:00:03.000Z',
        payload: { contextKey: 'miniapp_dream_reading', spendSource: 'free' },
      },
      {
        name: 'ad_reward_granted',
        timestamp: '2026-03-12T01:00:04.000Z',
        payload: { placementId: 'daily_reward_default', rewardAmount: 1 },
      },
      {
        name: 'mini_app_open',
        timestamp: '2026-03-12T01:00:05.000Z',
        payload: { appId: 'dream' },
      },
      {
        name: 'scene_change',
        timestamp: '2026-03-12T01:00:06.000Z',
        payload: { sceneId: 'hanok' },
      },
      {
        name: 'invite_reward_granted',
        timestamp: '2026-03-12T01:00:07.000Z',
        payload: { amount: 1 },
      },
      {
        name: 'first_reading_success',
        timestamp: '2026-03-12T01:00:07.500Z',
        payload: { durationMs: 4200 },
      },
      {
        name: 'time_to_first_value',
        timestamp: '2026-03-12T01:00:08.000Z',
        payload: { durationMs: 12345, withinTarget: true },
      },
    ]);

    expect(report.totalEvents).toBe(10);
    expect(report.counts.share).toBe(1);
    expect(report.counts.onboarding_step_view).toBe(1);
    expect(report.counts.onboarding_step_complete).toBe(1);
    expect(report.counts.coin_spent).toBe(1);
    expect(report.counts.ad_reward_granted).toBe(1);
    expect(report.counts.mini_app_open).toBe(1);
    expect(report.counts.scene_change).toBe(1);
    expect(report.counts.invite_reward_granted).toBe(1);
    expect(report.counts.first_reading_success).toBe(1);
    expect(report.timeToFirstValue.averageMs).toBe(12345);
    expect(report.timeToFirstValue.withinTargetRate).toBe(1);
    expect(report.onboarding.viewsByStep.landing_cta).toBe(1);
    expect(report.onboarding.completesByStep.birth_input).toBe(1);
    expect(report.productHealth.coinSpendByContext.miniapp_dream_reading).toBe(1);
    expect(report.productHealth.adRewardsByPlacement.daily_reward_default).toBe(1);
    expect(report.productHealth.miniAppOpenByApp.dream).toBe(1);
    expect(report.productHealth.sceneChangeByScene.hanok).toBe(1);
    expect(report.funnel.shareToOpenRate).toBe(0);
    expect(report.funnel.installToRewardRate).toBe(0);
    expect(report.quality.firstReadingSuccessRate).toBe(1);
    expect(report.quality.activeDays).toBe(1);
    expect(report.quality.averageEventsPerActiveDay).toBe(10);
    expect(report.trends.eventsByDay).toHaveLength(7);
    expect(report.topSignals.topCoinSpendContext.key).toBe('miniapp_dream_reading');
    expect(report.topSignals.topMiniApp.key).toBe('dream');
    expect(report.topSignals.topScene.key).toBe('hanok');
    expect(report.topSignals.topOnboardingViewStep.key).toBe('landing_cta');
    expect(report.topSignals.topOnboardingCompletionStep.key).toBe('birth_input');
    expect(report.topSignals.hottestDay.key).toBe('2026-03-12');
    expect(report.recentEvents[0]?.name).toBe('time_to_first_value');
  });
});
