import React from 'react';

/* -------------------------------------------------------------------------- */
/* Global Styles                                                              */
/* -------------------------------------------------------------------------- */
export const GlobalStyles = () => React.createElement('style', null, `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');

    :root {
      --app-vh: 1vh;
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-right: env(safe-area-inset-right, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --safe-left: env(safe-area-inset-left, 0px);
      --glass-blur: 18px;
      --glass-blur-strong: 22px;
      --glass-saturation: 150%;
      --glass-bg: rgba(255, 255, 255, 0.72);
      --glass-border: rgba(255, 255, 255, 0.6);
      --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.08);
      --shadow-medium: 0 16px 48px rgba(0, 0, 0, 0.12);
      --clay-shadow-dark: #d1d9e6;
      --clay-shadow-light: #ffffff;
      --clay-inset: inset 4px 4px 8px rgba(0,0,0,0.05), inset -4px -4px 8px rgba(255,255,255,0.9);
      --text-primary: #1e293b;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --bg-primary: #f8fafc;
    }

    [data-theme='dark'] {
      --glass-bg: rgba(30, 41, 59, 0.68);
      --glass-border: rgba(255, 255, 255, 0.1);
      --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.28);
      --shadow-medium: 0 16px 48px rgba(0, 0, 0, 0.45);
      --clay-shadow-dark: #0a0f1c;
      --clay-shadow-light: #2d3b55;
      --clay-inset: inset 4px 4px 8px rgba(0,0,0,0.4), inset -4px -4px 8px rgba(255,255,255,0.05);
      --text-primary: #f1f5f9;
      --text-secondary: #cbd5e1;
      --text-muted: #64748b;
      --bg-primary: #020617;
    }

    @media (pointer: coarse), (prefers-reduced-motion: reduce) {
      :root {
        --glass-blur: 10px;
        --glass-blur-strong: 14px;
        --glass-saturation: 125%;
      }

      .backdrop-blur-sm,
      .backdrop-blur,
      .backdrop-blur-md,
      .backdrop-blur-lg,
      .backdrop-blur-xl,
      .backdrop-blur-2xl,
      .backdrop-blur-3xl {
        backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) !important;
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) !important;
      }

      .blur-2xl,
      .blur-3xl {
        filter: blur(24px) !important;
      }

      .animate-pulse {
        animation-duration: 2.2s !important;
      }
    }

    html {
      width: 100%;
      height: 100%;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      text-size-adjust: 100%;
    }

    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Outfit', 'Noto Sans KR', sans-serif;
      color: var(--text-primary);
      background-color: var(--bg-primary);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transition: background-color 0.5s ease, color 0.5s ease;
    }

    #root {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    button,
    input,
    textarea,
    select {
      font: inherit;
    }

    .h-dvh-screen {
      height: calc(var(--app-vh, 1vh) * 100);
      min-height: 100svh;
      height: 100dvh;
    }

    .app-shell {
      width: min(100vw, 480px);
      height: calc(var(--app-vh, 1vh) * 100);
      min-height: 100%;
      max-height: 100%;
      margin-inline: auto;
    }

    .safe-pad-top {
      padding-top: max(var(--safe-top), 0px);
    }

    .safe-pad-bottom {
      padding-bottom: max(var(--safe-bottom), 0px);
    }

    .safe-pad-x {
      padding-left: max(var(--safe-left), 0px);
      padding-right: max(var(--safe-right), 0px);
    }

    [data-theme='dark'] .text-slate-900,
    [data-theme='dark'] .text-slate-800,
    [data-theme='dark'] .text-slate-700 {
      color: var(--text-primary) !important;
    }

    [data-theme='dark'] .text-slate-600,
    [data-theme='dark'] .text-slate-500 {
      color: var(--text-secondary) !important;
    }

    [data-theme='dark'] .text-slate-400 {
      color: var(--text-muted) !important;
    }

    [data-theme='dark'] .bg-white {
      background-color: #1e293b !important;
    }

    [data-theme='dark'] .bg-white\/60,
    [data-theme='dark'] .bg-white\/70,
    [data-theme='dark'] .bg-white\/80,
    [data-theme='dark'] .bg-white\/90 {
      background-color: rgba(15, 23, 42, 0.7) !important;
    }

    [data-theme='dark'] .bg-white\/30 {
      background-color: rgba(2, 6, 23, 0.4) !important;
    }

    .glass-panel {
      position: relative;
      overflow: hidden;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
      border: 1px solid var(--glass-border);
      box-shadow:
        var(--shadow-soft),
        inset 0 1px 1px rgba(255,255,255,0.2),
        inset 0 -1px 1px rgba(0,0,0,0.02);
      transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
    }

    .glass-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    }

    .glass-pill {
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturation));
      -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturation));
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow:
        0 20px 50px -10px rgba(0, 0, 0, 0.12),
        0 10px 20px -5px rgba(0, 0, 0, 0.04),
        inset 0 2px 4px rgba(255, 255, 255, 1);
    }

    .glass-header {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturation));
      -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturation));
      border-bottom: 1px solid rgba(255, 255, 255, 0.4);
      transition: background-color 0.35s ease, box-shadow 0.35s ease;
    }

    .glass-header.scrolled {
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 4px 30px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02);
      border-bottom-color: rgba(0, 0, 0, 0.03);
    }

    .clay-card {
      background: linear-gradient(145deg, #ffffff, #f5f7fa);
      border-radius: 28px;
      box-shadow:
        12px 12px 24px var(--clay-shadow-dark),
        -12px -12px 24px var(--clay-shadow-light),
        inset 0 1px 2px rgba(255,255,255,1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      will-change: transform, box-shadow;
    }

    .clay-card:active {
      box-shadow:
        8px 8px 16px var(--clay-shadow-dark),
        -8px -8px 16px var(--clay-shadow-light),
        var(--clay-inset);
    }

    .typo-h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 2.25rem;
      line-height: 1.1;
      font-weight: 800;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .typo-h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      line-height: 1.3;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #1e293b;
    }

    .text-holographic {
      background: linear-gradient(90deg, #84fab0 0%, #8fd3f4 25%, #a18cd1 50%, #fbc2eb 75%, #84fab0 100%);
      background-size: 300% auto;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: holographic-shine 6s linear infinite;
    }

    .text-gradient-mint {
      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .btn-universe {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow:
        0 12px 40px -10px rgba(0, 0, 0, 0.35),
        0 4px 6px rgba(0, 0, 0, 0.1),
        inset 0 1px 1px rgba(255, 255, 255, 0.15);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .btn-universe::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transition: left 0.5s ease;
    }

    .btn-universe:hover::before {
      left: 100%;
    }

    .btn-icon-circle {
      background: linear-gradient(145deg, #ffffff, #f8fafc);
      color: #0f172a;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255,255,255,1);
    }

    .input-premium {
      background: rgba(255, 255, 255, 0.76);
      border: 1.5px solid rgba(255, 255, 255, 0.8);
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03), inset 0 2px 4px rgba(255,255,255,0.8);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
    }

    .input-premium:focus-within {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(132, 250, 176, 0.5);
      box-shadow:
        0 8px 24px rgba(132, 250, 176, 0.12),
        0 0 0 4px rgba(132, 250, 176, 0.08),
        inset 0 0 0 1px rgba(132, 250, 176, 0.25);
      transform: translateY(-1px);
    }

    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .gpu-accelerated { transform: translateZ(0); will-change: transform; backface-visibility: hidden; }
    .word-keep-all { word-break: keep-all; }

    .noise-overlay::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0.015;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    @keyframes holographic-shine {
      to { background-position: 300% center; }
    }

    @media (pointer: coarse), (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.18s !important;
        scroll-behavior: auto !important;
      }

      .glass-panel,
      .glass-pill,
      .glass-header {
        backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
      }
    }
`);

