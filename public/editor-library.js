import { cards as baseCards, currentDeckCollection, deckCollections } from './game-data.js';
import { applyCardOverrides, saveCardOverrides } from './card-overrides.js';
import { summarizeKeywords } from './keywords.js';

const cards = applyCardOverrides(baseCards).map((card) => ({
  ...card,
  enabled: card.enabled !== false,
  deckCount: Number(card.deckCount) || 0,
}));
const cardById = new Map(cards.map((card) => [card.id, card]));

const elements = {
  stats: document.getElementById('library-stats'),
  search: document.getElementById('library-search'),
  typeFilter: document.getElementById('library-type-filter'),
  sourceFilter: document.getElementById('library-source-filter'),
  cardGrid: document.getElementById('library-card-grid'),
  featuredName: document.getElementById('featured-deck-name'),
  featuredSummary: document.getElementById('featured-deck-summary'),
  featuredCode: document.getElementById('featured-deck-code'),
  featuredCurve: document.getElementById('featured-mana-curve'),
  featuredList: document.getElementById('featured-deck-list'),
  archive: document.getElementById('deck-archive'),
  applyFeatured: document.getElementById('apply-featured-deck'),
  copyFeatured: document.getElementById('copy-featured-code'),
  status: document.getElementById('library-status'),
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cardTypeLabel(card) {
  return card.type === 'minion' ? '随从' : '法术';
}

function deriveMechanics(card) {
  const labels = new Set();
  const mechanicLabels = {
    battlecry: '战吼', deathrattle: '亡语', questline: '任务线', tradeable: '可交易',
    temporary: '临时牌', discover: '发现', lifesteal: '吸血', questReward: '任务奖励',
  };
  for (const mechanic of card.mechanics || []) labels.add(mechanicLabels[mechanic] || mechanic);
  const walk = (effects) => {
    for (const effect of effects || []) {
      if (effect.trigger === 'battlecry') labels.add('战吼');
      if (effect.trigger === 'deathrattle') labels.add('亡语');
      if (effect.type === 'questline') labels.add('任务线');
      if (effect.type === 'discoverFromDeck' || effect.type === 'discover') labels.add('发现');
      if (effect.temporary) labels.add('临时牌');
      walk(effect.effects);
    }
  };
  walk(card.effects);
  const keywordSummary = summarizeKeywords(card.keywords);
  if (keywordSummary) keywordSummary.split(' · ').forEach((label) => labels.add(label));
  return [...labels];
}

function renderStats() {
  const hearthstoneCards = cards.filter((card) => Number.isFinite(card.dbfId)).length;
  const prototypes = cards.length - hearthstoneCards;
  elements.stats.innerHTML = `
    <span><strong>${cards.length}</strong> 张已录入</span>
    <span><strong>${hearthstoneCards}</strong> 张炉石卡牌</span>
    <span><strong>${prototypes}</strong> 张项目原型卡</span>
  `;
}

function renderLibrary() {
  const query = elements.search.value.trim().toLocaleLowerCase('zh-CN');
  const type = elements.typeFilter.value;
  const source = elements.sourceFilter.value;
  const filtered = cards
    .filter((card) => type === 'all' || card.type === type)
    .filter((card) => source === 'all' || (source === 'hearthstone' ? Number.isFinite(card.dbfId) : !Number.isFinite(card.dbfId)))
    .filter((card) => !query || `${card.name} ${(card.aliases || []).join(' ')} ${card.text || ''} ${(card.dbfIds || [card.dbfId]).filter(Boolean).join(' ')}`.toLocaleLowerCase('zh-CN').includes(query))
    .sort((left, right) => (left.cost - right.cost) || left.name.localeCompare(right.name, 'zh-CN'));

  elements.cardGrid.innerHTML = filtered.length
    ? filtered.map((card) => {
        const mechanics = deriveMechanics(card);
        const stats = card.type === 'minion' ? `<span>${card.attack}/${card.health}</span>` : '';
        return `
          <article class="library-card-item">
            <div class="library-card-topline">
              <span class="library-card-cost">${card.cost}</span>
              <span>${cardTypeLabel(card)}</span>
              ${stats}
              <span>${Number.isFinite(card.dbfId) ? `DBF ${(card.dbfIds || [card.dbfId]).join(' / ')}` : '原型卡'}</span>
            </div>
            <h3>${escapeHtml(card.name)}</h3>
            <p>${escapeHtml(card.text || '无卡牌文本')}</p>
            <div class="mechanic-row">${mechanics.map((label) => `<span>${escapeHtml(label)}</span>`).join('')}</div>
            <a class="card-edit-link" href="/editor?card=${encodeURIComponent(card.id)}">在编辑器中打开</a>
          </article>`;
      }).join('')
    : '<p class="empty-state">没有符合筛选条件的卡牌。</p>';
}

function resolveDeckEntries(deck) {
  return deck.entries
    .map((entry) => ({ ...entry, card: cardById.get(entry.cardId) }))
    .filter((entry) => entry.card)
    .sort((left, right) => (left.card.cost - right.card.cost) || left.card.name.localeCompare(right.card.name, 'zh-CN'));
}

function renderManaCurve(entries) {
  const buckets = new Map();
  for (const entry of entries) {
    const cost = Math.min(10, Number(entry.card.cost) || 0);
    buckets.set(cost, (buckets.get(cost) || 0) + entry.count);
  }
  const max = Math.max(1, ...buckets.values());
  return Array.from({ length: 11 }, (_, cost) => {
    const count = buckets.get(cost) || 0;
    const label = cost === 10 ? '10+' : String(cost);
    return `<div class="curve-column"><span class="curve-count">${count}</span><i style="height:${Math.max(4, (count / max) * 92)}px"></i><span>${label}</span></div>`;
  }).join('');
}

function renderDeckList(entries) {
  return entries.map(({ card, count }) => `
    <a class="deck-row" href="/editor?card=${encodeURIComponent(card.id)}">
      <span class="deck-row-cost">${card.cost}</span>
      <strong>${escapeHtml(card.name)}</strong>
      <span>${card.type === 'minion' ? `${card.attack}/${card.health}` : '法术'}</span>
      <span class="deck-row-count">×${count}</span>
    </a>`).join('');
}

function renderFeaturedDeck() {
  const entries = resolveDeckEntries(currentDeckCollection);
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  elements.featuredName.textContent = currentDeckCollection.name;
  elements.featuredSummary.innerHTML = `
    <span>英雄：<strong>${escapeHtml(currentDeckCollection.hero)}</strong></span>
    <span>模式：<strong>${escapeHtml(currentDeckCollection.format)}</strong></span>
    <span>卡牌：<strong>${entries.length} 种 / ${total} 张</strong></span>
    <span>新增录入：<strong>4 张卡牌条目</strong></span>`;
  elements.featuredCode.textContent = currentDeckCollection.code;
  elements.featuredCurve.innerHTML = renderManaCurve(entries);
  elements.featuredList.innerHTML = renderDeckList(entries);
}

function renderArchive() {
  elements.archive.innerHTML = deckCollections.map((deck) => {
    const entries = resolveDeckEntries(deck);
    const total = entries.reduce((sum, entry) => sum + entry.count, 0);
    return `
      <details class="deck-archive-item" ${deck.id === currentDeckCollection.id ? 'open' : ''}>
        <summary>
          <span><strong>${escapeHtml(deck.name)}</strong><small>${escapeHtml(deck.label)}</small></span>
          <span>${entries.length} 种 / ${total} 张</span>
        </summary>
        <code>${escapeHtml(deck.code)}</code>
        <div class="compact-deck-list">${renderDeckList(entries)}</div>
      </details>`;
  }).join('');
}

elements.search.addEventListener('input', renderLibrary);
elements.typeFilter.addEventListener('change', renderLibrary);
elements.sourceFilter.addEventListener('change', renderLibrary);

elements.applyFeatured.addEventListener('click', () => {
  const counts = new Map(currentDeckCollection.entries.map((entry) => [entry.cardId, entry.count]));
  const updated = cards.map((card) => ({ ...card, deckCount: counts.get(card.id) || 0 }));
  saveCardOverrides(updated);
  elements.status.textContent = `已载入${currentDeckCollection.name}，返回编辑器即可查看`;
  elements.status.classList.add('is-success');
});

elements.copyFeatured.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(currentDeckCollection.code);
    elements.status.textContent = '卡组代码已复制';
    elements.status.classList.add('is-success');
  } catch {
    elements.status.textContent = '浏览器未允许复制，请手动选择上方代码';
  }
});

renderStats();
renderLibrary();
renderFeaturedDeck();
renderArchive();
