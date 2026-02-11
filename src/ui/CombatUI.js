/**
 * 战斗界面交互模块
 * 负责卡牌拖拽、动画效果、UI更新等
 */

export class CombatUI {
  constructor(containerId, combatSystem) {
    this.container = document.getElementById(containerId);
    this.combat = combatSystem;
    this.draggedCard = null;
    this.dragOffset = { x: 0, y: 0 };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 卡牌拖拽
    this.container.addEventListener('mousedown', this.handleCardMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleCardMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleCardMouseUp.bind(this));

    // 触摸支持
    this.container.addEventListener('touchstart', this.handleCardTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleCardTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleCardTouchEnd.bind(this));
  }

  /**
   * 设置键盘快捷键
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.endTurn();
      }
      if (e.key === 'Escape') {
        this.cancelCardDrag();
      }
    });
  }

  /**
   * 处理卡牌鼠标按下
   */
  handleCardMouseDown(e) {
    const card = e.target.closest('.card');
    if (!card || card.classList.contains('disabled')) return;

    e.preventDefault();
    this.startCardDrag(card, e.clientX, e.clientY);
  }

  /**
   * 开始卡牌拖拽
   */
  startCardDrag(card, clientX, clientY) {
    this.draggedCard = card;
    const rect = card.getBoundingClientRect();
    this.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    card.classList.add('dragging');
    card.style.position = 'fixed';
    card.style.zIndex = '1000';
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    card.style.pointerEvents = 'none';
  }

  /**
   * 处理卡牌鼠标移动
   */
  handleCardMouseMove(e) {
    if (!this.draggedCard) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    this.draggedCard.style.left = `${x}px`;
    this.draggedCard.style.top = `${y}px`;

    // 计算卡牌旋转效果
    const centerX = window.innerWidth / 2;
    const deltaX = (e.clientX - centerX) / centerX;
    const rotation = deltaX * 15;

    this.draggedCard.style.transform = `rotate(${rotation}deg) scale(1.1)`;

    // 检测拖拽目标
    this.checkDragTarget(e.clientX, e.clientY);
  }

