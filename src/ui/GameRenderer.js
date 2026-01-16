/**
 * GameRenderer - 游戏渲染器
 * 基于规范文档: .claude/specs/feature/game-renderer-spec.md
 * 负责渲染卡牌策略游戏的UI界面和动画效果
 */

export default class GameRenderer {
  constructor() {
    this.container = document.body; // 默认使用 body 作为容器
    this.gameState = null;
    this.animationsEnabled = true;
    this.animationQueue = [];
    this.isAnimating = false;
    this.cardElements = new Map();
  }

  /**
   * 初始化渲染器
   * @param {HTMLElement} container - 渲染容器（可选）
   */
  init(container) {
    if (container) {
      this.container = container;
    }
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.container) return;

    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
    this.container.addEventListener('mouseover', this.handleMouseOver.bind(this));
    this.container.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  /**
   * 渲染战斗界面
   * @throws {Error} ERR_RENDER_CONTAINER_NOT_FOUND
   */
  renderCombatScreen() {
    // 此方法不再需要，因为战斗界面已经在 HTML 中静态定义
    // 保留此方法以兼容旧代码，但不再执行任何操作
    console.log('renderCombatScreen called - using static HTML instead');
  }

  /**
   * 更新战斗界面（不重新渲染，只更新数据）
   * @param {Object} combatState - 战斗状态
   */
  updateCombatUI(combatState) {
    if (!combatState) return;

    // 更新玩家状态
    if (combatState.player) {
      this.updatePlayerHealthBar(combatState.player.hp, combatState.player.maxHp);
      this.updatePlayerArmor(combatState.player.armor);
      this.updatePlayerEnergy(combatState.player.energy, combatState.player.maxEnergy);
    }

    // 更新敌人状态
    if (combatState.enemy) {
      this.updateEnemyHealthBar(combatState.enemy.hp, combatState.enemy.maxHp);
      this.updateEnemyArmor(combatState.enemy.armor);
      this.updateEnemyIntent(combatState.enemy.intent);
    }

    // 更新手牌
    if (this.gameState && this.gameState.player && this.gameState.player.hand) {
      this.renderHand(this.gameState.player.hand);
    }
  }

  /**
   * 更新玩家生命值条
   * @param {number} current - 当前生命值
   * @param {number} max - 最大生命值
   */
  updatePlayerHealthBar(current, max) {
    const healthBar = document.querySelector('.player-area .health-fill');
    if (healthBar) {
      const percentage = (current / max) * 100;
      healthBar.style.width = `${percentage}%`;
    }

    // 更新文本显示
    const playerStats = document.querySelector('.player-area .stats');
    if (playerStats) {
      let hpText = playerStats.querySelector('.hp-text');
      if (!hpText) {
        hpText = document.createElement('div');
        hpText.className = 'hp-text';
        playerStats.insertBefore(hpText, playerStats.firstChild);
      }
      hpText.textContent = `HP: ${current}/${max}`;
    }
  }

  /**
   * 更新玩家护甲显示
   * @param {number} armor - 护甲值
   */
  updatePlayerArmor(armor) {
    const armorDisplay = document.querySelector('.player-area .armor-display');
    if (armorDisplay) {
      armorDisplay.textContent = `护甲: ${armor}`;
    }
  }

  /**
   * 更新玩家能量显示
   * @param {number} current - 当前能量
   * @param {number} max - 最大能量
   */
  updatePlayerEnergy(current, max) {
    const energyDisplay = document.querySelector('.player-area .energy-display');
    if (energyDisplay) {
      energyDisplay.textContent = `能量: ${current}/${max}`;
    }
  }

  /**
   * 更新敌人生命值条
   * @param {number} current - 当前生命值
   * @param {number} max - 最大生命值
   */
  updateEnemyHealthBar(current, max) {
    const healthBar = document.querySelector('.enemy-area .health-fill');
    if (healthBar) {
      const percentage = (current / max) * 100;
      healthBar.style.width = `${percentage}%`;
    }

    // 更新敌人名称和HP文本
    const enemyStats = document.querySelector('.enemy-area .stats');
    if (enemyStats) {
      let hpText = enemyStats.querySelector('.hp-text');
      if (!hpText) {
        hpText = document.createElement('div');
        hpText.className = 'hp-text';
        enemyStats.insertBefore(hpText, enemyStats.firstChild);
      }
      hpText.textContent = `HP: ${current}/${max}`;
    }
  }

