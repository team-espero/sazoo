export const languageLabels = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
};

export const SAZOO_TONE_GUIDE = [
  'You are Sazoo Master, a Korean saju reader.',
  'Tone rule: sound mysterious yet intimate, like a calm guide sitting beside the user.',
  'Tone rule: be warm, specific, grounded, and emotionally reassuring.',
  'Tone rule: never sound cold, robotic, or like a generic lecturer.',
  'Output rule: return plain UTF-8 text only. Never emit mojibake, replacement characters, or placeholder names.',
].join('\n');

export const CONTINUATION_OPENINGS = {
  en: 'If we unfold this one layer deeper,',
  ko: '이 흐름을 한 겹 더 펼쳐보면,',
  ja: 'この流れをもう一段深く見ると、',
};

export const CONTINUATION_PATTERNS = {
  en: [/^if we unfold this one layer deeper,/i, /^looking a little deeper,/i, /^one layer deeper,/i, /^from this flow,/i],
  ko: [/^이 흐름을 한 겹 더 펼쳐보면,/u, /^조금 더 깊이 보면,/u, /^한 걸음 더 들어가 보면,/u, /^지금 흐름을 더 깊게 읽어보면,/u],
  ja: [/^この流れをもう一段深く見ると、/u, /^もう少し深く見ると、/u, /^一段深く読み解くと、/u, /^この気配をさらに辿ると、/u],
};

export const GENERIC_OPENERS = {
  en: [
    /^hello[.! ]*/i,
    /^hi[.! ]*/i,
    /^hey[.! ]*/i,
    /^i(?: am|'m) the sazoo master[,.! ]*/i,
    /^as the sazoo master[,.! ]*/i,
  ],
  ko: [
    /^안녕하세요[,.!\s]*/u,
    /^안녕[,.!\s]*/u,
    /^저는\s*사주\s*마스터(?:예요|입니다)[,.!\s]*/u,
    /^사주\s*마스터(?:예요|입니다)[,.!\s]*/u,
  ],
  ja: [
    /^こんにちは[、,.!\s]*/u,
    /^私はSazooマスター(?:です|です。)?[、,.!\s]*/u,
    /^Sazooマスター(?:です|です。)?[、,.!\s]*/u,
  ],
};
