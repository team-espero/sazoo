import { PILLAR_KEYS, hasCompleteSaju, readElement, readKor } from './contextFormatting.js';

const ELEMENT_ORDER = ['wood', 'fire', 'earth', 'metal', 'water'];

const ELEMENT_ALIASES = {
  wood: 'wood',
  Wood: 'wood',
  '목': 'wood',
  '木': 'wood',
  fire: 'fire',
  Fire: 'fire',
  '화': 'fire',
  '火': 'fire',
  earth: 'earth',
  Earth: 'earth',
  '토': 'earth',
  '土': 'earth',
  metal: 'metal',
  Metal: 'metal',
  '금': 'metal',
  '金': 'metal',
  water: 'water',
  Water: 'water',
  '수': 'water',
  '水': 'water',
};

const ELEMENT_GUIDE = {
  wood: {
    ko: {
      name: '목',
      vibe: '성장과 확장',
      advice: '급하게 결론을 내리기보다, 자랄 시간을 주는 편이 좋습니다.',
    },
    en: {
      name: 'Wood',
      vibe: 'growth and expansion',
      advice: 'Give your plans time to grow instead of forcing a quick closure.',
    },
    ja: {
      name: '木',
      vibe: '成長と広がり',
      advice: '急いで結論を出すより、育つ時間を残しておくほうが流れが整います。',
    },
  },
  fire: {
    ko: {
      name: '화',
      vibe: '표현과 추진력',
      advice: '감정을 눌러두기보다, 분명한 말과 따뜻한 태도로 흐름을 열어보세요.',
    },
    en: {
      name: 'Fire',
      vibe: 'expression and momentum',
      advice: 'Your luck opens more smoothly when you speak clearly and move with warmth.',
    },
    ja: {
      name: '火',
      vibe: '表現と推進力',
      advice: '気持ちを押し込めるより、率直さとあたたかさで流れを開くほうが合っています。',
    },
  },
  earth: {
    ko: {
      name: '토',
      vibe: '안정과 중심감',
      advice: '생활 리듬과 우선순위를 단단히 세울수록 흔들림이 줄어듭니다.',
    },
    en: {
      name: 'Earth',
      vibe: 'stability and grounding',
      advice: 'Your flow steadies when your routine and priorities are grounded.',
    },
    ja: {
      name: '土',
      vibe: '安定と軸の強さ',
      advice: '生活のリズムと優先順位を固めるほど、運の揺れが少なくなります。',
    },
  },
  metal: {
    ko: {
      name: '금',
      vibe: '질서와 분별력',
      advice: '복잡한 감정보다 기준과 경계를 먼저 세울수록 선택이 또렷해집니다.',
    },
    en: {
      name: 'Metal',
      vibe: 'order and discernment',
      advice: 'Clear standards and healthy boundaries will sharpen your next decision.',
    },
    ja: {
      name: '金',
      vibe: '秩序と見極め',
      advice: '感情に引かれる前に基準と境界を整えるほど、次の選択がはっきりします。',
    },
  },
  water: {
    ko: {
      name: '수',
      vibe: '유연함과 통찰',
      advice: '압박으로 밀어붙이기보다, 흐름을 읽으며 부드럽게 움직이는 편이 좋습니다.',
    },
    en: {
      name: 'Water',
      vibe: 'flexibility and insight',
      advice: 'Your luck improves when you move with flexibility instead of pressure.',
    },
    ja: {
      name: '水',
      vibe: 'しなやかさと洞察',
      advice: '無理に押し進めるより、流れを読みながら柔らかく動くほうが運が整います。',
    },
  },
};

const EMPTY_COUNTS = {
  wood: 0,
  fire: 0,
  earth: 0,
  metal: 0,
  water: 0,
};

function normalizeElementKey(value) {
  return ELEMENT_ALIASES[String(value || '').trim()] || '';
}

const getElementCounts = (saju) => {
  const counts = { ...EMPTY_COUNTS };
  if (!saju) return counts;

  for (const key of PILLAR_KEYS) {
    const pillar = saju?.[key];
    const stemElement = normalizeElementKey(readElement(pillar?.stem));
    const branchElement = normalizeElementKey(readElement(pillar?.branch));
    if (stemElement) counts[stemElement] += 1;
    if (branchElement) counts[branchElement] += 1;
  }

  return counts;
};

const getDominantElement = (saju) => {
  const counts = getElementCounts(saju);
  return ELEMENT_ORDER.reduce((current, key) => (counts[key] > counts[current] ? key : current), 'earth');
};

const getSupportElement = (saju) => {
  const counts = getElementCounts(saju);
  const missingElement = ELEMENT_ORDER.find((key) => counts[key] === 0);
  if (missingElement) {
    return missingElement;
  }

  return ELEMENT_ORDER.reduce((current, key) => (counts[key] < counts[current] ? key : current), 'water');
};