  /**
   * 更新敌人护甲显示
   * @param {number} armor - 护甲值
   */
  updateEnemyArmor(armor) {
    const armorDisplay = document.querySelector('.enemy-area .armor-display');
    if (armorDisplay) {
      armorDisplay.textContent = `护甲: ${armor}`;
    }
  }

  /**
   * 更新敌人意图显示
   * @param {Object} intent - 意图对象
   */
  updateEnemyIntent(intent) {
    const intentDisplay = document.querySelector('.enemy-area .intent-display');
    if (intentDisplay && intent) {
      const intentText = {
        'attack': `攻击 ${intent.value}`,
        'defend': `防御 ${intent.value}`,
        'skill': `技能 ${intent.value}`,
        'special': `特殊 ${intent.value}`
      }[intent.type] || `意图 ${intent.value || ''}`;
      intentDisplay.textContent = `意图: ${intentText}`;
    }
  }

  /**
   * 渲染手牌
   * @param {Array} cards - 卡牌数组
   * @throws {Error} ERR_CARD_ELEMENT_NOT_FOUND
   */
  renderHand(cards) {
    const handContainer = this.container.querySelector('.hand-container');
    if (!handContainer) {
      throw new Error('ERR_CARD_ELEMENT_NOT_FOUND: 卡牌容器不存在');
    }

    handContainer.innerHTML = '';
    this.cardElements.clear();

    cards.forEach((card, index) => {
      const cardElement = this.createCardElement(card);
      cardElement.style.position = 'absolute';
      cardElement.style.left = `${index * 120}px`;
      cardElement.style.top = '0px';
      handContainer.appendChild(cardElement);

      this.cardElements.set(card.id, cardElement);
    });
  }

  /**
   * 创建卡牌元素
   * @param {Object} card - 卡牌对象
   * @returns {HTMLElement} 卡牌元素
   */
  createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.id = `card-${card.id}`;
    cardEl.draggable = true;
    cardEl.innerHTML = `
      <div class="card-header">
        <div class="card-name">${card.name}</div>
        <div class="card-cost">${card.cost}</div>
      </div>
      <div class="card-body">
        <div class="card-description">${card.description}</div>
      </div>
    `;

    // 根据能量状态设置样式
    if (this.gameState && this.gameState.energy < card.cost) {
      cardEl.classList.add('disabled');
    }

