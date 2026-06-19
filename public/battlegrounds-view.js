function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function ensureRoot(host) {
  if (!host) return null;
  let root = host.querySelector('#battlegrounds-root');
  if (root) return root;

  root = document.createElement('section');
  root.id = 'battlegrounds-root';
  root.className = 'battlegrounds-shell';
  root.hidden = true;
  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-bg-action]');
    if (!actionTarget || !root.__callbacks) return;

    const action = actionTarget.dataset.bgAction;
    if (action === 'back') {
      root.__callbacks.onBack?.();
      return;
    }
    if (action === 'confirm-hero') {
      root.__callbacks.onConfirmHero?.();
      return;
    }
    if (action === 'refresh-shell') {
      root.__callbacks.onRefreshShell?.();
      return;
    }
    if (action === 'toggle-freeze') {
      root.__callbacks.onToggleFreeze?.();
      return;
    }
    if (action === 'advance-preview') {
      root.__callbacks.onAdvancePreview?.();
      return;
    }
    if (action === 'start-combat') {
      root.__callbacks.onStartCombat?.();
      return;
    }

    const shopIndex = Number.parseInt(actionTarget.dataset.shopIndex || '', 10);
    if (action === 'buy-shop-card' && Number.isInteger(shopIndex)) {
      root.__callbacks.onBuyShopCard?.(shopIndex);
      return;
    }

    const handIndex = Number.parseInt(actionTarget.dataset.handIndex || '', 10);
    if (action === 'play-hand-card' && Number.isInteger(handIndex)) {
      root.__callbacks.onPlayHandCard?.(handIndex);
      return;
    }

    const heroId = actionTarget.dataset.heroId;
    if (action === 'select-hero' && heroId) {
      root.__callbacks.onSelectHero?.(heroId);
    }
  });

  host.appendChild(root);
  return root;
}

function setVisibility(host, root, visible) {
  if (!host || !root) return;
  for (const child of host.children) {
    child.hidden = visible && child !== root;
  }
  root.hidden = !visible;
}

function createPaddedSlots(entries, size) {
  const safeEntries = Array.isArray(entries) ? entries.slice(0, size) : [];
  while (safeEntries.length < size) {
    safeEntries.push(null);
  }
  return safeEntries;
}

function buildLaneLayout(entries) {
  const cards = Array.isArray(entries) ? entries.filter(Boolean) : [];
  const midpoint = (cards.length - 1) / 2;
  return cards.map((entry, index) => {
    const position = index - midpoint;
    const depth = Math.abs(position);
    return {
      entry,
      position,
      drop: Math.round(depth * 8),
    };
  });
}

function getBattlegroundsPhaseLabel(phase) {
  if (phase === 'hero-select') return '英雄选择';
  if (phase === 'recruit') return '招募阶段';
  if (phase === 'combat') return '战斗阶段';
  return '战棋预演';
}

function renderStatPair(entry, variant = 'shop') {
  return `
    <div class="bg-stat-pair bg-stat-pair--${escapeHtml(variant)}">
      <span class="bg-stat-chip bg-stat-chip--attack" data-bg-stat-kind="attack">${escapeHtml(entry.attack ?? '-')}</span>
      <span class="bg-stat-chip bg-stat-chip--health" data-bg-stat-kind="health">${escapeHtml(entry.health ?? '-')}</span>
    </div>
  `;
}

function renderHeroChoices(snapshot) {
  if (!Array.isArray(snapshot.heroChoices) || !snapshot.heroChoices.length) {
    return `
      <div class="bg-empty-state">
        <p>英雄池数据接入中。</p>
      </div>
    `;
  }

  return snapshot.heroChoices.map((hero) => {
    const selected = hero.id === snapshot.selectedHeroId;
    return `
      <button
        type="button"
        class="bg-draft-card${selected ? ' is-selected' : ''}"
        data-bg-action="select-hero"
        data-hero-id="${escapeHtml(hero.id)}"
      >
        <span class="bg-draft-card__crest">${escapeHtml(hero.name.slice(0, 1))}</span>
        <span class="bg-draft-card__name">${escapeHtml(hero.name)}</span>
        <span class="bg-draft-card__meta">护甲 ${escapeHtml(hero.armorLabel || '--')}</span>
        <span class="bg-draft-card__note">${escapeHtml(hero.note || '英雄技能后续补齐')}</span>
      </button>
    `;
  }).join('');
}