/* -------------------------------------------------------------------------- */
/* Logic & Data                                                               */
/* -------------------------------------------------------------------------- */
const BROKEN_DISPLAY_PATTERN = /�|占|\?{2,}|(^|[\s(])\?[가-힣A-Za-z(]|[가-힣A-Za-z]\?(?=[가-힣A-Za-z)])/u;

export const containsBrokenDisplayText = (value: unknown) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized) return false;
  return BROKEN_DISPLAY_PATTERN.test(normalized);
};

export const isValidDailyInsightsPayload = (insights: any) => {
  if (!insights || !Array.isArray(insights.luckyItems) || insights.luckyItems.length < 3) {
    return false;
  }

  const tips = [insights.sajuTip, insights.elementTip, insights.energyTip, insights.cycleTip];
  if (tips.some((tip) => typeof tip !== 'string' || !tip.trim() || containsBrokenDisplayText(tip))) {
    return false;
  }

  return insights.luckyItems.every((item: any) => (
    item
    && typeof item.emoji === 'string'
    && typeof item.name === 'string'
    && typeof item.type === 'string'
    && item.name.trim()
    && item.type.trim()
    && !containsBrokenDisplayText(item.name)
    && !containsBrokenDisplayText(item.type)
  ));
};

export const getElementStyle = (element: string) => {
  switch (element) {
    case '목':
      return {
        nameEn: 'Wood',
        bg: 'bg-[#ECFDF5]',
        text: 'text-[#065F46]',
        icon: '🌿',
        desc: '성장과 확장',
        yongshinMsg: '성장 에너지를 보충해줍니다.',
        yongshinReason: '새로운 시작, 회복, 관계 확장에 목 기운을 더하면 전체 균형이 좋아집니다.',
      };
    case '화':
      return {
        nameEn: 'Fire',
        bg: 'bg-[#FFF1F2]',
        text: 'text-[#9F1239]',
        icon: '🔥',
        desc: '열정과 추진력',
        yongshinMsg: '활력과 추진력을 높여줍니다.',
        yongshinReason: '주저함을 줄이고 표현력과 실행력을 끌어올리는 데 화 기운이 필요합니다.',
      };
    case '토':
      return {
        nameEn: 'Earth',
        bg: 'bg-[#FEFCE8]',
        text: 'text-[#854D0E]',
        icon: '⛰️',
        desc: '안정과 중심',
        yongshinMsg: '흐름을 안정적으로 잡아줍니다.',
        yongshinReason: '흩어진 기운을 모으고 현실 감각을 강화해주는 토 기운이 균형을 돕습니다.',
      };
    case '금':
      return {
        nameEn: 'Metal',
        bg: 'bg-[#F1F5F9]',
        text: 'text-[#334155]',
        icon: '⚙️',
        desc: '질서와 결단',
        yongshinMsg: '판단력과 구조를 세워줍니다.',
        yongshinReason: '복잡한 흐름을 정리하고 우선순위를 세우는 데 금 기운이 필요합니다.',
      };
    case '수':
      return {
        nameEn: 'Water',
        bg: 'bg-[#EFF6FF]',
        text: 'text-[#1E40AF]',
        icon: '💧',
        desc: '지혜와 유연성',
        yongshinMsg: '유연한 흐름과 통찰을 더합니다.',
        yongshinReason: '감정의 긴장을 누그러뜨리고 사고를 부드럽게 이어주는 수 기운이 중요합니다.',
      };
    default:
      return {
        nameEn: 'Unknown',
        bg: 'bg-gray-50',
        text: 'text-gray-400',
        icon: '•',
        desc: '미확인',
        yongshinMsg: '',
        yongshinReason: '',
      };
  }
};

