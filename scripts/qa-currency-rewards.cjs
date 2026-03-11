const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = process.env.QA_URL || 'http://127.0.0.1:5180';
const UI = {
  introPlay: /인트로 재생|Start|再生/,
  introSkip: /건너뛰기|Skip|スキップ/,
  startReading: /운세 시작하기|Start Reading|Start Your Fortune|運勢を始める/,
  onboardingCta: /정보 입력하고 운세 보기|Enter info and view reading|情報を入力して鑑定を見る/,
  continueGuest: /게스트로 계속하기|Continue as Guest|ゲストとして続行/,
  next: /다음 단계로|Next|次へ/,
  analyze: /운세 분석하기|Start Analysis|Analyze|鑑定を開始|鑑定を始める/,
  concernWealth: /재물|Wealth|金運|Money/,
  namePlaceholder: /이름을 입력해주세요|Enter your name|名前を入力してください/,
  chatPlaceholder: /궁금한 점을 물어보세요|Ask anything about your fortune|気になることを聞いてください/,
  male: /Boy Male|Male|남성|男性|Boy|Man/,
};

const parseIntSafe = (value) => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const skipIntroIfNeeded = async (page) => {
  const playButton = page.getByRole('button', { name: UI.introPlay });
  const skipButton = page.getByRole('button', { name: UI.introSkip });

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(700);
  }

  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
};

async function completeOnboarding(page) {
  await page.goto(DEFAULT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1800);
  await skipIntroIfNeeded(page);

  await page.getByRole('button', { name: UI.startReading }).click({ timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: UI.onboardingCta }).click({ timeout: 30000 });
  await page.getByRole('button', { name: UI.continueGuest }).click({ timeout: 30000 });

  await page.getByPlaceholder(UI.namePlaceholder).fill('테스트');
  await page.getByRole('button', { name: UI.male }).first().click({ timeout: 15000 });
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

  await page.getByPlaceholder(UI.chatPlaceholder, { exact: false }).waitFor({ timeout: 45000 });
}

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
  const startedAt = Date.now();

  await completeOnboarding(page);

  await page.getByTestId('chat-menu-button').click({ timeout: 15000 });
  await page.getByTestId('chat-menu-profile').click({ timeout: 15000 });
  await page.getByTestId('currency-wallet-card').waitFor({ timeout: 15000 });

  const freeBefore = await page.getByTestId('currency-free-badge').textContent();
  const paidBefore = await page.getByTestId('currency-paid-badge').textContent();
  const adsBefore = await page.getByTestId('currency-ads-remaining').textContent();

  for (let index = 0; index < 5; index += 1) {
    const previousPaid = parseIntSafe(await page.getByTestId('currency-paid-badge').textContent());
    await page.getByTestId('currency-ad-button').click();
    await page.waitForFunction((expectedPaid) => {
      const node = document.querySelector('[data-testid="currency-paid-badge"]');
      return Number.parseInt((node?.textContent || '').trim(), 10) === expectedPaid;
    }, previousPaid + 1, { timeout: 15000 });
  }

  const paidAfterFiveAds = await page.getByTestId('currency-paid-badge').textContent();
  const adsAfterFiveAds = await page.getByTestId('currency-ads-remaining').textContent();

  const paidBeforeLimitAttempt = parseIntSafe(paidAfterFiveAds);
  await page.getByTestId('currency-ad-button').click();
  await page.waitForTimeout(1200);

  const paidAfterLimitAttempt = await page.getByTestId('currency-paid-badge').textContent();
  const adsAfterLimitAttempt = await page.getByTestId('currency-ads-remaining').textContent();

  const paidBeforeBundle = parseIntSafe(paidAfterLimitAttempt);
  await page.getByTestId('currency-purchase-button').click();
  await page.waitForFunction((expectedPaid) => {
    const node = document.querySelector('[data-testid="currency-paid-badge"]');
    return Number.parseInt((node?.textContent || '').trim(), 10) === expectedPaid;
  }, paidBeforeBundle + 3, { timeout: 15000 });

  const paidAfterBundle = await page.getByTestId('currency-paid-badge').textContent();
  const duplicatePayload = {
    installationId: `qa_install_${Date.now()}`,
    provider: 'DARO',
    placementId: 'direct_duplicate_test',
    rewardClaimId: `reward_direct_${Date.now()}`,
  };
  const duplicateRewardCheck = {
    first: await fetch('http://127.0.0.1:8787/api/v1/wallet/rewarded-ad/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload),
    }).then((response) => response.json()).then((json) => json.data),
    second: await fetch('http://127.0.0.1:8787/api/v1/wallet/rewarded-ad/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicatePayload),
    }).then((response) => response.json()).then((json) => json.data),
  };
  const screenshotPath = path.join(process.cwd(), 'qa_currency_rewards_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    url: DEFAULT_URL,
    totalMs: Date.now() - startedAt,
    freeBefore,
    paidBefore,
    adsBefore,
    duplicateRewardCheck,
    paidAfterFiveAds,
    adsAfterFiveAds,
    paidAfterLimitAttempt,
    adsAfterLimitAttempt,
    paidAfterBundle,
    duplicateRewardPrevented: duplicateRewardCheck.first?.status === 'claimed'
      && duplicateRewardCheck.second?.status === 'duplicate'
      && duplicateRewardCheck.first?.wallet?.paidCoins === 1
      && duplicateRewardCheck.second?.wallet?.paidCoins === 1,
    adRewardsCappedAtFive: paidAfterFiveAds === '5' && paidAfterLimitAttempt === '5',
    limitAttemptDidNotIncreasePaidCoins: parseIntSafe(paidAfterLimitAttempt) === paidBeforeLimitAttempt,
    adRemainingReachedZero: /0\/5$/.test((adsAfterFiveAds || '').trim()) && /0\/5$/.test((adsAfterLimitAttempt || '').trim()),
    bundleAddedThreeCoins: paidAfterBundle === '8',
    screenshotPath,
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'qa_currency_rewards_result.json'),
    JSON.stringify(result, null, 2),
  );

  console.log(JSON.stringify(result, null, 2));

  if (
    !result.duplicateRewardPrevented
    || !result.adRewardsCappedAtFive
    || !result.limitAttemptDidNotIncreasePaidCoins
    || !result.adRemainingReachedZero
    || !result.bundleAddedThreeCoins
  ) {
    process.exitCode = 1;
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
