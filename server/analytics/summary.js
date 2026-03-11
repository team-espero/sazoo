const RECENT_EVENT_LIMIT = 16;

const baseCounts = () => ({
  share: 0,
  invite_open: 0,
  install_from_invite: 0,
  d1_retention: 0,
  invite_reward_claimed: 0,
  invite_reward_granted: 0,
  invite_reward_duplicate: 0,
  invite_reward_claim_failed: 0,
  first_reading_success: 0,
  first_reading_failure: 0,
  onboarding_step_view: 0,
  onboarding_step_complete: 0,
  coin_spent: 0,
  ad_reward_granted: 0,
  scene_change: 0,
  mini_app_open: 0,
});

export const emptyAnalyticsReport = () => ({
  generatedAt: new Date().toISOString(),
  totalEvents: 0,
  counts: baseCounts(),
  timeToFirstValue: {
    samples: 0,
    averageMs: 0,
    withinTargetCount: 0,
    withinTargetRate: 0,
  },
  onboarding: {
    viewsByStep: {},
    completesByStep: {},
  },
  productHealth: {
    coinSpendByContext: {},
    adRewardsByPlacement: {},
    miniAppOpenByApp: {},
    sceneChangeByScene: {},
  },
  recentEvents: [],
});

const incrementRecord = (record, key) => {
  if (!key) return;
  record[key] = (record[key] || 0) + 1;
};

const getPayloadString = (payload, key) => {
  const value = payload?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
};

export const buildAnalyticsReport = (events) => {
  const report = emptyAnalyticsReport();
  report.generatedAt = new Date().toISOString();
  report.totalEvents = events.length;

  let timeToFirstValueTotal = 0;

  for (const event of events) {
    const payload = event?.payload || {};
    if (report.counts[event.name] !== undefined) {
      report.counts[event.name] += 1;
    }

    if (event.name === 'time_to_first_value') {
      const durationMs = Number(payload.durationMs || 0);
      const withinTarget = Boolean(payload.withinTarget);
      report.timeToFirstValue.samples += 1;
      report.timeToFirstValue.withinTargetCount += withinTarget ? 1 : 0;
      timeToFirstValueTotal += durationMs;
    }

    if (event.name === 'onboarding_step_view') {
      incrementRecord(report.onboarding.viewsByStep, String(payload.step || 'unknown'));
    }

    if (event.name === 'onboarding_step_complete') {
      incrementRecord(report.onboarding.completesByStep, String(payload.step || 'unknown'));
    }

    if (event.name === 'coin_spent') {
      incrementRecord(report.productHealth.coinSpendByContext, getPayloadString(payload, 'contextKey') || 'generic');
    }

    if (event.name === 'ad_reward_granted') {
      incrementRecord(report.productHealth.adRewardsByPlacement, getPayloadString(payload, 'placementId') || 'daily_reward_default');
    }

    if (event.name === 'mini_app_open') {
      incrementRecord(report.productHealth.miniAppOpenByApp, getPayloadString(payload, 'appId') || 'unknown');
    }

    if (event.name === 'scene_change') {
      incrementRecord(report.productHealth.sceneChangeByScene, getPayloadString(payload, 'sceneId') || 'unknown');
    }
  }

  if (report.timeToFirstValue.samples > 0) {
    report.timeToFirstValue.averageMs = Math.round(timeToFirstValueTotal / report.timeToFirstValue.samples);
    report.timeToFirstValue.withinTargetRate = Number(
      (report.timeToFirstValue.withinTargetCount / report.timeToFirstValue.samples).toFixed(2),
    );
  }

  report.recentEvents = events
    .slice(-RECENT_EVENT_LIMIT)
    .reverse()
    .map((event) => ({
      name: event.name,
      timestamp: event.timestamp || event.receivedAt || '',
      payload: event.payload || {},
    }));

  return report;
};
