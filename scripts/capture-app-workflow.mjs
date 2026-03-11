import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:5180';
const USE_API_MOCKS = process.env.CAPTURE_USE_MOCKS !== '0';
const now = new Date();
const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
const outputDir = process.env.CAPTURE_OUTPUT_DIR
  ? path.resolve(process.env.CAPTURE_OUTPUT_DIR)
  : path.join(process.cwd(), 'docs', 'figma-workflow-captures', timestamp);

const shots = [];
let shotIndex = 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

function nextFileName(label) {
  return `${String(shotIndex).padStart(2, '0')}_${label}.png`;
}

async function snapshot(page, label, description) {
  const fileName = nextFileName(label);
  const absolutePath = path.join(outputDir, fileName);
  await page.screenshot({
    path: absolutePath,
    fullPage: false,
    animations: 'disabled',
  });
  shots.push({ order: shotIndex, label, fileName, description });
  shotIndex += 1;
}

async function isVisible(locator, timeout = 1500) {
  try {
    return await locator.first().isVisible({ timeout });
  } catch {
    return false;
  }
}

async function clickIfVisible(locator) {
  if (await isVisible(locator)) {
    await locator.first().click({ force: true });
    return true;
  }
  return false;
}

async function dismissNotificationIfVisible(page) {
  const modal = page.locator('div[class*="z-[100]"][class*="absolute"][class*="inset-0"]');
  if (!(await isVisible(modal, 500))) {
    return false;
  }

  const buttons = modal.locator('button');
  if ((await buttons.count()) > 0) {
    await buttons.last().click({ force: true });
  } else {
    const backdrop = modal.locator('div.absolute.inset-0').last();
    await clickIfVisible(backdrop);
  }

  await sleep(250);
  return true;
}

async function installApiMocks(page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.endsWith('/fortune/daily-insights')) {
      const payload = {
        luckyItems: [
          { emoji: 'scarf', name: 'Red Scarf', type: 'Item' },
          { emoji: 'coffee', name: 'Latte', type: 'Food' },
          { emoji: 'park', name: 'Park', type: 'Place' },
          { emoji: 'palette', name: 'Navy Blue', type: 'Color' },
        ],
        sajuTip: 'Your day pillar leads the pace. Keep one priority in focus.',
        elementTip: 'Wood and water harmony helps your momentum today.',
        energyTip: 'Your missing elements are growth clues. Balance rest and action.',
        cycleTip: 'Current cycle rewards steady execution over quick wins.',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: payload }),
      });
      return;
    }

    if (pathname.endsWith('/fortune/chat')) {
      let message = '';
      try {
        const body = request.postDataJSON();
        message = typeof body?.message === 'string' ? body.message : '';
      } catch {
        // Ignore parse failures and use fallback reply.
      }

      let reply = 'Your current flow favors practical action and stable communication.';

      if (/strict JSON only/i.test(message)) {
        reply = JSON.stringify({
          score: 88,
          summary: 'Strong complementary rhythm.',
          detail: 'You balance each other well in emotional pace and practical decisions. Clear communication and shared routines can steadily deepen trust.',
        });
      } else if (/dream interpreter|dream reading|dream/i.test(message)) {
        reply = 'This dream points to transition and reset. Release pressure and move into your next step with a calmer pace.';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { reply } }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Mock endpoint not found' } }),
    });
  });
}

function onboardingRoot(page) {
  return page.locator('div[class*="pt-12"][class*="pb-28"][class*="overflow-y-auto"]').last();
}

async function clickOnboardingPrimary(page) {
  const root = onboardingRoot(page);
  const button = root.locator('button.btn-universe:visible').first();
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click({ force: true });
  await sleep(350);
}

