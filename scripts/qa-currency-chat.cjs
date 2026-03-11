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

const getCoinCounterText = async (page) => {
  const matches = await page.locator('span').evaluateAll((nodes) =>
    nodes
      .map((node) => (node.textContent || '').trim())
      .filter((text) => /^\d+\/3$/.test(text)),
  );

  return matches[0] || null;
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
  const startedAt = Date.now();

  await page.goto(DEFAULT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await skipIntroIfNeeded(page);

  await page.getByRole('button', { name: UI.startReading }).click({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: UI.onboardingCta }).click({ timeout: 30000 });
  await page.getByRole('button', { name: UI.continueGuest }).click({ timeout: 30000 });

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

  const chatInput = page.getByPlaceholder(UI.chatPlaceholder, { exact: false });
  await chatInput.waitFor({ timeout: 45000 });
  await page.waitForFunction(() => {
    const matches = Array.from(document.querySelectorAll('span'))
      .map((node) => (node.textContent || '').trim())
      .filter((text) => /^\d+\/3$/.test(text));
    return matches.includes('3/3');
  }, { timeout: 15000 });

  const initialCounter = await getCoinCounterText(page);

  await page.route('**/api/v1/fortune/chat', async (route) => {
    const postData = route.request().postData() || '';
    if (postData.includes('refund test')) {
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  await chatInput.fill('refund test');
  await chatInput.press('Enter');
  await page.waitForTimeout(2500);
  const refundedCounter = await getCoinCounterText(page);

  await page.unroute('**/api/v1/fortune/chat');

  await chatInput.fill('success spend test');
  await chatInput.press('Enter');
  await page.waitForTimeout(4000);
  const successfulCounter = await getCoinCounterText(page);

  const screenshotPath = path.join(process.cwd(), 'qa_currency_chat_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    url: DEFAULT_URL,
    totalMs: Date.now() - startedAt,
    initialCounter,
    refundedCounter,
    successfulCounter,
    refundWorked: initialCounter === '3/3' && refundedCounter === '3/3',
    successSpentOne: successfulCounter === '2/3',
    screenshotPath,
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'qa_currency_chat_result.json'),
    JSON.stringify(result, null, 2),
  );

  console.log(JSON.stringify(result, null, 2));

  if (!result.refundWorked || !result.successSpentOne) {
    process.exitCode = 1;
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
