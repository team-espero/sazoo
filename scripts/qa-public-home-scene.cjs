const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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
  homeGreeting: /안녕하세요|Hello|こんにちは/,
  networkFallback: /연결의 결이 잠시 흔들렸어요|Connection is unstable|接続が不安定です/,
  male: /Boy Male|Male|남성|男性|Boy|Man/,
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
  const url = process.env.QA_PUBLIC_URL || 'https://sazoo.vercel.app';
  const started = Date.now();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const playButton = page.getByRole('button', { name: UI.introPlay });
  const skipButton = page.getByRole('button', { name: UI.introSkip });

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(1000);
  }

  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }

  await page.getByRole('button', { name: UI.startReading }).click({ timeout: 30000 });
  await page.waitForTimeout(1200);

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

  const analyzeStart = Date.now();
  await page.getByRole('button', { name: UI.analyze }).click();
  await page.getByPlaceholder(UI.chatPlaceholder, { exact: false }).waitFor({ timeout: 45000 });

  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('p.text-center'));
    return nodes.some((node) => {
      const text = (node.textContent || '').trim();
      return text.length >= 30
        && !text.includes('사주를 더 또렷하게 읽으려면')
        && !text.includes('운명의 결을 읽는 중이에요')
        && !text.includes('연결의 결이 잠시 흔들렸어요');
    });
  }, { timeout: 45000 });

  const bubbleText = ((await page.locator('p.text-center').first().textContent()) || '').trim();
  const firstResultMs = Date.now() - analyzeStart;
  const chatInputVisible = await page.getByPlaceholder(UI.chatPlaceholder, { exact: false }).isVisible().catch(() => false);
  const networkFallbackVisible = await page.getByText(UI.networkFallback).isVisible().catch(() => false);

  await page.getByTestId('chat-menu-button').click({ timeout: 15000 });
  await page.getByTestId('chat-menu-home').click({ timeout: 15000 });
  await page.waitForTimeout(3000);

  const homeCanvasVisible = await page.locator('canvas').first().isVisible().catch(() => false);
  const homeErrorVisible = await page.getByText('3D preview is taking a break.').isVisible().catch(() => false);
  const homeGreetingVisible = await page.getByText(UI.homeGreeting).first().isVisible().catch(() => false);

  const screenshotPath = path.join(process.cwd(), 'qa_public_home_scene_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const result = {
    publicUrl: url,
    firstResultMs,
    firstBubblePreview: bubbleText.slice(0, 220),
    chatInputVisible,
    networkFallbackVisible,
    homeCanvasVisible,
    homeErrorVisible,
    homeGreetingVisible,
    totalMs: Date.now() - started,
    screenshotPath,
  };

  fs.writeFileSync(path.join(process.cwd(), 'qa_public_home_scene_result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