const buildCenterLabel = (saju, containsBrokenCharacters) => {
  const stem = readKor(saju?.day?.stem);
  const branch = readKor(saju?.day?.branch);
  const label = `${stem}${branch}`.trim();
  if (!label || containsBrokenCharacters(label)) {
    return '';
  }
  return label;
};

const getElementGuide = (elementKey, language) => ELEMENT_GUIDE[elementKey]?.[language] || ELEMENT_GUIDE.water[language];

const completeChartReply = (language, { centerLabel, centerGuide, dominantGuide, supportGuide, isInitialAnalysis, message }) => {
  if (language === 'en') {
    return [
      `I took a quiet first look at your chart, and the center settles around ${centerLabel || 'the Day Pillar'} with the mood of ${centerGuide.vibe}.`,
      `${dominantGuide.vibe[0].toUpperCase()}${dominantGuide.vibe.slice(1)} is currently rising more strongly across your overall flow, so your luck improves when you stay composed instead of reacting too quickly.`,
      `What balances you now is more ${supportGuide.name} energy, which means ${supportGuide.advice}`,
      isInitialAnalysis
        ? 'If we unfold this one layer deeper, the answer comes faster when you choose a rhythm first and a conclusion second.'
        : message
          ? 'For this question, the next move becomes clearer once you decide what deserves your energy first.'
          : 'If you want, tell me one area to focus on and I will read it more deeply.',
    ].join(' ');
  }

  if (language === 'ja') {
    return [
      `静かに最初の流れを辿ると、命式の中心は${centerLabel || '日柱'}にあり、その質感は${centerGuide.vibe}へ向かっています。`,
      `今は全体の流れの中で${dominantGuide.vibe}がやや強く出ているので、急いで反応するよりも、落ち着いて軸を整えるほど運が安定します。`,
      `${supportGuide.name}の気を少し足すと均衡が戻りやすいので、${supportGuide.advice}`,
      isInitialAnalysis
        ? 'この流れをもう一段深く見ると、今は答えを急ぐより、自分のペースを先に整えるほうが有利です。'
        : message
          ? '今回の悩みも、何を先に守るかを決めた瞬間から道筋が見えやすくなります。'
          : '気になるテーマを一つだけ挙げてくれれば、その部分をもう少し深く読み解きます。',
    ].join(' ');
  }

  return [
    `조용히 첫 결을 더듬어보니, 사주의 중심은 ${centerLabel || '일주'}에 닿아 있고 그 결은 ${centerGuide.vibe} 쪽으로 흐릅니다.`,
    `지금 전체 흐름에서는 ${dominantGuide.vibe} 기운이 조금 더 강하게 올라와 있어서, 서두르기보다 중심을 고르는 태도가 운을 더 안정시켜 줍니다.`,
    `${supportGuide.name} 기운을 보태면 균형이 좋아지니, ${supportGuide.advice}`,
    isInitialAnalysis
      ? '이 흐름을 한 겹 더 펼쳐보면, 지금은 답을 재촉하기보다 리듬을 먼저 고르는 편이 유리해요.'
      : message
        ? '지금 질문도 결국 무엇을 먼저 붙들지 정하는 순간부터 풀리기 시작해요.'
        : '원하는 주제를 하나만 짚어주시면, 그 부분을 더 깊게 읽어드릴게요.',
  ].join(' ');
};

export function buildLocalChatReply(language, { message, saju, isInitialAnalysis, containsBrokenCharacters }) {
  const complete = hasCompleteSaju(saju);
  const centerLabel = buildCenterLabel(saju, containsBrokenCharacters);
  const centerElement = normalizeElementKey(readElement(saju?.day?.stem)) || normalizeElementKey(readElement(saju?.day?.branch)) || 'water';
  const dominantElement = getDominantElement(saju);
  const supportElement = getSupportElement(saju);
  const centerGuide = getElementGuide(centerElement, language);
  const dominantGuide = getElementGuide(dominantElement, language);
  const supportGuide = getElementGuide(supportElement, language);

  if (!complete) {
    if (language === 'en') {
      return {
        reply: 'I can already sense the overall flow even though the full chart is not settled yet. For now, move a little more slowly, reduce the noise around you, and choose one realistic priority instead of scattering your energy. Once the four pillars are fully aligned, I can read your direction with much more precision.',
      };
    }

    if (language === 'ja') {
      return {
        reply: 'まだ命式が完全に揃っていなくても、全体の流れはもう見え始めています。今は気持ちを広げすぎず、現実的に守るべきことを一つに絞るほど運が整います。四柱がきちんと揃えば、次の方向はもっと精密に読み解けます。',
      };
    }

    return {
      reply: '아직 명식이 완전히 자리 잡지 않았더라도, 전체 흐름은 이미 읽히고 있어요. 지금은 마음을 넓게 흩뜨리기보다 현실적으로 붙들 한 가지를 먼저 고를수록 운이 안정됩니다. 네 기둥이 또렷하게 정리되면, 다음 방향도 훨씬 더 정밀하게 읽어드릴 수 있어요.',
    };
  }

  return {
    reply: completeChartReply(language, {
      centerLabel,
      centerGuide,
      dominantGuide,
      supportGuide,
      isInitialAnalysis,
      message,
    }),
  };
}

