export const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];

export function readKor(value) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.kor || '';
}

export function readElement(value) {
  if (!value || typeof value === 'string') return '';
  return value.element || '';
}

export function hasCompleteSaju(saju) {
  return PILLAR_KEYS.every((key) => readKor(saju?.[key]?.stem) && readKor(saju?.[key]?.branch));
}

function formatPillar(label, pillar) {
  if (!pillar?.stem || !pillar?.branch) {
    return `${label}: unavailable`;
  }

  const stemKor = readKor(pillar.stem);
  const branchKor = readKor(pillar.branch);
  const stemElement = readElement(pillar.stem);
  const branchElement = readElement(pillar.branch);
  const stage = pillar.twelveStage?.name ? `, 12-stage ${pillar.twelveStage.name}` : '';

  return `${label}: ${stemKor}${branchKor}${stemElement || branchElement ? `, elements ${[stemElement, branchElement].filter(Boolean).join('/')}` : ''}${stage}`;
}

export function buildSajuSummary(saju) {
  if (!saju) return 'Saju data: unavailable';

  return [
    formatPillar('Year pillar', saju.year),
    formatPillar('Month pillar', saju.month),
    formatPillar('Day pillar', saju.day),
    formatPillar('Hour pillar', saju.hour),
  ].join('\n');
}

function buildBirthSummary(profile) {
  const birth = profile?.birthDate;
  if (!birth) return 'birth unavailable';

  const dateText = `${birth.year}.${birth.month}.${birth.day}`;
  if (profile?.isTimeUnknown) {
    return `${dateText} time unknown`;
  }

  return `${dateText} ${birth.ampm || 'AM'} ${birth.hour}:${String(birth.minute ?? 0).padStart(2, '0')}`;
}

export function buildProfileSummary(profile) {
  if (!profile) return 'Profile unavailable';

  return [
    `Gender: ${profile.gender || 'unknown'}`,
    `Calendar: ${profile.calendarType || 'unknown'}`,
    `Birth: ${buildBirthSummary(profile)}`,
    `Relation: ${profile.relation || 'me'}`,
    `Knowledge level: ${profile.knowledgeLevel || 'newbie'}`,
  ].join('\n');
}