function renderHeroPanel({ hero, side, label, health, armor, note }) {
  if (!hero) {
    return `
      <article class="bg-hero-panel bg-hero-panel--${escapeHtml(side)}">
        <div class="bg-hero-panel__portrait">?</div>
        <div class="bg-hero-panel__body">
          <p class="bg-hero-panel__label">${escapeHtml(label)}</p>
          <h3>待选择</h3>
          <p class="bg-hero-panel__stats">生命 -- · 护甲 --</p>
        </div>
      </article>
    `;
  }

  return `
    <article class="bg-hero-panel bg-hero-panel--${escapeHtml(side)}">
      <div class="bg-hero-panel__portrait">${escapeHtml(hero.name.slice(0, 1))}</div>
      <div class="bg-hero-panel__body">
        <p class="bg-hero-panel__label">${escapeHtml(label)}</p>
        <h3>${escapeHtml(hero.name)}</h3>
        <p class="bg-hero-panel__stats">生命 ${escapeHtml(health ?? '--')} · 护甲 ${escapeHtml(armor ?? '--')}</p>
        <p class="bg-hero-panel__note">${escapeHtml(note || hero.note || '')}</p>
      </div>
    </article>
  `;
}

function renderResourcePips(total, current, filledClassName) {
  return Array.from({ length: total }, (_, index) => {
    const active = index < current;
    return `<span class="bg-pip${active ? ` ${filledClassName}` : ''}"></span>`;
  }).join('');
}

function renderShopCards(snapshot) {
  return createPaddedSlots(snapshot.shopPreview, snapshot.shopSlots ?? 5).map((entry, index) => {
    if (!entry) {
      return '<article class="bg-shop-card is-empty"><span>空槽位</span></article>';
    }

    const canBuy = snapshot.gold >= (entry.cost ?? 3) && (snapshot.reservePreview?.length ?? 0) < (snapshot.maxHandSlots ?? 10);
    return `
      <article class="bg-shop-card${entry.frozen ? ' is-frozen' : ''}" data-bg-shop-id="${escapeHtml(entry.instanceId || `shop-${index}`)}">
        <div class="bg-shop-card__badge-row">
          <span class="bg-shop-card__tier">T${escapeHtml(entry.tier)}</span>
          <span class="bg-shop-card__cost">${escapeHtml(entry.cost ?? 3)}</span>
        </div>
        <div class="bg-shop-card__art">${escapeHtml(entry.tribe || 'Minion')}</div>
        <h4>${escapeHtml(entry.name)}</h4>
        <p class="bg-shop-card__tribe">${escapeHtml(entry.tribe || '未分类')}</p>
        <div class="bg-shop-card__footer">
          <span class="bg-shop-card__tag">${escapeHtml(entry.tags?.[0] || '')}</span>
          ${renderStatPair(entry, 'shop')}
        </div>
        <button
          type="button"
          class="bg-shop-card__action"
          data-bg-action="buy-shop-card"
          data-shop-index="${index}"
          ${canBuy ? '' : 'disabled'}
        >
          ${canBuy ? '购买' : '无法购买'}
        </button>
      </article>
    `;
  }).join('');
}

function renderReserve(snapshot) {
  return createPaddedSlots(snapshot.reservePreview, Math.max(3, snapshot.reservePreview?.length ?? 0)).map((entry, index) => {
    if (!entry) {
      return '<article class="bg-hand-card is-empty"><span>空位</span></article>';
    }

    const canPlay = (snapshot.boardPreview?.length ?? 0) < (snapshot.maxBoardSlots ?? 7);
    return `
      <article class="bg-hand-card" data-bg-hand-id="${escapeHtml(entry.instanceId || `hand-${index}`)}">
        <span class="bg-hand-card__name">${escapeHtml(entry.name)}</span>
        <span class="bg-hand-card__tribe">${escapeHtml(entry.tribe || 'Reserve')}</span>
        <span class="bg-hand-card__tag">${escapeHtml(entry.tags?.[0] || '')}</span>
        ${renderStatPair(entry, 'hand')}
        <button
          type="button"
          class="bg-hand-card__action"
          data-bg-action="play-hand-card"
          data-hand-index="${index}"
          ${canPlay ? '' : 'disabled'}
        >
          ${canPlay ? '上场' : '战队已满'}
        </button>
      </article>
    `;
  }).join('');
}

