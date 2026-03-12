const RECENT_EVENT_LIMIT = 16;
const DEFAULT_TREND_DAY_WINDOW = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

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

const emptyComparison = () => ({
  enabled: false,
  previousRange: null,
  summary: null,
  deltas: null,
  trends: [],
});

export const emptyAnalyticsReport = () => ({
  generatedAt: new Date().toISOString(),
  range: null,
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
  comparison: emptyComparison(),
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
  return Number((numerator / denominator).toFixed(4));
};

const parseTimestamp = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const getDateKey = (value) => {
  const parsed = parseTimestamp(value);
  if (!parsed) return '';
  return parsed.toISOString().slice(0, 10);
};

const startOfUtcDay = (value) => {
  const parsed = parseTimestamp(value) || new Date();
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0));
};

const endOfUtcDay = (value) => {
  const parsed = parseTimestamp(value) || new Date();
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 23, 59, 59, 999));
};

const diffDaysInclusive = (fromDate, toDate) => {
  return Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1);
};

const buildRangeLabel = (fromDate, toDate) => {
  const sameDay = fromDate.toISOString().slice(0, 10) === toDate.toISOString().slice(0, 10);
  if (sameDay) {
    return fromDate.toISOString().slice(0, 10);
  }
  return `${fromDate.toISOString().slice(0, 10)} to ${toDate.toISOString().slice(0, 10)}`;
};

const resolveRange = ({ from, to, generatedAt }) => {
  const referenceEnd = endOfUtcDay(generatedAt || new Date().toISOString());
  const defaultFrom = new Date(referenceEnd.getTime() - ((DEFAULT_TREND_DAY_WINDOW - 1) * DAY_MS));
  defaultFrom.setUTCHours(0, 0, 0, 0);

  const fromDate = parseTimestamp(from) ? new Date(from) : defaultFrom;
  const toDate = parseTimestamp(to) ? new Date(to) : referenceEnd;
  const normalizedFrom = startOfUtcDay(fromDate);
  const normalizedTo = endOfUtcDay(toDate);

  if (normalizedFrom.getTime() > normalizedTo.getTime()) {
    return resolveRange({
      from: normalizedTo.toISOString(),
      to: normalizedFrom.toISOString(),
      generatedAt,
    });
  }

  return {
    from: normalizedFrom.toISOString(),
    to: normalizedTo.toISOString(),
    days: diffDaysInclusive(normalizedFrom, normalizedTo),
    label: buildRangeLabel(normalizedFrom, normalizedTo),
  };
};

const filterEventsByRange = (events, range) => {
  const fromTime = parseTimestamp(range.from)?.getTime() ?? 0;
  const toTime = parseTimestamp(range.to)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return events.filter((event) => {
    const timestamp = parseTimestamp(event?.timestamp || event?.receivedAt || '');
    if (!timestamp) {
      return false;
    }
    const time = timestamp.getTime();
    return time >= fromTime && time <= toTime;
  });
};

const getTrendWindow = (range) => {
  const start = startOfUtcDay(range.from);
  const days = Math.max(1, range.days);
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
};

const getTopRecordEntry = (record) => {
  const [key = '', count = 0] = Object.entries(record || {}).sort((left, right) => right[1] - left[1])[0] || [];
  return { key, count };
};

