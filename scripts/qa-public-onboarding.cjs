const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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
  const url = process.env.QA_PUBLIC_URL || 'https://sazoo.vercel.app';
  const started = Date.now();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const skipButton = page.getByRole('button', { name: /건너뛰기|Skip|スキップ/ });
  const playButton = page.getByRole('button', { name: /인트로 재생|Start|再生/ });

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(1000);
  }
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }

  await page.getByRole('button', { name: '운세 시작하기' }).click({ timeout: 30000 });
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: '정보 입력하고 운세 보기' }).click({ timeout: 30000 });
  await page.getByRole('button', { name: '게스트로 계속하기' }).click({ timeout: 30000 });

  await page.getByPlaceholder('이름을 입력해주세요').fill('김형욱');
  await page.getByRole('button', { name: /Boy Male|Male/ }).first().click();
  await page.getByRole('button', { name: '다음 단계로' }).click();

  await page.getByRole('button', { name: /재물/ }).click();
  await page.getByRole('button', { name: '다음 단계로' }).click();

  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill('1993');
  await numberInputs.nth(1).fill('5');
  await numberInputs.nth(2).fill('6');
  await numberInputs.nth(3).fill('11');
  await numberInputs.nth(4).fill('30');
  const analyzeStart = Date.now();
  await page.getByRole('button', { name: '운세 분석하기' }).click();

  await page.getByPlaceholder('궁금한 점을 물어보세요...', { exact: true }).waitFor({ timeout: 45000 });

  await page.waitForFunction(() => {
    const node = document.querySelector('p.text-center');
    if (!node) return false;
    const text = (node.textContent || '').trim();
    return text.length >= 30
      && !text.includes('사주를 더 또렷하게 읽으려면')
      && !text.includes('운명의 결을 읽는 중이에요')
      && !text.includes('연결의 결이 잠시 흔들렸어요');
  }, { timeout: 45000 });

  const bubbleText = ((await page.locator('p.text-center').first().textContent()) || '').trim();
  const inputVisible = await page.getByPlaceholder('궁금한 점을 물어보세요...', { exact: true }).isVisible();
  const networkFallbackVisible = await page.getByText('연결의 결이 잠시 흔들렸어요.').isVisible().catch(() => false);
  const firstResultMs = Date.now() - analyzeStart;
  const totalMs = Date.now() - started;
  const screenshotPath = path.join(process.cwd(), 'qa_public_onboarding_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    publicUrl: url,
    inputVisible,
    networkFallbackVisible,
    firstResultMs,
    totalMs,
    bubbleLength: bubbleText.length,
    bubblePreview: bubbleText.slice(0, 220),
    screenshotPath,
  };

  fs.writeFileSync(path.join(process.cwd(), 'qa_public_onboarding_result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