export const calculateYongshin = (saju: any) => {
  if (!saju) return '수';

  const elements = [
    saju.year.stem.element, saju.year.branch.element,
    saju.month.stem.element, saju.month.branch.element,
    saju.day.stem.element, saju.day.branch.element,
    saju.hour.stem.element, saju.hour.branch.element,
  ];

  const counts: Record<string, number> = elements.reduce((acc: Record<string, number>, element: string) => {
    acc[element] = (acc[element] || 0) + 1;
    return acc;
  }, { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 });

  const priority = ['수', '목', '화', '토', '금'];
  for (const element of priority) {
    if (counts[element] === 0) return element;
  }

  let min = Number.POSITIVE_INFINITY;
  let target = '수';
  for (const element of priority) {
    if (counts[element] < min) {
      min = counts[element];
      target = element;
    }
  }

  return target;
};

export const heavenlyStems = [
  { kor: '갑', hanja: '甲', element: '목', polarity: '+' },
  { kor: '을', hanja: '乙', element: '목', polarity: '-' },
  { kor: '병', hanja: '丙', element: '화', polarity: '+' },
  { kor: '정', hanja: '丁', element: '화', polarity: '-' },
  { kor: '무', hanja: '戊', element: '토', polarity: '+' },
  { kor: '기', hanja: '己', element: '토', polarity: '-' },
  { kor: '경', hanja: '庚', element: '금', polarity: '+' },
  { kor: '신', hanja: '辛', element: '금', polarity: '-' },
  { kor: '임', hanja: '壬', element: '수', polarity: '+' },
  { kor: '계', hanja: '癸', element: '수', polarity: '-' },
].map((stem) => ({ ...stem, ...getElementStyle(stem.element) }));

export const earthlyBranches = [
  { kor: '자', hanja: '子', animal: '쥐', element: '수' },
  { kor: '축', hanja: '丑', animal: '소', element: '토' },
  { kor: '인', hanja: '寅', animal: '호랑이', element: '목' },
  { kor: '묘', hanja: '卯', animal: '토끼', element: '목' },
  { kor: '진', hanja: '辰', animal: '용', element: '토' },
  { kor: '사', hanja: '巳', animal: '뱀', element: '화' },
  { kor: '오', hanja: '午', animal: '말', element: '화' },
  { kor: '미', hanja: '未', animal: '양', element: '토' },
  { kor: '신', hanja: '申', animal: '원숭이', element: '금' },
  { kor: '유', hanja: '酉', animal: '닭', element: '금' },
  { kor: '술', hanja: '戌', animal: '개', element: '토' },
  { kor: '해', hanja: '亥', animal: '돼지', element: '수' },
].map((branch) => ({ ...branch, ...getElementStyle(branch.element) }));