    return cardEl;
  }

  /**
   * 渲染玩家状态
   * @param {Object} player - 玩家状态
   */
  renderPlayerState(player) {
    this.updateHealthBar('player', player.health, player.maxHealth);
    this.updateEnergyBar(player.energy, player.maxEnergy);

    const armorDisplay = this.container.querySelector('.player-stats .armor-display');
    if (armorDisplay) {
      armorDisplay.textContent = `护甲: ${player.armor}`;
    }
  }

  /**
   * 渲染敌人状态
   * @param {Object} enemy - 敌人状态
   */
  renderEnemyState(enemy) {
    this.updateHealthBar('enemy', enemy.health, enemy.maxHealth);
    this.showIntent(enemy.intent, enemy.intentValue);
  }

  /**
   * 更新生命值条
   * @param {string} target - 目标（'player' 或 'enemy'）
   * @param {number} current - 当前生命值
   * @param {number} max - 最大生命值
   */
  updateHealthBar(target, current, max) {
    const healthBar = this.container.querySelector(`.${target}-area .health-bar`);
    if (!healthBar) return;

    const percentage = (current / max) * 100;
    healthBar.style.width = `${percentage}%`;

    // 根据血量设置颜色
    if (percentage > 60) {
      healthBar.style.backgroundColor = '#4ade80';
    } else if (percentage > 30) {
      healthBar.style.backgroundColor = '#fbbf24';
    } else {
      healthBar.style.backgroundColor = '#ef4444';
    }
  }

  /**
   * 更新能量条
   * @param {number} current - 当前能量
   * @param {number} max - 最大能量
   */
  updateEnergyBar(current, max) {
    const energyDisplay = this.container.querySelector('.energy-display');
    if (!energyDisplay) return;

    energyDisplay.textContent = `能量: ${current}/${max}`;
  }

  /**
   * 显示敌人意图
   * @param {string} intent - 意图类型
   * @param {number} value - 意图值
   */
  showIntent(intent, value) {
    const intentDisplay = this.container.querySelector('.intent-display');
    if (!intentDisplay) return;

    const intentText = {
      'attack': `攻击 ${value}`,
      'defend': `防御 ${value}`,
      'skill': `技能 ${value}`,
      'special': `特殊 ${value}`
    }[intent] || `意图 ${value}`;

    intentDisplay.textContent = intentText;
  }

  /**
   * 播放抽牌动画
   * @param {Array} cards - 要抽取的卡牌
   * @returns {Promise<void>}
   */
  playDrawAnimation(cards) {
    if (!this.animationsEnabled || !this.container) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const deckArea = this.container.querySelector('.deck-area');
      const handArea = this.container.querySelector('.hand-container');

      if (!deckArea || !handArea) {
        resolve();
        return;
      }

      cards.forEach((card, index) => {
        setTimeout(() => {
          // 创建飞行动画元素
          const flyingCard = this.createCardElement(card);
          flyingCard.style.position = 'absolute';
          flyingCard.style.left = '0px';
          flyingCard.style.top = '0px';
          flyingCard.style.zIndex = '1000';
          this.container.appendChild(flyingCard);

          // 动画结束后移除
          setTimeout(() => {
            flyingCard.remove();
            if (index === cards.length - 1) {
              resolve();
            }
          }, 400);
        }, index * 100);
      });
    });
  }

  /**
   * 播放出牌动画
   * @param {Object} card - 卡牌对象
   * @param {string} target - 目标类型
   * @returns {Promise<void>}
   */
  playPlayAnimation(card, target) {
    if (!this.animationsEnabled || !this.container) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const cardEl = this.container.querySelector(`#card-${card.id}`);
      if (!cardEl) {
        resolve();
        return;
      }

      // 获取目标位置
      const targetEl = this.container.querySelector(`.${target}-area`) || this.container;
      const targetRect = targetEl.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();

      // 创建动画元素
      const flyingCard = cardEl.cloneNode(true);
      flyingCard.style.position = 'absolute';
      flyingCard.style.left = `${cardRect.left - this.container.getBoundingClientRect().left}px`;
      flyingCard.style.top = `${cardRect.top - this.container.getBoundingClientRect().top}px`;
      flyingCard.style.zIndex = '1000';
      this.container.appendChild(flyingCard);

      // 移除原卡牌
      cardEl.remove();

      // 动画到目标
      setTimeout(() => {
        flyingCard.style.transition = 'all 0.4s ease-out';
        flyingCard.style.left = `${targetRect.left - this.container.getBoundingClientRect().left + targetRect.width / 2 - 50}px`;
        flyingCard.style.top = `${targetRect.top - this.container.getBoundingClientRect().top + targetRect.height / 2 - 50}px`;
        flyingCard.style.opacity = '0';

        setTimeout(() => {
          flyingCard.remove();
          resolve();
        }, 400);
      }, 50);
    });
  }

  /**
   * 播放伤害动画
   * @param {string} target - 目标类型
   * @param {number} amount - 伤害值（负数为治疗）
   * @returns {Promise<void>}
   */
  playDamageAnimation(target, amount) {
    if (!this.animationsEnabled || !this.container) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const targetArea = this.container.querySelector(`.${target}-area`);
      if (!targetArea) {
        resolve();
        return;
      }

      // 创建伤害数字
      const damageText = document.createElement('div');
      damageText.className = 'damage-number';
      damageText.textContent = amount > 0 ? `-${amount}` : `+${Math.abs(amount)}`;
      damageText.style.position = 'absolute';
      damageText.style.color = amount > 0 ? '#ef4444' : '#4ade80';
      damageText.style.fontSize = '24px';
      damageText.style.fontWeight = 'bold';
      damageText.style.zIndex = '1001';

      const targetRect = targetArea.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      damageText.style.left = `${targetRect.left - containerRect.left + targetRect.width / 2}px`;
      damageText.style.top = `${targetRect.top - containerRect.top}px`;

      this.container.appendChild(damageText);

      // 动画效果
      let position = 0;
      const animate = () => {
        position -= 2;
        damageText.style.transform = `translateY(${position}px)`;
        damageText.style.opacity = Math.max(0, 1 + position / 50);

        if (position > -50) {
          requestAnimationFrame(animate);
        } else {
          damageText.remove();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * 播放洗牌动画
   * @returns {Promise<void>}
   */
  playShuffleAnimation() {
    if (!this.animationsEnabled || !this.container) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const deckArea = this.container.querySelector('.deck-area');
      if (!deckArea) {
        resolve();
        return;
      }

      // 简单的翻转动画
      const deckIcon = deckArea.querySelector('.deck-icon');
      if (deckIcon) {
        deckIcon.style.transform = 'rotateY(180deg)';
        setTimeout(() => {
          deckIcon.style.transform = 'rotateY(0deg)';
          setTimeout(resolve, 200);
        }, 200);
      } else {
        resolve();
      }
    });
  }

  /**
   * 显示反馈信息
   * @param {string} message - 反馈消息
   * @param {string} type - 反馈类型（'info', 'success', 'error', 'warning'）
   */
  showFeedback(message, type = 'info') {
    // 在测试环境中，直接返回而不添加到DOM
    if (typeof document === 'undefined' || !document.body) {
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }

    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    feedback.style.position = 'fixed';
    feedback.style.top = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px 20px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '2000';

    switch (type) {
      case 'error':
        feedback.style.backgroundColor = '#ef4444';
        feedback.style.color = 'white';
        break;
      case 'success':
        feedback.style.backgroundColor = '#4ade80';
        feedback.style.color = 'white';
        break;
      case 'warning':
        feedback.style.backgroundColor = '#fbbf24';
        feedback.style.color = 'black';
        break;
      default:
        feedback.style.backgroundColor = '#3b82f6';
        feedback.style.color = 'white';
    }

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transition = 'opacity 0.3s';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }

  /**
   * 处理点击事件
   * @param {MouseEvent} event - 点击事件
   */
  handleClick(event) {
    // 安全检查
    if (!event || !event.target) return;

    const cardEl = event.target.closest('.card');
    if (!cardEl || cardEl.classList.contains('disabled')) {
      if (cardEl && cardEl.classList.contains('disabled')) {
        this.showFeedback('能量不足！', 'error');
      }
      return;
    }

    // 安全获取卡牌ID
    const cardIdMatch = cardEl.id.match(/card-(.+)/);
    if (!cardIdMatch) return;

    const cardId = cardIdMatch[1];
    const card = this.gameState.player.hand.find(c => c.id === cardId);
    if (!card) return;

    // 播放出牌动画
    this.playPlayAnimation(card, 'enemy').then(() => {
      // 更新游戏状态
      this.gameState.player.energy -= card.cost;
      this.gameState.player.hand = this.gameState.player.hand.filter(c => c.id !== cardId);

      // 重新渲染
      this.renderHand(this.gameState.player.hand);
      this.updateEnergyBar(this.gameState.player.energy, this.gameState.player.maxEnergy);
    });
  }

  /**
   * 处理拖拽开始事件
   * @param {DragEvent} event - 拖拽事件
   */
  handleDragStart(event) {
    const cardEl = event.target.closest('.card');
    if (!cardEl || cardEl.classList.contains('disabled')) {
      event.preventDefault();
      return;
    }

    cardEl.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('cardId', cardEl.id.replace('card-', ''));
  }

  /**
   * 处理拖拽结束事件
   * @param {DragEvent} event - 拖拽事件
   */
  handleDragEnd(event) {
    const cardEl = event.target.closest('.card');
    if (cardEl) {
      cardEl.classList.remove('dragging');
    }
  }

  /**
   * 处理鼠标悬停事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseOver(event) {
    const cardEl = event.target.closest('.card');
    if (!cardEl || cardEl.classList.contains('disabled')) return;

    // 创建预览元素
    const card = this.gameState.player.hand.find(c => c.id === cardEl.id.replace('card-', ''));
    if (!card) return;

    const preview = document.createElement('div');
    preview.className = 'card-preview';
    preview.innerHTML = `
      <div class="preview-header">
        <h3>${card.name}</h3>
        <span class="cost">费用: ${card.cost}</span>
      </div>
      <div class="preview-body">
        <p>${card.description}</p>
        ${card.damage ? `<p>伤害: ${card.damage}</p>` : ''}
      </div>
    `;

    preview.style.position = 'fixed';
    preview.style.left = `${event.clientX + 10}px`;
    preview.style.top = `${event.clientY + 10}px`;
    preview.style.zIndex = '1000';

    // 处理测试环境
    if (typeof document.body.querySelector === 'function') {
      document.body.appendChild(preview);
    } else {
      // 在测试环境中直接添加到容器
      this.container.appendChild(preview);
    }

    // 清理函数
    cardEl._previewCleanup = () => {
      preview.remove();
      delete cardEl._previewCleanup;
    };
  }

  /**
   * 处理鼠标移出事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseOut(event) {
    const cardEl = event.target.closest('.card');
    if (cardEl && cardEl._previewCleanup) {
      cardEl._previewCleanup();
    }
  }

  /**
   * 切换动画开关
   * @param {boolean} enabled - 是否启用动画
   */
  toggleAnimations(enabled) {
    this.animationsEnabled = enabled;
  }
}