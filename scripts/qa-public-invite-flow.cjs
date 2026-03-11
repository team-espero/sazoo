const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEFAULT_BASE_URL = process.env.QA_PUBLIC_URL || 'https://sazoo.vercel.app';
const UI = {
  introPlay: /인트로 재생|Start|再生/,
  introSkip: /건너뛰기|Skip|スキップ/,
  startReading: /운세 시작하기|Start Reading|運勢を始める/,
  inviteStart: /공유된 비교 결과 열기|Open shared comparison|共有された比較結果を開く/,
  onboardingCta: /정보 입력하고 운세 보기|Enter info and view reading|情報を入力して鑑定を見る/,
  continueGuest: /게스트로 계속하기|Continue as Guest|ゲストとして続行/,
  next: /다음 단계로|Next|次へ/,
  analyze: /운세 분석하기|Start Analysis|鑑定を開始|鑑定を始める/,
  concernWealth: /재물|Wealth|金運|Money/,
  namePlaceholder: /이름을 입력해주세요|Enter your name|名前を入力してください/,
  rewardTitle: /초대 보상|Invite reward|招待報酬/,
  rewardContinue: /계속 보기|Continue|続ける/,
  restoreTitle: /비교 화면을 복원|comparison sent to you|比較画面を復元|공유된 비교 결과/,
  restoreContinue: /복원된 화면 보기|Open restored screen|復元された画面を開く/,
  specialReports: /특수 리포트|Special Reports|特別レポート/,
  comparisonReport: /비교 리포트|comparison report|比較レポート/,
  homeGreeting: /안녕하세요|Hello|こんにちは/,
  male: /Boy Male|Male|남성|男性|Boy|Man/,
};

const encodeBase64Url = (value) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const buildInviteUrl = (baseUrl) => {
  const payload = {
    version: 1,
    inviteId: `invite_qa_${Date.now()}`,
    source: 'daily_fortune',
    targetTab: 'home',
    inviterName: 'Sazoo QA',
    previewTitle: 'Shared comparison',
    previewSummary: 'A shared result is waiting.',
    comparisonSummary: 'This invite should restore the target screen after onboarding.',
    createdAt: new Date().toISOString(),
  };
  const url = new URL(baseUrl);
  url.pathname = `/compare/${encodeBase64Url(JSON.stringify(payload))}`;
  return { url: url.toString(), payload };
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const skipIntroIfNeeded = async (page) => {
  const playButton = page.getByRole('button', { name: UI.introPlay });
  const skipButton = page.getByRole('button', { name: UI.introSkip });

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await wait(800);
  }

  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
};

const startButtonPattern = /공유된 비교 결과 열기|Open shared comparison|共有された比較結果を開く|운세 시작하기|Start Reading|運勢を始める/;

const completeOnboarding = async (page) => {
  await page.getByRole('button', { name: startButtonPattern }).click({ timeout: 30000 });
  await wait(1200);

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
};

const readInviteState = async (page) => {
  return page.evaluate(() => {
    const parse = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    return {
      wallet: parse('sazoo_coins'),
      claimedInviteRewards: parse('claimed_invite_rewards_v1'),
      specialReports: parse('special_report_unlocks_v1'),
    };
  });
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const baseUrl = process.env.QA_BASE_URL || DEFAULT_BASE_URL;
  const { url: inviteUrl, payload } = buildInviteUrl(baseUrl);
  const started = Date.now();

  await page.goto(inviteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(2000);
  await skipIntroIfNeeded(page);

  const landingStartButton = page.getByRole('button', { name: startButtonPattern }).first();
  await landingStartButton.waitFor({ timeout: 30000 });
  const landingStartLabel = ((await landingStartButton.textContent()) || '').trim();
  const inviteLandingCtaVisible = /공유된 비교 결과 열기|Open shared comparison|共有された比較結果を開く/.test(landingStartLabel);

  await completeOnboarding(page);

  const rewardModal = page.getByText(UI.rewardTitle).first();
  await rewardModal.waitFor({ timeout: 45000 });
  const rewardModalVisible = await rewardModal.isVisible();

  const rewardContinueButton = page.getByRole('button', { name: UI.rewardContinue });
  const screenshotPath = path.join(process.cwd(), 'qa_public_invite_flow_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const firstState = await readInviteState(page);
  await rewardContinueButton.click({ timeout: 10000 });

  const restoreModal = page.getByText(UI.restoreTitle).first();
  await restoreModal.waitFor({ timeout: 15000 });
  const restoreModalVisible = await restoreModal.isVisible().catch(() => false);
  const restoreContinueButton = page.getByRole('button', { name: UI.restoreContinue }).first();
  if (await restoreContinueButton.isVisible().catch(() => false)) {
    await restoreContinueButton.click({ timeout: 10000 });
  }

  const homeGreetingVisible = await page.getByText(UI.homeGreeting).first().isVisible().catch(() => false);
  const bottomNav = page.locator('div.absolute.bottom-0.left-0.w-full.safe-pad-x div.glass-pill').last();
  const profileTabButton = bottomNav.locator('button').nth(4);
  await profileTabButton.waitFor({ timeout: 15000 });
  await profileTabButton.evaluate((node) => node.click());
  await wait(1800);
  await page.mouse.wheel(0, 2400).catch(() => {});
  await wait(800);
  const specialReportsSectionVisible = await page.getByText(UI.specialReports).isVisible().catch(() => false);
  const unlockedReportVisible =
    await page.getByText(UI.comparisonReport).first().isVisible().catch(() => false)
    || await page.getByRole('button', { name: /리포트 보기|View Report|レポートを見る/ }).first().isVisible().catch(() => false);
  const profileScreenshotPath = path.join(process.cwd(), 'qa_public_invite_flow_profile_result.png');
  await page.screenshot({ path: profileScreenshotPath, fullPage: true });

  await page.goto(inviteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(1800);
  await skipIntroIfNeeded(page);
  await wait(1800);

  const mainAutoRestored = await page.getByText(UI.restoreTitle).first().isVisible().catch(() => false);
  if (!mainAutoRestored) {
    const startButton = page.getByRole('button', { name: startButtonPattern }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click({ timeout: 30000 });
    }
  }

  const duplicateRewardVisible = await rewardModal.isVisible().catch(() => false);
  const duplicateRestoreVisible = await page.getByText(UI.restoreTitle).first().isVisible().catch(() => false);
  await wait(1500);
  const secondState = await readInviteState(page);

  const result = {
    baseUrl,
    inviteUrl,
    inviteId: payload.inviteId,
    inviteLandingCtaVisible,
    rewardModalVisible,
    restoreModalVisible,
    restoredHomeVisible: homeGreetingVisible,
    specialReportsSectionVisible,
    unlockedReportVisible,
    firstWallet: firstState.wallet,
    firstClaimedInviteRewards: firstState.claimedInviteRewards,
    firstSpecialReportCount: Array.isArray(firstState.specialReports) ? firstState.specialReports.length : 0,
    duplicateRewardPrevented: !duplicateRewardVisible,
    duplicateRestoreVisible,
    secondWallet: secondState.wallet,
    secondClaimedInviteRewards: secondState.claimedInviteRewards,
    secondSpecialReportCount: Array.isArray(secondState.specialReports) ? secondState.specialReports.length : 0,
    totalMs: Date.now() - started,
    screenshotPath,
    profileScreenshotPath,
  };

  fs.writeFileSync(path.join(process.cwd(), 'qa_public_invite_flow_result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});