export const twelveStages = [
  { name: '장생', hanja: '長生', energy: 0 },
  { name: '목욕', hanja: '沐浴', energy: 10 },
  { name: '관대', hanja: '冠帶', energy: 20 },
  { name: '건록', hanja: '建祿', energy: 40 },
  { name: '제왕', hanja: '帝旺', energy: 50 },
  { name: '쇠', hanja: '衰', energy: 60 },
  { name: '병', hanja: '病', energy: 80 },
  { name: '사', hanja: '死', energy: 100 },
  { name: '묘', hanja: '墓', energy: 70 },
  { name: '절', hanja: '絶', energy: 50 },
  { name: '태', hanja: '胎', energy: 30 },
  { name: '양', hanja: '養', energy: 10 },
];

export const calculate12Unseong = (stem: any, branch: any) =>
  twelveStages[(heavenlyStems.indexOf(stem) + earthlyBranches.indexOf(branch)) % 12];

export const calculateSaju = (year: number, month: number, day: number, hour = 12, minute = 0) => {
  const baseYear = 1984;
  let offsetYear = year - baseYear;
  if (offsetYear < 0) offsetYear += 6000;

  const yearStem = heavenlyStems[(offsetYear % 10 + 10) % 10];
  const yearBranch = earthlyBranches[(offsetYear % 12 + 12) % 12];

  const monthStemBase = (heavenlyStems.indexOf(yearStem) % 5) * 2 + 2;
  const monthBranchIndex = (month + 12) % 12;
  const monthStem = heavenlyStems[(monthStemBase + (monthBranchIndex - 2) + 10) % 10];
  const monthBranch = earthlyBranches[monthBranchIndex];

  const diffDays = Math.floor((new Date(year, month - 1, day).getTime() - new Date(1900, 0, 1).getTime()) / 86400000);
  const dayStem = heavenlyStems[(diffDays % 10 + 10) % 10];
  const dayBranch = earthlyBranches[(10 + diffDays % 12 + 12) % 12];

  const hourStemBase = (heavenlyStems.indexOf(dayStem) % 5) * 2;
  const hourBranchIndex = Math.floor((hour + 1) / 2) % 12;
  const hourStem = heavenlyStems[(hourStemBase + hourBranchIndex) % 10];
  const hourBranch = earthlyBranches[hourBranchIndex];

  return {
    year: { stem: yearStem, branch: yearBranch, twelveStage: calculate12Unseong(dayStem, yearBranch) },
    month: { stem: monthStem, branch: monthBranch, twelveStage: calculate12Unseong(dayStem, monthBranch) },
    day: { stem: dayStem, branch: dayBranch, twelveStage: calculate12Unseong(dayStem, dayBranch) },
    hour: { stem: hourStem, branch: hourBranch, twelveStage: calculate12Unseong(dayStem, hourBranch) },
  };
};

/* -------------------------------------------------------------------------- */
/* Helpers for Charts                                                         */
/* -------------------------------------------------------------------------- */
export const getCoordinates = (angle: number, value: number, maxVal: number, radius = 100, center = 150) => {
  const angleRad = (Math.PI / 180) * (angle - 90);
  const dist = (value / maxVal) * radius;
  return {
    x: center + dist * Math.cos(angleRad),
    y: center + dist * Math.sin(angleRad),
  };
};

export const svgPath = (points: { x: number; y: number }[], command: any) => {
  const d = points.reduce((acc, point, i, all) => (i === 0 ? `M ${point.x},${point.y}` : `${acc} ${command(point, i, all)}`), '');
  return `${d} Z`;
};

export const lineCommand = (point: any) => `L ${point.x} ${point.y}`;

export const bezierCommand = (point: any, i: number, all: any) => {
  const cps = controlPoint(all[i - 1], all[i - 2], point);
  const cpe = controlPoint(point, all[i - 1], all[i + 1], true);
  return `C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
};

const controlPoint = (current: any, previous: any, next: any, reverse?: boolean) => {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.2;
  const lineData = line(p, n);
  const angle = lineData.angle + (reverse ? Math.PI : 0);
  const length = lineData.length * smoothing;
  return {
    x: current.x + Math.cos(angle) * length,
    y: current.y + Math.sin(angle) * length,
  };
};

const line = (pointA: any, pointB: any) => {
  const lengthX = pointB.x - pointA.x;
  const lengthY = pointB.y - pointA.y;
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX),
  };
};