async function clickDrawerItem(page, index) {
  await dismissNotificationIfVisible(page);
  const menuButton = page.locator('button:has(svg.lucide-menu)').first();
  await menuButton.waitFor({ state: 'visible', timeout: 10000 });
  await menuButton.click({ force: true });
  await sleep(250);
  const drawer = page.locator('div.fixed.top-0.right-0.h-full').first();
  if (!(await isVisible(drawer, 5000))) {
    await dismissNotificationIfVisible(page);
    await menuButton.click({ force: true });
  }

  await drawer.waitFor({ state: 'visible', timeout: 10000 });
  const items = drawer.locator('div.flex-1 > button');
  const count = await items.count();

  if (count === 0) {
    throw new Error('Failed to click drawer item');
  }

  const targetIndex = Math.min(index, count - 1);
  await items.nth(targetIndex).click({ force: true });
  await sleep(800);
}

async function clickBottomTab(page, index) {
  const tabs = page.locator('div.glass-pill > button');
  await tabs.nth(index).waitFor({ state: 'visible', timeout: 10000 });
  await tabs.nth(index).click({ force: true });
  await sleep(800);
}

async function waitForLanding(page) {
  const title = page.locator('h1:has-text("Sazoo")');
  for (let i = 0; i < 30; i += 1) {
    if (await isVisible(title)) {
      return;
    }
    await clickIfVisible(page.locator('button').filter({ hasText: /skip|start/i }));
    await sleep(500);
  }
  await title.waitFor({ state: 'visible', timeout: 30000 });
}

async function openOnboardingFromChat(page) {
  const onboardingBtn = page.locator('div[class*="bottom-[15%]"] button.btn-universe').first();
  if (await isVisible(onboardingBtn, 4000)) {
    await onboardingBtn.click({ force: true });
  } else {
    const fallback = page.locator('button.btn-universe:visible').last();
    await fallback.click({ force: true });
  }
  await onboardingRoot(page).waitFor({ state: 'visible', timeout: 12000 });
}

async function createSecondaryProfile(page) {
  const openSwitcherCard = page.locator('div.cursor-pointer').filter({ has: page.locator('svg.lucide-users') }).first();
  await openSwitcherCard.waitFor({ state: 'visible', timeout: 10000 });
  await openSwitcherCard.click({ force: true });
  await sleep(500);
  await snapshot(page, 'profile_switcher', 'Profile switcher modal');

  const addButton = page.locator('div.fixed.inset-0.z-50 button:has(svg.lucide-plus)').first();
  if (await isVisible(addButton)) {
    await addButton.click({ force: true });
    await sleep(500);
    await snapshot(page, 'profile_add_modal', 'Add profile modal');

    const editModal = page.locator('div.fixed.inset-0[class*="z-[60]"]').last();
    const nameInput = editModal.locator('input[type="text"]').first();
    await nameInput.fill('Minji');

    const saveButton = editModal.locator('button').last();
    await saveButton.click({ force: true });
    await sleep(700);
  }

  await snapshot(page, 'profile_switcher_with_added_profile', 'Profile switcher after adding one profile');

  await page.evaluate(() => {
    const switcher = Array.from(document.querySelectorAll('div')).find((el) => {
      const cls = typeof el.className === 'string' ? el.className : '';
      return cls.includes('z-50') && cls.includes('fixed') && cls.includes('inset-0');
    });
    if (!switcher) return;
    const unlockTile = Array.from(switcher.querySelectorAll('div')).find((el) => {
      const cls = typeof el.className === 'string' ? el.className : '';
      return cls.includes('border-dashed') && cls.includes('cursor-pointer');
    });
    if (unlockTile instanceof HTMLElement) unlockTile.click();
  });
  await sleep(500);

  const premiumModal = page.locator('div.fixed.inset-0[class*="z-[70]"]').first();
  if (await isVisible(premiumModal)) {
    await snapshot(page, 'profile_upgrade_modal', 'Premium upgrade modal');
    const closeButton = premiumModal.locator('button').last();
    await closeButton.click({ force: true });
    await sleep(350);
  }

  await page.locator('div.fixed.inset-0.z-50 > div.absolute.inset-0').first().click({ force: true });
  await sleep(400);
}