function renderWarband(snapshot) {
  const laneEntries = buildLaneLayout(snapshot.boardPreview);
  if (!laneEntries.length) {
    return `
      <article class="bg-warband-slot is-empty bg-warband-slot--empty-lane">
        <span class="bg-warband-slot__empty">把随从拖上来后，会自动排成居中的战队阵型</span>
      </article>
    `;
  }

  return laneEntries.map(({ entry, drop }) => `
    <article
      class="bg-warband-slot"
      data-bg-board-id="${escapeHtml(entry.instanceId || entry.name)}"
      style="--bg-lane-drop:${drop}px;"
    >
      <span class="bg-warband-slot__tribe">${escapeHtml(entry.tribe || 'Warband')}</span>
      <span class="bg-warband-slot__name">${escapeHtml(entry.name)}</span>
      <span class="bg-warband-slot__tag">${escapeHtml(entry.tags?.[0] || '')}</span>
      ${renderStatPair(entry, 'warband')}
    </article>
  `).join('');
}

function renderCombatLane(cards, side, size = 7, options = {}) {
  const laneEntries = buildLaneLayout((cards || []).slice(0, size));
  if (!laneEntries.length) {
    return `
      <div class="bg-combat-lane bg-combat-lane--${escapeHtml(side)} is-empty">
        <div class="bg-combat-lane__empty">暂无${side === 'enemy' ? '敌方' : '我方'}随从</div>
      </div>
    `;
  }

  return `
    <div class="bg-combat-lane bg-combat-lane--${escapeHtml(side)}">
      ${laneEntries.map(({ entry, drop }) => `
        <article
          class="bg-combat-slot bg-combat-slot--${escapeHtml(side)}${entry.instanceId === options.attackerId ? ' is-current-attacker' : ''}${entry.instanceId === options.targetId ? ' is-current-target' : ''}"
          data-bg-combat-id="${escapeHtml(entry.instanceId || `${side}-${entry.name}`)}"
          style="--bg-lane-drop:${drop}px;"
        >
          <span class="bg-combat-slot__name">${escapeHtml(entry.name)}</span>
          <span class="bg-combat-slot__tribe">${escapeHtml(entry.tribe || 'Minion')}</span>
          <div class="bg-card-tags">
            ${(entry.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
          ${renderStatPair(entry, 'combat')}
        </article>
      `).join('')}
    </div>
  `;
}

function renderLog(snapshot) {
  if (!Array.isArray(snapshot.log) || !snapshot.log.length) {
    return '<li>战棋模式入口已接线，等待后续引擎模块合流。</li>';
  }

  return snapshot.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('');
}

function renderCombatSteps(snapshot) {
  const steps = Array.isArray(snapshot.combatSteps) ? snapshot.combatSteps.slice(-5) : [];
  if (!steps.length) {
    return '<li>战斗步骤会在自动结算接入后显示在这里。</li>';
  }

  return steps.map((step, index) => `
    <li>
      ${escapeHtml(String(step.attackerName || `随从${index + 1}`))} 攻击
      ${escapeHtml(String(step.defenderName || '目标'))}，
      造成 ${escapeHtml(String(step.attackerAttack ?? 0))} 点伤害，
      目标剩余 ${escapeHtml(String(step.defenderHealthAfter ?? 0))} 血。
    </li>
  `).join('');
}

function renderCompactHero({ hero, side, health, armor }) {
  if (!hero) {
    return `
      <article class="bg-compact-hero bg-compact-hero--${escapeHtml(side)}">
        <div class="bg-compact-hero__portrait">?</div>
        <div class="bg-compact-hero__body">
          <strong>待定英雄</strong>
          <span>生命 -- · 护甲 --</span>
        </div>
      </article>
    `;
  }

  return `
    <article class="bg-compact-hero bg-compact-hero--${escapeHtml(side)}">
      <div class="bg-compact-hero__portrait">${escapeHtml(hero.name.slice(0, 1))}</div>
      <div class="bg-compact-hero__body">
        <strong>${escapeHtml(hero.name)}</strong>
        <span>生命 ${escapeHtml(health ?? '--')} · 护甲 ${escapeHtml(armor ?? '--')}</span>
      </div>
    </article>
  `;
}

function renderCombatScene(snapshot, selectedHero) {
  const combatPreview = snapshot.combatPreview || {};
  const friendlyLane = Array.isArray(snapshot.combatFriendlyBoard) && snapshot.combatFriendlyBoard.length
    ? snapshot.combatFriendlyBoard
    : Array.isArray(combatPreview.friendlyBoard) && combatPreview.friendlyBoard.length
      ? combatPreview.friendlyBoard
      : Array.isArray(combatPreview.friendly) && combatPreview.friendly.length
        ? combatPreview.friendly
        : snapshot.boardPreview || [];
  const enemyLane = Array.isArray(snapshot.combatEnemyBoard) && snapshot.combatEnemyBoard.length
    ? snapshot.combatEnemyBoard
    : Array.isArray(combatPreview.enemyBoard) && combatPreview.enemyBoard.length
      ? combatPreview.enemyBoard
      : Array.isArray(combatPreview.enemy) && combatPreview.enemy.length
        ? combatPreview.enemy
        : [];
  const resultLabel = snapshot.combatResultLabel || combatPreview.resultLabel || '战斗预演';
  const resultText = snapshot.combatResultText || combatPreview.resultText || '战斗舞台已就位，后续可接入自动攻防与结算动画。';
  const activeAttackerSide = snapshot.combatCurrentAttackerSide || combatPreview.currentAttackerSide || null;
  const activeAttackerId = snapshot.combatHighlightedMinionId || combatPreview.highlightedMinionId || null;
  const activeTargetId = snapshot.combatHighlightedTargetMinionId || combatPreview.highlightedTargetMinionId || null;

  return `
    <div class="bg-shell__topbar bg-shell__topbar--combat">
      <div>
        <p class="bg-shell__eyebrow">Battlegrounds S12 MVP</p>
        <h1>酒馆战棋 · 战斗剧场</h1>
        <p class="bg-shell__lede">
          敌方战队与我方战队都采用居中阵型呈现，方便后续接入自动攻击、伤害结算和战斗日志。
        </p>
      </div>
      <div class="bg-topbar__actions">
        <span class="bg-phase-pill">${escapeHtml(getBattlegroundsPhaseLabel(snapshot.phase))}</span>
        <button type="button" class="bg-shell__back" data-bg-action="back">返回大厅</button>
      </div>
    </div>

    <section class="bg-combat-stage" aria-label="战斗阶段">
      <div class="bg-combat-stage__hud">
        ${renderCompactHero({
          hero: snapshot.opponentHero,
          side: 'enemy',
          health: snapshot.opponentHero?.health,
          armor: snapshot.opponentHero?.armor,
        })}

        <div class="bg-combat-summary">
          <span class="bg-combat-summary__kicker">Combat Preview</span>
          <strong>${escapeHtml(resultLabel)}</strong>
          <p>${escapeHtml(resultText)}</p>
          <div class="bg-combat-summary__meta">
            <span>敌方 ${escapeHtml(enemyLane.length)}</span>
            <span>我方 ${escapeHtml(friendlyLane.length)}</span>
            <span>回合 ${escapeHtml(snapshot.round)}</span>
            <span>倒计时 ${escapeHtml(snapshot.timerLabel)}</span>
          </div>
        </div>

        ${renderCompactHero({
          hero: selectedHero,
          side: 'player',
          health: snapshot.playerHealth,
          armor: snapshot.playerArmor ?? selectedHero?.armorLabel,
        })}
      </div>

      <div class="bg-combat-stage__arena">
        <div class="bg-stage-label bg-stage-label--combat">
          <span>敌方战队</span>
          <span>enemy lane</span>
        </div>
        ${renderCombatLane(enemyLane, 'enemy', 7, {
          attackerId: activeAttackerSide === 'enemy' ? activeAttackerId : null,
          targetId: activeAttackerSide === 'friendly' ? activeTargetId : null,
        })}

        <div class="bg-combat-stage__separator">
          <div class="bg-combat-stage__glow"></div>
        </div>

        <div class="bg-stage-label bg-stage-label--combat">
          <span>我方战队</span>
          <span>player lane</span>
        </div>
        ${renderCombatLane(friendlyLane, 'player', 7, {
          attackerId: activeAttackerSide === 'friendly' ? activeAttackerId : null,
          targetId: activeAttackerSide === 'enemy' ? activeTargetId : null,
        })}
      </div>

      <div class="bg-combat-footer">
        <section class="bg-feedback-card">
          <div class="bg-stage-label">
            <span>战斗步骤</span>
            <span>最近 ${escapeHtml(Math.min(5, snapshot.combatSteps?.length || 0))} 条</span>
          </div>
          <ul class="bg-log-list">
            ${renderCombatSteps(snapshot)}
          </ul>
        </section>

        <div class="bg-combat-actions">
          <button type="button" class="bg-secondary-btn" data-bg-action="advance-preview">下一组样例</button>
        </div>
      </div>
    </section>
  `;
}

function renderHeroDraftScene(snapshot) {
  return `
    <div class="bg-shell__topbar bg-shell__topbar--draft">
      <div>
        <p class="bg-shell__eyebrow">Battlegrounds S12 MVP</p>
        <h1>酒馆战棋 · 选择英雄</h1>
        <p class="bg-shell__lede">
          这一阶段只保留英雄选择，不提前暴露完整招募桌面，
          让视线先集中在英雄池与锁定操作上。
        </p>
      </div>
      <div class="bg-topbar__actions">
        <span class="bg-phase-pill">${escapeHtml(snapshot.phaseLabel)}</span>
        <button type="button" class="bg-shell__back" data-bg-action="back">返回大厅</button>
      </div>
    </div>

    <section class="bg-draft-stage" aria-label="英雄选择阶段">
      <div class="bg-draft-stage__hero">
        <div class="bg-draft-stage__copy">
          <p class="bg-shell__eyebrow">Hero Draft</p>
          <h2>选择你的英雄</h2>
          <p>
            当前只展示英雄卡片、护甲和基础说明。锁定后，界面才切换到完整招募场景。
          </p>
        </div>
        <div class="bg-draft-stage__meta">
          <span class="bg-freeze-indicator is-active">正式棋盘尚未展开</span>
          <strong>${escapeHtml(snapshot.timerLabel)}</strong>
        </div>
      </div>

      <div class="bg-draft-grid">
        ${renderHeroChoices(snapshot)}
      </div>

      <div class="bg-draft-actions">
        <button
          type="button"
          class="bg-primary-btn"
          data-bg-action="confirm-hero"
          ${snapshot.selectedHeroId ? '' : 'disabled'}
        >
          锁定英雄并进入招募
        </button>
      </div>
    </section>
  `;
}

function renderRecruitScene(snapshot, selectedHero) {
  return `
    <div class="bg-shell__topbar bg-shell__topbar--compact">
      <div>
        <p class="bg-shell__eyebrow">Battlegrounds S12 MVP</p>
        <h1>酒馆战棋 · 木质棋盘视图</h1>
      </div>
      <div class="bg-topbar__actions">
        <span class="bg-phase-pill">${escapeHtml(getBattlegroundsPhaseLabel(snapshot.phase))}</span>
        <button type="button" class="bg-shell__back" data-bg-action="back">返回大厅</button>
      </div>
    </div>

    <section class="bg-table bg-table--minimal">
      <div class="bg-table__hud">
        ${renderCompactHero({
          hero: snapshot.opponentHero,
          side: 'enemy',
          health: snapshot.opponentHero?.health,
          armor: snapshot.opponentHero?.armor,
        })}

        <div class="bg-round-hud bg-round-hud--inline">
          <div class="bg-round-hud__row">
            <span>回合</span>
            <strong>${escapeHtml(snapshot.round)}</strong>
          </div>
          <div class="bg-round-hud__row">
            <span>金币</span>
            <strong>${escapeHtml(snapshot.gold)}</strong>
          </div>
          <div class="bg-round-hud__row">
            <span>本数</span>
            <strong>${escapeHtml(snapshot.tavernTier)}</strong>
          </div>
          <div class="bg-round-hud__row">
            <span>升本</span>
            <strong>${escapeHtml(snapshot.tavernUpgradeCost)}</strong>
          </div>
        </div>

        ${renderCompactHero({
          hero: selectedHero,
          side: 'player',
          health: snapshot.playerHealth,
          armor: snapshot.playerArmor ?? selectedHero?.armorLabel,
        })}
      </div>

      <div class="bg-board-frame">
        <div class="bg-board-frame__header">
          <div class="bg-bob-badge">
            <div class="bg-bob-badge__portrait">B</div>
            <div class="bg-bob-badge__body">
              <strong>Bob's Tavern</strong>
              <span>${escapeHtml(snapshot.previewLabel || '战棋预演')}</span>
            </div>
          </div>
          <div class="bg-board-toolbar">
            <button type="button" class="bg-secondary-btn" data-bg-action="refresh-shell">刷新</button>
            <button type="button" class="bg-secondary-btn" data-bg-action="toggle-freeze">
              ${snapshot.isFrozen ? '取消冻结' : '冻结'}
            </button>
          </div>
        </div>

        <div class="bg-board-stage">
          <div class="bg-board-stage__shop">
            <div class="bg-stage-label">
              <span>酒馆随从</span>
              <div class="bg-pip-row">${renderResourcePips(6, snapshot.tavernTier, 'is-tier')}</div>
            </div>
            <div class="bg-shop-row">
              ${renderShopCards(snapshot)}
            </div>
          </div>

          <div class="bg-board-stage__separator">
            <div class="bg-board-stage__glow"></div>
          </div>

          <div class="bg-board-stage__warband">
            <div class="bg-stage-label">
              <span>我方战队</span>
              <div class="bg-pip-row">${renderResourcePips(12, snapshot.gold, 'is-gold')}</div>
            </div>
            <div class="bg-warband-grid">
              ${renderWarband(snapshot)}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-hand-tray">
        <div class="bg-stage-label">
          <span>手牌</span>
          <span>${snapshot.isFrozen ? '已冻结商店' : '正常招募'}</span>
        </div>
        <div class="bg-hand-grid bg-hand-grid--tray">
          ${renderReserve(snapshot)}
        </div>
      </div>

      <section class="bg-feedback-card">
        <div class="bg-stage-label">
          <span>酒馆动态</span>
          <span>${escapeHtml(snapshot.log?.length || 0)} 条</span>
        </div>
        <ul class="bg-log-list">
          ${renderLog(snapshot)}
        </ul>
      </section>

      <div class="bg-recruit-cta">
        <button
          type="button"
          class="bg-primary-btn"
          data-bg-action="start-combat"
        >
          开始战斗
        </button>
        <p>后续接入回合推进后，这个按钮会切换到战斗阶段；目前保留为战棋 MVP 的流程锚点。</p>
      </div>
    </section>
  `;
}

export function hideBattlegroundsView(host) {
  const root = host?.querySelector('#battlegrounds-root');
  if (!host || !root) return;
  setVisibility(host, root, false);
}

export function renderBattlegroundsView({ host, snapshot, callbacks }) {
  const root = ensureRoot(host);
  if (!root) return;

  const selectedHero = snapshot.heroChoices?.find((hero) => hero.id === snapshot.selectedHeroId)
    || snapshot.heroChoices?.[0]
    || null;
  root.__callbacks = callbacks || {};
  setVisibility(host, root, true);

  root.innerHTML = snapshot.phase === 'hero-select'
    ? renderHeroDraftScene(snapshot)
    : snapshot.phase === 'combat'
      ? renderCombatScene(snapshot, selectedHero)
      : renderRecruitScene(snapshot, selectedHero);
}
