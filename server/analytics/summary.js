const RECENT_EVENT_LIMIT = 16;
const TREND_DAY_WINDOW = 7;

const baseCounts = () => ({
  share: 0,
  invite_open: 0,
  install_from_invite: 0,
  d1_retention: 0,
  invite_reward_claimed: 0,
  invite_reward_granted: 0,
  invite_reward_duplicate: 0,
  invite_reward_self_blocked: 0,
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
  funnel: {
    shareCount: 0,
    inviteOpenCount: 0,
    installCount: 0,
    rewardGrantedCount: 0,
    shareToOpenRate: 0,
    openToInstallRate: 0,
    installToRewardRate: 0,
  },
  quality: {
    firstReadingSuccessRate: 0,
    inviteRewardFailureRate: 0,
    activeDays: 0,
    averageEventsPerActiveDay: 0,
  },
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
  trends: {
    eventsByDay: [],
  },
  topSignals: {
    topCoinSpendContext: { key: '', count: 0 },
    topMiniApp: { key: '', count: 0 },
    topScene: { key: '', count: 0 },
    topOnboardingViewStep: { key: '', count: 0 },
    topOnboardingCompletionStep: { key: '', count: 0 },
    hottestDay: { key: '', count: 0 },
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

const getRate = (numerator, denominator) => {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(2));
};

const getDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getTrendWindow = (referenceIso) => {
  const reference = getDateKey(referenceIso) ? new Date(referenceIso) : new Date();
  const anchor = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const window = [];

  for (let offset = TREND_DAY_WINDOW - 1; offset >= 0; offset -= 1) {
    const day = new Date(anchor);
    day.setUTCDate(anchor.getUTCDate() - offset);
    window.push(day.toISOString().slice(0, 10));
  }

  return window;
};

const getTopRecordEntry = (record) => {
  const [key = '', count = 0] = Object.entries(record || {}).sort((a, b) => b[1] - a[1])[0] || [];
  return { key, count };
};

export const buildAnalyticsReport = (events) => {
  const report = emptyAnalyticsReport();
  report.generatedAt = new Date().toISOString();
  report.totalEvents = events.length;

  let timeToFirstValueTotal = 0;
  const eventCountsByDay = {};
  const activeDays = new Set();

  for (const event of events) {
    const payload = event?.payload || {};
    const eventDateKey = getDateKey(event.timestamp || event.receivedAt || '');
    if (report.counts[event.name] !== undefined) {
      report.counts[event.name] += 1;
    }
    if (eventDateKey) {
      activeDays.add(eventDateKey);
      eventCountsByDay[eventDateKey] = (eventCountsByDay[eventDateKey] || 0) + 1;
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

  report.funnel.shareCount = report.counts.share;
  report.funnel.inviteOpenCount = report.counts.invite_open;
  report.funnel.installCount = report.counts.install_from_invite;
  report.funnel.rewardGrantedCount = report.counts.invite_reward_granted;
  report.funnel.shareToOpenRate = getRate(report.funnel.inviteOpenCount, report.funnel.shareCount);
  report.funnel.openToInstallRate = getRate(report.funnel.installCount, report.funnel.inviteOpenCount);
  report.funnel.installToRewardRate = getRate(report.funnel.rewardGrantedCount, report.funnel.installCount);

  const totalFirstReadings = report.counts.first_reading_success + report.counts.first_reading_failure;
  const totalInviteRewardAttempts =
    report.counts.invite_reward_granted
    + report.counts.invite_reward_duplicate
    + report.counts.invite_reward_self_blocked
    + report.counts.invite_reward_claim_failed;
  report.quality.activeDays = activeDays.size;
  report.quality.averageEventsPerActiveDay = activeDays.size > 0 ? Number((events.length / activeDays.size).toFixed(2)) : 0;
  report.quality.firstReadingSuccessRate = getRate(report.counts.first_reading_success, totalFirstReadings);
  report.quality.inviteRewardFailureRate = getRate(
    report.counts.invite_reward_claim_failed + report.counts.invite_reward_self_blocked,
    totalInviteRewardAttempts,
  );

  if (report.timeToFirstValue.samples > 0) {
    report.timeToFirstValue.averageMs = Math.round(timeToFirstValueTotal / report.timeToFirstValue.samples);
    report.timeToFirstValue.withinTargetRate = Number(
      (report.timeToFirstValue.withinTargetCount / report.timeToFirstValue.samples).toFixed(2),
    );
  }

  const trendWindow = getTrendWindow(report.generatedAt);
  report.trends.eventsByDay = trendWindow.map((dateKey) => ({
    dateKey,
    count: eventCountsByDay[dateKey] || 0,
  }));

  report.topSignals.topCoinSpendContext = getTopRecordEntry(report.productHealth.coinSpendByContext);
  report.topSignals.topMiniApp = getTopRecordEntry(report.productHealth.miniAppOpenByApp);
  report.topSignals.topScene = getTopRecordEntry(report.productHealth.sceneChangeByScene);
  report.topSignals.topOnboardingViewStep = getTopRecordEntry(report.onboarding.viewsByStep);
  report.topSignals.topOnboardingCompletionStep = getTopRecordEntry(report.onboarding.completesByStep);
  report.topSignals.hottestDay = getTopRecordEntry(eventCountsByDay);

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
