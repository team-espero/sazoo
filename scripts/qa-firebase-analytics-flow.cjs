const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = process.env.QA_URL || 'http://127.0.0.1:5180';
const EXPECTED_MEASUREMENT_ID = process.env.FIREBASE_MEASUREMENT_ID || 'G-01CN9KV391';
const UI = {
  introPlay: /인트로 재생|Start|再生/,
  introSkip: /건너뛰기|Skip|スキップ/,
  startReading: /운세 시작하기|Start Reading|Start Your Fortune|運勢を始める/,
  inviteStart: /공유된 비교 결과 열기|Open shared comparison|共有された比較結果を開く/,
  onboardingCta: /정보 입력하고 운세 보기|Enter info and view reading|情報を入力して鑑定を見る/,
  continueKakao: /카카오로 계속하기|Continue with Kakao|Kakaoで続行/,
  next: /다음 단계로|Next|次へ/,
  analyze: /운세 분석하기|Start Analysis|Analyze|鑑定を開始|鑑定を始める/,
  concernWealth: /재물|Wealth|金運|Money/,
  namePlaceholder: /이름을 입력해주세요|Enter your name|名前を入力してください/,
  rewardContinue: /계속 보기|Continue|続ける/,
  male: /Boy Male|Male|남성|男性|Boy|Man/,
};

const encodeBase64Url = (value) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const createInviteUrl = (baseUrl) => {
  const payload = {
    version: 1,
    inviteId: `invite_firebase_flow_${Date.now()}`,
    source: 'daily_fortune',
    targetTab: 'chat',
    inviterName: 'Sazoo QA',
    previewTitle: 'Shared comparison',
    previewSummary: 'A shared result is waiting.',
    comparisonSummary: 'Invite analytics should restore this flow after onboarding.',
    createdAt: new Date().toISOString(),
  };

  const url = new URL(baseUrl);
  url.searchParams.set('invite', encodeBase64Url(JSON.stringify(payload)));
  return url.toString();
};

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
  return {
    method: body ? 'POST' : 'GET',
    url,
    eventNames: [...new Set([...merged.getAll('en'), ...extractBatchValues(body, 'en')])],
    measurementIds: [...new Set([...merged.getAll('tid'), ...extractBatchValues(body, 'tid')])],
    debugMode: raw.includes('debug_mode') || raw.includes('_dbg') || raw.includes('ep.debug_mode') || raw.includes('epn.debug_mode'),
    bodyPreview: (body || '').slice(0, 500),
  };
};

const skipIntroIfNeeded = async (page) => {
  const playButton = page.getByRole('button', { name: UI.introPlay });
  const skipButton = page.getByRole('button', { name: UI.introSkip });

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(800);
  }

  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
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
  const inviteUrl = createInviteUrl(DEFAULT_URL);

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
  await page.goto(inviteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await skipIntroIfNeeded(page);

  await page.getByRole('button', {
    name: /공유된 비교 결과 열기|Open shared comparison|共有された比較結果を開く|운세 시작하기|Start Reading|運勢を始める/,
  }).click({ timeout: 30000 });

  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: UI.onboardingCta }).click({ timeout: 30000 });
  await page.getByRole('button', { name: UI.continueKakao }).click({ timeout: 30000 });

  await page.getByPlaceholder(UI.namePlaceholder).fill('김형욱');
  await page.getByRole('button', { name: UI.male }).first().click();
  await page.getByRole('button', { name: UI.next }).click();

  await page.getByRole('button', { name: UI.concernWealth }).click();
  await page.getByRole('button', { name: UI.next }).click();

  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill('1993');
  await numberInputs.nth(1).fill('5');
  await numberInputs.nth(2).fill('6');
  await numberInputs.nth(3).fill('11');
  await numberInputs.nth(4).fill('30');
  await page.getByRole('button', { name: UI.analyze }).click();

  const rewardContinueButton = page.getByRole('button', { name: UI.rewardContinue });
  await rewardContinueButton.waitFor({ state: 'visible', timeout: 8000 }).then(async () => {
    await rewardContinueButton.click();
  }).catch(() => {});

  await page.waitForFunction(() => {
    const node = document.querySelector('p.text-center');
    if (!node) return false;
    const text = (node.textContent || '').trim();
    return text.length >= 30
      && !text.includes('사주를 더 또렷하게 읽으려면')
      && !text.includes('기운의 결을 가만히 읽고 있어요');
  }, { timeout: 45000 });

  await rewardContinueButton.waitFor({ state: 'visible', timeout: 3000 }).then(async () => {
    await rewardContinueButton.click();
  }).catch(() => {});

  await page.waitForTimeout(15000);

  const eventNames = analyticsRequests.flatMap((entry) => entry.eventNames);
  const measurementIds = [...new Set(analyticsRequests.flatMap((entry) => entry.measurementIds))];
  const hasExpectedMeasurementId = measurementIds.includes(EXPECTED_MEASUREMENT_ID);
  const requiredEvents = ['invite_open', 'install_from_invite', 'onboarding_step_view', 'first_reading_success'];
  const observedEvents = [...new Set(eventNames)];
  const missingEvents = requiredEvents.filter((eventName) => !observedEvents.includes(eventName));
  const hasDebugMode = analyticsRequests.some((entry) => entry.debugMode);

  const screenshotPath = path.join(process.cwd(), 'qa_firebase_analytics_flow_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    url: inviteUrl,
    totalMs: Date.now() - startedAt,
    analyticsRequestCount: analyticsRequests.length,
    measurementIds,
    hasExpectedMeasurementId,
    observedEvents,
    missingEvents,
    hasDebugMode,
    analyticsLogs,
    screenshotPath,
    requests: analyticsRequests.slice(0, 20),
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'qa_firebase_analytics_flow_result.json'),
    JSON.stringify(result, null, 2),
  );

  console.log(JSON.stringify(result, null, 2));

  if (!hasExpectedMeasurementId || !hasDebugMode || missingEvents.length > 0) {
    process.exitCode = 1;
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
