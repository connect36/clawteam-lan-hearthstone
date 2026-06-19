const STORAGE_KEY = 'clawteam-lan-hearthstone-card-overrides-v1';
const CARD_ID_ALIASES = Object.freeze({
  'hs-42471': 'hs-95688',
});

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeOverrideList(raw) {
  if (!raw) return [];
  const source = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw) : [];
  const merged = new Map();
  for (const item of source) {
    if (!item?.id) continue;
    const canonicalId = CARD_ID_ALIASES[item.id] || item.id;
    const migrated = { ...item, id: canonicalId };
    if (item.id === 'hs-42471') {
      migrated.dbfId = 95688;
      migrated.dbfIds = [95688, 42471];
      migrated.aliases = ['核心版亵渎', '旧版亵渎'];
    }
    merged.set(canonicalId, migrated);
  }
  return [...merged.values()];
}

export function loadCardOverrides() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeOverrideList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveCardOverrides(cardList) {
  const normalized = normalizeOverrideList(cardList).map((item) => clone(item));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearCardOverrides() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function applyCardOverrides(baseCards) {
  const overrides = new Map(loadCardOverrides().map((card) => [card.id, card]));
  const mergedCards = baseCards.map((card) => {
    const override = overrides.get(card.id);
    return override ? { ...clone(card), ...clone(override) } : clone(card);
  });

  for (const override of overrides.values()) {
    if (!baseCards.some((card) => card.id === override.id)) {
      mergedCards.push(clone(override));
    }
  }

  return mergedCards;
}

export { STORAGE_KEY };