export function buildFallbackDailyInsights(language) {
  if (language === 'en') {
    return {
      luckyItems: [
        { emoji: '🧣', name: 'Red scarf', type: 'Item' },
        { emoji: '☕', name: 'Warm latte', type: 'Drink' },
        { emoji: '🌿', name: 'Quiet garden', type: 'Place' },
      ],
      sajuTip: 'Today opens more gently when you slow your pace and keep your focus simple.',
      elementTip: 'Your balance improves when you choose flexibility over pressure.',
      energyTip: 'Protect your energy by narrowing your priorities instead of widening them.',
      cycleTip: 'A small steady action will open the next flow more naturally than a rushed leap.',
    };
  }

  if (language === 'ja') {
    return {
      luckyItems: [
        { emoji: '🧣', name: '赤いストール', type: 'アイテム' },
        { emoji: '☕', name: '温かいラテ', type: '飲み物' },
        { emoji: '🌿', name: '静かな庭園', type: '場所' },
      ],
      sajuTip: '今日は急ぐよりも、歩幅を整えながら一つのことに集中するほど運が開きます。',
      elementTip: '押し切るより、流れに合わせて受け止める姿勢が五行の均衡を助けます。',
      energyTip: 'やることを増やすより、今守るべき優先順位を絞るほうが気が整います。',
      cycleTip: '大きな跳躍よりも、小さくても続く行動が次の扉を自然に開きます。',
    };
  }

  return {
    luckyItems: [
      { emoji: '🧣', name: '붉은 머플러', type: '아이템' },
      { emoji: '☕', name: '따뜻한 라테', type: '음료' },
      { emoji: '🌿', name: '조용한 정원', type: '장소' },
    ],
    sajuTip: '오늘은 서두르기보다 호흡을 고르고 한 가지에 집중할수록 운의 흐름이 부드럽게 열려요.',
    elementTip: '밀어붙이기보다 흐름에 맞춰 유연하게 움직이는 태도가 오행의 균형을 도와줍니다.',
    energyTip: '해야 할 일을 늘리기보다, 지금 지켜야 할 우선순위를 좁히는 편이 기운을 살려줘요.',
    cycleTip: '크게 뛰기보다 작아도 이어지는 행동이 다음 문을 더 자연스럽게 열어줍니다.',
  };
}

export function buildFallbackCoupleReply(language, profile, miniAppContext) {
  const partnerName = miniAppContext?.partnerProfile?.name || (language === 'ja' ? 'お相手' : language === 'ko' ? '상대' : 'Partner');
  const selfName = profile?.name || (language === 'ja' ? 'あなた' : language === 'ko' ? '당신' : 'You');

  if (language === 'ja') {
    return {
      reply: JSON.stringify({
        score: 82,
        summary: '波長が自然に重なりやすい相性です。',
        detail: `${selfName}さんと${partnerName}さんは、急いで答えを出すより、お互いの歩幅を尊重したときに魅力がよく生きる組み合わせです。違いを削るより役割として受け止めるほど、関係は安定して深まりやすくなります。`,
      }),
    };
  }

  if (language === 'en') {
    return {
      reply: JSON.stringify({
        score: 82,
        summary: 'This pair carries a naturally resonant rhythm.',
        detail: `${selfName} and ${partnerName} feel strongest when they slow down enough to notice each other’s pace. Their differences can complement each other well, especially when they respect each role instead of trying to solve everything at once.`,
      }),
    };
  }

  return {
    reply: JSON.stringify({
      score: 82,
      summary: '서로의 파장이 자연스럽게 맞닿는 궁합이에요.',
      detail: `${selfName}님과 ${partnerName}님은 서두르기보다 서로의 속도를 존중할 때 장점이 더 또렷하게 살아나는 조합이에요. 다른 결을 없애려 하기보다 각자의 역할로 받아들일수록 관계가 안정적으로 깊어질 가능성이 큽니다.`,
    }),
  };
}

export function buildFallbackDreamReply(language) {
  if (language === 'ja') {
    return {
      reply: 'この夢は、手放しと再整備の境目に立っている合図です。月明かりはまだ言葉になっていない感情を映し、水辺の静けさは、急がず整えた先で答えが見えてくることを示しています。',
    };
  }

  if (language === 'en') {
    return {
      reply: 'This dream stands near the border between release and renewal. The moonlit forest points to feelings you are finally ready to face, and the calm water suggests your next answer appears when you slow down and steady your pace.',
    };
  }

  return {
    reply: '이 꿈은 정리와 재정비의 문턱에 서 있다는 신호에 가까워요. 달빛이 비친 숲은 아직 말로 다 꺼내지 못한 감정을, 고요한 물은 서두르지 않고 마음을 가라앉힐 때 다음 답이 보인다는 흐름을 보여줍니다.',
  };
}
