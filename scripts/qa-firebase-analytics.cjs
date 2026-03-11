const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = process.env.QA_URL || 'http://127.0.0.1:5180';
const EXPECTED_MEASUREMENT_ID = process.env.FIREBASE_MEASUREMENT_ID || 'G-01CN9KV391';

const isAnalyticsCollectRequest = (url) =>
  url.includes('google-analytics.com') && url.includes('collect');

const decodeQueryString = (value) => {
  try {
    return new URLSearchParams(value);
  } catch {
    return new URLSearchParams();
  }
};

const extractBatchValues = (body, key) =>
  String(body || '')
    .split(/\r?\n/)
    .map((line) => decodeQueryString(line).getAll(key))
    .flat()
    .filter(Boolean);

const extractAnalyticsMetadata = (url, body) => {
  const parsedUrl = new URL(url);
  const urlParams = parsedUrl.searchParams;
  const bodyParams = decodeQueryString(body || '');
  const merged = new URLSearchParams(urlParams);

  for (const [key, value] of bodyParams.entries()) {
    merged.append(key, value);
  }

  const raw = `${url}\n${body || ''}`;
  const eventNames = [...new Set([...merged.getAll('en'), ...extractBatchValues(body, 'en')])];
  const measurementIds = [...new Set([...merged.getAll('tid'), ...extractBatchValues(body, 'tid')])];
  const debugMode =
    raw.includes('debug_mode')
    || raw.includes('_dbg')
    || raw.includes('ep.debug_mode')
    || raw.includes('epn.debug_mode');

  return {
    method: body ? 'POST' : 'GET',
    url,
    eventNames,
    measurementIds,
    debugMode,
    bodyPreview: (body || '').slice(0, 500),
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });

  const page = await context.newPage();
  const analyticsRequests = [];
  const analyticsLogs = [];

  page.on('request', (request) => {
    const url = request.url();
    if (!isAnalyticsCollectRequest(url)) {
      return;
    }

    analyticsRequests.push(extractAnalyticsMetadata(url, request.postData() || ''));
  });

  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('[analytics]')) {
      analyticsLogs.push(text);
    }
  });

  const startedAt = Date.now();
  await page.goto(DEFAULT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const playButton = page.getByRole('button', { name: /인트로 재생|Start|再生/ });
  const skipButton = page.getByRole('button', { name: /건너뛰기|Skip|スキップ/ });

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(800);
  }

  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }

  await page.getByRole('button', {
    name: /운세 시작하기|Start Reading|Start Your Fortune|運勢を始める/,
  }).click({ timeout: 30000 });

  const onboardingButton = page.getByRole('button', {
    name: /정보 입력하고 운세 보기|Enter info and view reading|情報を入力して鑑定を見る/,
  });

  if (await onboardingButton.isVisible().catch(() => false)) {
    await onboardingButton.click({ timeout: 15000 });
  }

  await page.waitForTimeout(15000);

  const eventNames = analyticsRequests.flatMap((entry) => entry.eventNames);
  const measurementIds = [...new Set(analyticsRequests.flatMap((entry) => entry.measurementIds))];
  const hasExpectedMeasurementId = measurementIds.includes(EXPECTED_MEASUREMENT_ID);
  const hasOnboardingStepView = eventNames.includes('onboarding_step_view');
  const hasDebugMode = analyticsRequests.some((entry) => entry.debugMode);

  const screenshotPath = path.join(process.cwd(), 'qa_firebase_analytics_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    url: DEFAULT_URL,
    totalMs: Date.now() - startedAt,
    analyticsRequestCount: analyticsRequests.length,
    measurementIds,
    hasExpectedMeasurementId,
    observedEvents: [...new Set(eventNames)],
    analyticsLogs,
    hasOnboardingStepView,
    hasDebugMode,
    screenshotPath,
    requests: analyticsRequests.slice(0, 10),
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'qa_firebase_analytics_result.json'),
    JSON.stringify(result, null, 2),
  );

  console.log(JSON.stringify(result, null, 2));

  if (!hasExpectedMeasurementId || !hasOnboardingStepView || !hasDebugMode) {
    process.exitCode = 1;
  }

  await browser.close();
})();