const buildBaseAnalyticsReport = (events, range, generatedAt) => {
  const report = emptyAnalyticsReport();
  report.generatedAt = generatedAt;
  report.range = range;
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
  report.quality.averageEventsPerActiveDay = activeDays.size > 0
    ? Number((events.length / activeDays.size).toFixed(2))
    : 0;
  report.quality.firstReadingSuccessRate = getRate(report.counts.first_reading_success, totalFirstReadings);
  report.quality.inviteRewardFailureRate = getRate(
    report.counts.invite_reward_claim_failed + report.counts.invite_reward_self_blocked,
    totalInviteRewardAttempts,
  );

  if (report.timeToFirstValue.samples > 0) {
    report.timeToFirstValue.averageMs = Math.round(timeToFirstValueTotal / report.timeToFirstValue.samples);
    report.timeToFirstValue.withinTargetRate = Number(
      (report.timeToFirstValue.withinTargetCount / report.timeToFirstValue.samples).toFixed(4),
    );
  }

  const trendWindow = getTrendWindow(range);
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

const buildPreviousRange = (range) => {
  const currentFrom = parseTimestamp(range.from) || new Date();
  const currentTo = parseTimestamp(range.to) || new Date();
  const durationMs = Math.max(DAY_MS, currentTo.getTime() - currentFrom.getTime() + 1);
  const previousTo = new Date(currentFrom.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs + 1);

  return resolveRange({
    from: previousFrom.toISOString(),
    to: previousTo.toISOString(),
    generatedAt: currentTo.toISOString(),
  });
};

const toDelta = (currentValue, previousValue, digits = 4) => {
  return Number((currentValue - previousValue).toFixed(digits));
};

const buildComparison = (currentReport, previousReport) => {
  const trendLength = Math.max(
    currentReport.trends.eventsByDay.length,
    previousReport.trends.eventsByDay.length,
  );

  return {
    enabled: true,
    previousRange: previousReport.range,
    summary: {
      totalEvents: previousReport.totalEvents,
      averageMs: previousReport.timeToFirstValue.averageMs,
      withinTargetRate: previousReport.timeToFirstValue.withinTargetRate,
      firstReadingSuccessRate: previousReport.quality.firstReadingSuccessRate,
      shareToOpenRate: previousReport.funnel.shareToOpenRate,
      openToInstallRate: previousReport.funnel.openToInstallRate,
      installToRewardRate: previousReport.funnel.installToRewardRate,
      coinSpent: previousReport.counts.coin_spent,
      miniAppOpen: previousReport.counts.mini_app_open,
      sceneChange: previousReport.counts.scene_change,
    },
    deltas: {
      totalEvents: toDelta(currentReport.totalEvents, previousReport.totalEvents, 2),
      averageMs: toDelta(currentReport.timeToFirstValue.averageMs, previousReport.timeToFirstValue.averageMs, 0),
      withinTargetRate: toDelta(currentReport.timeToFirstValue.withinTargetRate, previousReport.timeToFirstValue.withinTargetRate),
      firstReadingSuccessRate: toDelta(currentReport.quality.firstReadingSuccessRate, previousReport.quality.firstReadingSuccessRate),
      shareToOpenRate: toDelta(currentReport.funnel.shareToOpenRate, previousReport.funnel.shareToOpenRate),
      openToInstallRate: toDelta(currentReport.funnel.openToInstallRate, previousReport.funnel.openToInstallRate),
      installToRewardRate: toDelta(currentReport.funnel.installToRewardRate, previousReport.funnel.installToRewardRate),
      coinSpent: toDelta(currentReport.counts.coin_spent, previousReport.counts.coin_spent, 2),
      miniAppOpen: toDelta(currentReport.counts.mini_app_open, previousReport.counts.mini_app_open, 2),
      sceneChange: toDelta(currentReport.counts.scene_change, previousReport.counts.scene_change, 2),
    },
    trends: Array.from({ length: trendLength }, (_, index) => ({
      currentDateKey: currentReport.trends.eventsByDay[index]?.dateKey || '',
      previousDateKey: previousReport.trends.eventsByDay[index]?.dateKey || '',
      currentCount: currentReport.trends.eventsByDay[index]?.count || 0,
      previousCount: previousReport.trends.eventsByDay[index]?.count || 0,
    })),
  };
};

export const buildAnalyticsReport = (events, options = {}) => {
  const generatedAt = new Date().toISOString();
  const range = resolveRange({
    from: options.from,
    to: options.to,
    generatedAt,
  });

  const filteredEvents = filterEventsByRange(events, range);
  const report = buildBaseAnalyticsReport(filteredEvents, range, generatedAt);

  if (options.comparePrevious) {
    const previousRange = buildPreviousRange(range);
    const previousEvents = filterEventsByRange(events, previousRange);
    const previousReport = buildBaseAnalyticsReport(previousEvents, previousRange, generatedAt);
    report.comparison = buildComparison(report, previousReport);
  }

  return report;
};