async function openProfileEditModal(page) {
  const settingsRows = page.locator('div.p-4.flex.items-center.justify-between.cursor-pointer');
  await settingsRows.first().click({ force: true });
  await sleep(500);

  const editModal = page.locator('div.fixed.inset-0[class*="z-[60]"]').first();
  if (await isVisible(editModal)) {
    await snapshot(page, 'profile_edit_modal', 'Edit profile modal');
    const closeBtn = editModal.locator('button').first();
    await closeBtn.click({ force: true });
    await sleep(300);
  }
}

async function run() {
  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    locale: 'ko-KR',
  });

  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const page = await context.newPage();
  if (USE_API_MOCKS) {
    await installApiMocks(page);
  }

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await sleep(1300);

    await snapshot(page, 'intro', 'Intro video screen');

    await waitForLanding(page);
    await sleep(700);
    await snapshot(page, 'landing', 'Landing screen with language selector');

    await page.locator('button.btn-universe').first().click({ force: true });
    await sleep(1200);
    await snapshot(page, 'chat_pre_onboarding', 'Chat intro before onboarding');

    await openOnboardingFromChat(page);
    await snapshot(page, 'onboarding_step0_login', 'Onboarding step 0 (social login)');

    const root = onboardingRoot(page);
    const guestButton = root
      .locator('button')
      .filter({ hasText: /게스트로 계속하기|Continue as Guest|ゲストとして続行/i })
      .first();
    if (await isVisible(guestButton)) {
      await guestButton.click({ force: true });
    } else {
      await root.locator('button').first().click({ force: true });
    }

    const nameInput = root.locator('input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill('Kim');
    await clickIfVisible(root.locator('span:has-text("Male")'));
    await snapshot(page, 'onboarding_step1_profile', 'Onboarding step 1 (name and gender)');

    await clickOnboardingPrimary(page);
    await root.locator('div.flex.flex-wrap').first().waitFor({ state: 'visible', timeout: 10000 });
    await root.locator('div.flex.flex-wrap button').first().click({ force: true });
    await snapshot(page, 'onboarding_step2_concern', 'Onboarding step 2 (concern selection)');

    await clickOnboardingPrimary(page);
    await root.locator('div[class*="wheel"], div[class*="h-[140px]"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await snapshot(page, 'onboarding_step3_birth', 'Onboarding step 3 (birth data input)');

    await clickOnboardingPrimary(page);
    await page.locator('video[src="/checking_saju.mp4"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await sleep(500);
    await snapshot(page, 'analyzing', 'Analyzing screen');

    await page.locator('video[src="/checking_saju.mp4"]').first().waitFor({ state: 'hidden', timeout: 15000 });
    await page.locator('input[placeholder]').first().waitFor({ state: 'visible', timeout: 20000 });
    await sleep(500);
    await snapshot(page, 'chat_main', 'Main chat after onboarding');

    await clickDrawerItem(page, 0);
    await snapshot(page, 'home', 'Home tab');

    const sceneMenuButton = page.locator('button:has(svg.lucide-layout-grid)').first();
    await sceneMenuButton.click({ force: true });
    await sleep(400);
    await snapshot(page, 'home_scene_menu', 'Home scene selector menu');
    await sceneMenuButton.click({ force: true });
    await sleep(300);

    await clickBottomTab(page, 2);
    await snapshot(page, 'calendar', 'Calendar tab');

    await page.evaluate(() => {
      const target = Array.from(document.querySelectorAll('div')).find((el) => {
        const cls = typeof el.className === 'string' ? el.className : '';
        return cls.includes('min-h-[64px]') && cls.includes('cursor-pointer');
      });
      if (target instanceof HTMLElement) target.click();
    });
    await sleep(600);
    await snapshot(page, 'calendar_detail_sheet', 'Calendar day detail bottom sheet');
    await clickIfVisible(page.locator('button[aria-label]').first());

    await clickBottomTab(page, 4);
    await snapshot(page, 'profile', 'Profile tab');

    try {
      await createSecondaryProfile(page);
      await openProfileEditModal(page);
    } catch (error) {
      console.warn('Optional profile detail capture failed:', error);
    }

    await clickBottomTab(page, 3);
    await snapshot(page, 'miniapps', 'Mini apps tab');

    try {
      const miniAppCards = page.locator('div.grid.grid-cols-2 > button');
      await miniAppCards.first().click({ force: true });
      await sleep(500);
      await snapshot(page, 'miniapps_couple_select_modal', 'Couple app partner selection modal');

      await page.evaluate(() => {
        const modal = Array.from(document.querySelectorAll('div')).find((el) => {
          const cls = typeof el.className === 'string' ? el.className : '';
          return cls.includes('fixed') && cls.includes('inset-0') && cls.includes('z-50');
        });
        if (!modal) return;
        const partnerCard = Array.from(modal.querySelectorAll('div')).find((el) => {
          const cls = typeof el.className === 'string' ? el.className : '';
          return cls.includes('cursor-pointer') && cls.includes('space-x-4');
        });
        if (partnerCard instanceof HTMLElement) partnerCard.click();
      });

      await sleep(700);
      await snapshot(page, 'miniapps_couple_input', 'Couple app input screen');

      await page.locator('button.btn-universe').first().click({ force: true });
      await sleep(800);
      await snapshot(page, 'miniapps_couple_analyzing', 'Couple app analyzing state');

      await page.locator('div.text-6xl').first().waitFor({ state: 'visible', timeout: 12000 });
      await snapshot(page, 'miniapps_couple_result', 'Couple app result screen');

      await page.locator('button:has(svg.lucide-chevron-right.rotate-180)').first().click({ force: true });
      await sleep(700);

      await miniAppCards.nth(2).click({ force: true });
      await sleep(500);
      await snapshot(page, 'miniapps_dream_input', 'Dream interpretation input screen');

      const dreamInput = page.locator('input[type="text"]').first();
      await dreamInput.click({ force: true });
      await dreamInput.fill('I was flying above a forest and then found a bright gate.');
      if (!(await dreamInput.inputValue())) {
        await dreamInput.type('Flying dream near a bright gate.');
      }

      const dreamAnalyzeButton = page.locator('button.btn-universe').first();
      await dreamAnalyzeButton.click({ force: true });

      const dreamResultBadge = page.locator('div.w-24.h-24.rounded-full').first();
      try {
        await dreamResultBadge.waitFor({ state: 'visible', timeout: 70000 });
        await snapshot(page, 'miniapps_dream_result', 'Dream interpretation result screen');
      } catch {
        await snapshot(page, 'miniapps_dream_pending', 'Dream interpretation after submit (result not shown within timeout)');
      }
    } catch (error) {
      console.warn('Optional mini app detail capture failed:', error);
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const lines = [
    '# Sazoo Workflow Screen Captures',
    '',
    `- Base URL: \`${BASE_URL}\``,
    `- API Mocks: \`${USE_API_MOCKS ? 'enabled' : 'disabled'}\``,
    `- Captured At (UTC): \`${now.toISOString()}\``,
    `- Total Screens: \`${shots.length}\``,
    '',
    '| No | File | Screen |',
    '|---|---|---|',
    ...shots.map((shot) => `| ${shot.order} | ${shot.fileName} | ${shot.description} |`),
    '',
  ];

  await fs.writeFile(path.join(outputDir, 'index.md'), lines.join('\n'), 'utf8');

  console.log(`CAPTURE_DIR=${outputDir}`);
  console.log(`CAPTURE_COUNT=${shots.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