  /**
   * 检测拖拽目标（敌人）
   */
  checkDragTarget(clientX, clientY) {
    // 移除所有高亮
    document.querySelectorAll('.enemy-card').forEach(enemy => {
      enemy.classList.remove('targeted');
    });

    // 检测是否悬停在敌人上
    const targets = document.querySelectorAll('.enemy-card');
    targets.forEach(target => {
      const rect = target.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        target.classList.add('targeted');
      }
    });
  }

  /**
   * 处理卡牌鼠标释放
   */
  handleCardMouseUp(e) {
    if (!this.draggedCard) return;

    // 检测是否释放到敌人上
    const target = this.getDropTarget(e.clientX, e.clientY);

    if (target) {
      this.playCard(this.draggedCard.dataset.cardId, target.dataset.enemyId);
    } else {
      // 返回原位
      this.returnCardToHand(this.draggedCard);
    }

    this.cleanupCardDrag();
  }

  /**
   * 获取放置目标
   */
  getDropTarget(clientX, clientY) {
    const targets = document.querySelectorAll('.enemy-card');
    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return target;
      }
    }
    return null;
  }

  /**
   * 打出卡牌
   */
  playCard(cardId, targetId) {
    // 创建打出动画
    const card = this.draggedCard;
    card.classList.add('playing');

    // 调用战斗系统
    this.combat.playCard(cardId, targetId);

    // 延迟移除卡牌
    setTimeout(() => {
      this.removeCardFromHand(cardId);
    }, 300);
  }

  /**
   * 返回卡牌到手牌
   */
  returnCardToHand(card) {
    card.style.position = '';
    card.style.left = '';
    card.style.top = '';
    card.style.pointerEvents = '';
    card.style.transform = '';
  }

  /**
   * 移除手牌中的卡牌
   */
  removeCardFromHand(cardId) {
    const card = this.container.querySelector(`[data-card-id="${cardId}"]`);
    if (card) {
      card.remove();
    }
  }

  /**
   * 清理拖拽状态
   */
  cleanupCardDrag() {
    if (this.draggedCard) {
      this.draggedCard.classList.remove('dragging');
      this.draggedCard.style.position = '';
      this.draggedCard.style.left = '';
      this.draggedCard.style.top = '';
      this.draggedCard.style.pointerEvents = '';
      this.draggedCard.style.transform = '';
      this.draggedCard = null;
    }

    // 移除所有高亮
    document.querySelectorAll('.enemy-card').forEach(enemy => {
      enemy.classList.remove('targeted');
    });
  }

  /**
   * 取消卡牌拖拽
   */
  cancelCardDrag() {
    if (this.draggedCard) {
      this.returnCardToHand(this.draggedCard);
      this.cleanupCardDrag();
    }
  }

  /**
   * 触摸事件处理
   */
  handleCardTouchStart(e) {
    const card = e.target.closest('.card');
    if (!card || card.classList.contains('disabled')) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.startCardDrag(card, touch.clientX, touch.clientY);
  }

  handleCardTouchMove(e) {
    if (!this.draggedCard) return;

    e.preventDefault();
    const touch = e.touches[0];

    const x = touch.clientX - this.dragOffset.x;
    const y = touch.clientY - this.dragOffset.y;

    this.draggedCard.style.left = `${x}px`;
    this.draggedCard.style.top = `${y}px`;

    this.checkDragTarget(touch.clientX, touch.clientY);
  }

  handleCardTouchEnd(e) {
    if (!this.draggedCard) return;

    const touch = e.changedTouches[0];
    this.handleCardMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
  }

  /**
   * 结束回合
   */
  endTurn() {
    const btn = this.container.querySelector('.action-btn.primary');
    if (btn) {
      btn.classList.add('scale-in');
      setTimeout(() => btn.classList.remove('scale-in'), 300);
    }

    this.combat.endPlayerTurn();
  }

  /**
   * 更新玩家状态显示
   */
  updatePlayerStatus(player) {
    const hpFill = document.querySelector('.hp-fill');
    const hpText = document.querySelector('.hp-bar-text');
    if (hpFill) {
      const percentage = (player.hp / player.maxHp) * 100;
      hpFill.style.width = `${percentage}%`;
    }
    if (hpText) {
      hpText.textContent = `${player.hp}/${player.maxHp}`;
    }

    this.updateStatDisplay('energy', player.energy, player.maxEnergy);
    this.updateStatDisplay('block', player.block || 0);
  }

  /**
   * 更新数值显示
   */
  updateStatDisplay(stat, current, max = null) {
    const display = document.querySelector(`.${stat}-display`);
    if (display) {
      if (max !== null) {
        display.textContent = `${current}/${max}`;
      } else {
        display.textContent = `${current}`;
      }
    }
  }

  /**
   * 更新敌人意图显示
   */
  updateEnemyIntents(enemies) {
    enemies.forEach(enemy => {
      const intentElement = document.querySelector(`[data-enemy-id="${enemy.id}"] .enemy-intent`);
      if (intentElement && enemy.currentIntent) {
        const intent = enemy.currentIntent;
        intentElement.className = `enemy-intent ${intent.type}`;
        intentElement.innerHTML = `${this.getIntentIcon(intent.type)} ${this.getIntentText(intent)}`;
      }
    });
  }

  /**
   * 获取意图图标
   */
  getIntentIcon(type) {
    const icons = {
      attack: '⚔️',
      defend: '🛡️',
      buff: '💪',
      debuff: '💀',
      heal: '💚',
      special: '⭐',
      unknown: '❓'
    };
    return icons[type] || '❓';
  }

  /**
   * 获取意图文本
   */
  getIntentText(intent) {
    if (intent.type === 'attack') {
      return intent.value || '';
    }
    if (intent.type === 'defend') {
      return intent.value || '';
    }
    return '';
  }

  /**
   * 更新状态效果显示
   */
  updateStatusEffects(entity, type) {
    const container = document.querySelector(`.${type}-effects`);
    if (!container) return;

    container.innerHTML = '';

    if (!entity.statusEffects) return;

    Object.entries(entity.statusEffects).forEach(([statusType, value]) => {
      if (value <= 0) return;

      const effect = document.createElement('div');
      effect.className = `status-effect ${statusType}`;
      effect.innerHTML = `
        ${this.getStatusIcon(statusType)}
        ${value > 1 ? `<span class="status-effect-count">${value}</span>` : ''}
        <span class="status-effect-tooltip">${this.getStatusName(statusType)}</span>
      `;
      container.appendChild(effect);
    });
  }

  /**
   * 获取状态图标
   */
  getStatusIcon(type) {
    const icons = {
      strength: '💪',
      weak: '💔',
      vulnerable: '🎯',
      poison: '☠️',
      regen: '💚',
      dexterity: '🏹',
      focus: '⚡'
    };
    return icons[type] || '❓';
  }

  /**
   * 获取状态名称
   */
  getStatusName(type) {
    const names = {
      strength: '力量',
      weak: '虚弱',
      vulnerable: '易伤',
      poison: '中毒',
      regen: '再生',
      dexterity: '敏捷',
      focus: '集中力'
    };
    return names[type] || type;
  }

  /**
   * 显示伤害数字动画
   */
  showDamageNumber(targetId, damage, isHeal = false) {
    const target = document.querySelector(`[data-enemy-id="${targetId}"]`);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const damageNum = document.createElement('div');
    damageNum.className = 'damage-number';
    damageNum.textContent = isHeal ? `+${damage}` : `-${damage}`;
    damageNum.style.color = isHeal ? '#22c55e' : '#ef4444';
    damageNum.style.left = `${rect.left + rect.width / 2}px`;
    damageNum.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(damageNum);

    setTimeout(() => damageNum.remove(), 1000);
  }

  /**
   * 屏幕震动效果
   */
  screenShake(intensity = 'medium') {
    const intensityMap = {
      light: 'translateX(-2px)',
      medium: 'translateX(-5px)',
      heavy: 'translateX(-10px)'
    };

    this.container.classList.add('shake');
    this.container.style.animation = `shake 0.5s ease-in-out`;

    setTimeout(() => {
      this.container.classList.remove('shake');
      this.container.style.animation = '';
    }, 500);
  }

  /**
   * 更新手牌显示
   */
  updateHand(hand) {
    const handContainer = this.container.querySelector('.hand-cards');
    if (!handContainer) return;

    handContainer.innerHTML = hand.map(card => this.renderCard(card)).join('');
  }

  /**
   * 渲染单张卡牌
   */
  renderCard(card) {
    return `
      <div class="card ${card.rarity ? `rarity-${card.rarity}` : ''} ${card.upgraded ? 'upgraded' : ''} ${card.cost > this.combat.player.energy ? 'disabled' : ''}"
           data-card-id="${card.id}">
        <div class="card-cost">${card.cost}</div>
        <div class="card-content">
          <div class="card-icon">${card.icon || '🎴'}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-description">${card.description}</div>
        </div>
      </div>
    `;
  }

  /**
   * 显示遗物触发提示
   */
  showRelicTrigger(relicName, effect) {
    const toast = document.createElement('div');
    toast.className = 'relic-trigger-toast';
    toast.innerHTML = `
      <div class="relic-toast-icon">🏆</div>
      <div class="relic-toast-content">
        <div class="relic-toast-name">${relicName}</div>
        <div class="relic-toast-effect">${effect}</div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

export default CombatUI;
