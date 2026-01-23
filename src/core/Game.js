/**
 * 游戏主类 - 整合所有模块，管理游戏流程
 */

import GameState from './GameState.js';
import { CardManager } from './CardManager.js';
import { CombatSystem } from './CombatSystem.js';
import { LevelManager } from './LevelManager.js';
import GameRenderer from '../ui/GameRenderer.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 'menu',
  LEVEL_SELECT: 'level_select',
  COMBAT: 'combat',
  REWARD: 'reward',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
};

// 错误代码常量
const ERRORS = {
  GAME_NOT_INITIALIZED: 'ERR_GAME_NOT_INITIALIZED',
  INVALID_STATE: 'ERR_INVALID_STATE',
  LEVEL_NOT_FOUND: 'ERR_LEVEL_NOT_FOUND',
  COMBAT_NOT_ACTIVE: 'ERR_COMBAT_NOT_ACTIVE'
};

/**
 * 游戏主类
 */
export class Game {
  constructor() {
    // 核心模块
    this.gameState = new GameState();
    this.cardManager = new CardManager();
    this.combatSystem = new CombatSystem(this.gameState, this.cardManager);
    this.levelManager = new LevelManager(this.gameState, this.combatSystem);
    this.renderer = null;

    // 游戏状态
    this.currentState = GAME_STATES.MENU;
    this.currentLevelId = null;
    this.isInitialized = false;
    this.isLoading = false;

    // 事件监听器
    this.eventListeners = new Map();
  }

  /**
   * 初始化游戏
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.isLoading = true;

      // 加载卡牌数据
      await this.cardManager.loadCards();

      // 加载关卡数据
      await this.levelManager.loadLevelData();

      // 初始化玩家卡组
      await this.initializePlayerDeck();

      this.isInitialized = true;
      this.isLoading = false;

      // 触发初始化完成事件
      this.emit('initialized');

    } catch (error) {
      console.error('游戏初始化失败:', error);
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * 初始化玩家卡组
   * @private
   */
  async initializePlayerDeck() {
    // 创建初始卡组
    const starterDeck = this.cardManager.createStarterDeck();

    // 更新游戏状态中的卡组
    this.gameState.playerState.deck = starterDeck.map(card => card.id);
    this.gameState.playerState.unlockedCards = starterDeck.map(card => card.id);

    // 同步到卡牌管理器
    this.cardManager.deck = starterDeck;
    this.cardManager.drawPile = [...starterDeck];

    return Promise.resolve();
  }

  /**
   * 开始新游戏
   */
  async startNewGame() {
    try {
      console.log('[Game] startNewGame 开始执行');

      if (typeof showLoading === 'function') {
        console.log('[Game] 调用 showLoading');
        showLoading();
      }

      // 重置游戏状态
      console.log('[Game] 重置游戏状态');
      await this.gameState.initNewGame();
      await this.levelManager.resetProgress();
      this.currentLevelId = 1;

      // 重置卡牌管理器
      console.log('[Game] 重置卡牌管理器');
      this.cardManager.resetGame();
      await this.initializePlayerDeck();

      // 初始化第一关
      console.log('[Game] 初始化第一关');
      const firstLevel = this.levelManager.getLevel(1);
      firstLevel.unlocked = true;
      console.log('[Game] 第一关已解锁:', firstLevel);

      // 显示关卡选择界面
      this.currentState = GAME_STATES.LEVEL_SELECT;
      console.log('[Game] 检查 showLevelSelect 函数类型:', typeof showLevelSelect);
      if (typeof showLevelSelect === 'function') {
        console.log('[Game] 调用 showLevelSelect');
        showLevelSelect();
      } else {
        console.error('[Game] showLevelSelect 不是一个函数!');
      }

      // 触发事件
      this.emit('newGameStarted');
      console.log('[Game] startNewGame 完成');

    } catch (error) {
      console.error('[Game] 开始新游戏失败:', error);
      if (typeof showError === 'function') {
        showError('无法开始新游戏: ' + error.message);
      }
    }
  }

  /**
   * 加载游戏
   */
  async loadGame() {
    try {
      if (typeof showLoading === 'function') {
        showLoading();
      }

      // 加载最新存档
      const savedState = await this.gameState.loadLatestSave();
      if (!savedState) {
        if (typeof showError === 'function') {
          showError('没有找到存档');
        }
        return;
      }

      // 恢复关卡进度
      await this.levelManager.loadLevelData();

      // 设置当前关卡
      this.currentLevelId = this.gameState.progressState.currentLevel;

      // 显示关卡选择界面
      this.currentState = GAME_STATES.LEVEL_SELECT;
      if (typeof showLevelSelect === 'function') {
        showLevelSelect();
      }

      // 触发事件
      this.emit('gameLoaded');

    } catch (error) {
      console.error('加载游戏失败:', error);
      if (typeof showError === 'function') {
        showError('加载游戏失败: ' + error.message);
      }
    }
  }

  /**
   * 返回主菜单
   */
  backToMainMenu() {
    this.currentState = GAME_STATES.MENU;
    if (typeof showMainMenu === 'function') {
      showMainMenu();
    }

    // 停止任何进行中的战斗
    if (this.combatSystem && this.combatState && this.combatState.inCombat) {
      this.combatSystem.endCombat('interrupted');
    }

    this.emit('backToMenu');
  }

  /**
   * 选择关卡
   * @param {number} levelId - 关卡ID
   */
  async selectLevel(levelId) {
    try {
      this.currentLevelId = levelId;

      // 加载关卡
      const level = await this.levelManager.loadLevel(levelId);

      // 根据关卡类型进入不同流程
      switch (level.type) {
        case 'normal':
        case 'elite':
        case 'boss':
          await this.startCombat(level);
          break;
        case 'rest':
          await this.visitRestSite(level);
          break;
        case 'shop':
          await this.visitShop(level);
          break;
        default:
          throw new Error(`未知的关卡类型: ${level.type}`);
      }

    } catch (error) {
      console.error('选择关卡失败:', error);
      showError('无法进入关卡: ' + error.message);
    }
  }

  /**
   * 开始战斗
   * @param {Object} level - 关卡数据
   */
  async startCombat(level) {
    try {
      this.currentState = GAME_STATES.COMBAT;
      if (typeof showCombatScreen === 'function') {
        showCombatScreen();
      }

      // 设置渲染器引用
      this.combatSystem.gameRenderer = this.renderer;

      // 开始战斗
      this.combatSystem.startCombat(level.enemies[0]);

      // 渲染战斗界面
      if (this.renderer) {
        // 不调用 renderCombatScreen，因为 HTML 已经有静态的战斗界面
        this.updateCombatUI();
      }

      // 触发战斗开始事件
      this.emit('combatStarted', level);

    } catch (error) {
      console.error('开始战斗失败:', error);
      if (typeof showError === 'function') {
        showError('战斗初始化失败: ' + error.message);
      }
    }
  }

  /**
   * 访问休息点
   * @param {Object} level - 关卡数据
   */
  async visitRestSite(level) {
    try {
      // 自动回复生命值
      const healAmount = Math.floor(this.gameState.playerState.maxHp * 0.3);
      this.gameState.playerState.hp = Math.min(
        this.gameState.playerState.maxHp,
        this.gameState.playerState.hp + healAmount
      );

      // 显示休息点界面
      if (typeof showRewardScreen === 'function') {
        showRewardScreen();
      }

      // 显示恢复信息
      if (this.renderer) {
        this.renderer.showFeedback(`恢复了 ${healAmount} 点生命值！`, 'success');
      }

      // 完成关卡
      await this.completeLevel();

    } catch (error) {
      console.error('访问休息点失败:', error);
      if (typeof showError === 'function') {
        showError('无法使用休息点: ' + error.message);
      }
    }
  }

  /**
   * 访问商店
   * @param {Object} level - 关卡数据
   */
  async visitShop(level) {
    try {
      // TODO: 实现商店逻辑
      this.currentState = GAME_STATES.REWARD;
      if (typeof showRewardScreen === 'function') {
        showRewardScreen();
      }

      if (this.renderer) {
        this.renderer.showFeedback('商店功能开发中...', 'info');
      }

    } catch (error) {
      console.error('访问商店失败:', error);
      if (typeof showError === 'function') {
        showError('无法访问商店: ' + error.message);
      }
    }
  }

  /**
   * 结束玩家回合
   */
  endPlayerTurn() {
    if (this.currentState !== GAME_STATES.COMBAT) {
      if (typeof showError === 'function') {
        showError('当前不在战斗中');
      }
      return;
    }

    try {
      console.log('结束玩家回合');
      this.combatSystem.endPlayerTurn();

      // 延迟后执行敌人回合
      setTimeout(() => {
        console.log('开始敌人回合');
        const battleResult = this.combatSystem.enemyTurn(false);

        // 检查战斗是否结束
        if (battleResult !== 'continue') {
          this.handleBattleEnd(battleResult);
          return;
        }

        // 敌人回合结束后，延迟开始新的玩家回合
        setTimeout(() => {
          console.log('开始新的玩家回合');
          this.combatSystem.startPlayerTurn();
          this.updateCombatUI();
          if (this.renderer) {
            this.renderer.showFeedback('你的回合', 'info');
          }
        }, 1000);

      }, 500);

      this.emit('playerTurnEnded');

    } catch (error) {
      console.error('结束回合失败:', error);
      if (typeof showError === 'function') {
        showError('结束回合失败: ' + error.message);
      }
    }
  }

  /**
   * 处理战斗结束
   * @param {string} result - 战斗结果 ('victory', 'defeat', 'draw')
   */
  handleBattleEnd(result) {
    console.log('战斗结束:', result);

    if (result === 'victory') {
      // 战斗胜利，完成关卡
      if (this.renderer) {
        this.renderer.showFeedback('战斗胜利！', 'success');
      }
      setTimeout(() => {
        this.completeLevel(this.currentLevelId);
      }, 1500);
    } else if (result === 'defeat') {
      // 战斗失败
      if (this.renderer) {
        this.renderer.showFeedback('战斗失败...', 'error');
      }
      setTimeout(() => {
        this.gameDefeat();
      }, 1500);
    } else {
      // 平局
      if (this.renderer) {
        this.renderer.showFeedback('战斗平局', 'info');
      }
      this.backToMainMenu();
    }
  }

  /**
   * 下一回合（调试用）
   */
  nextTurn() {
    if (this.currentState !== GAME_STATES.COMBAT) {
      if (typeof showError === 'function') {
        showError('当前不在战斗中');
      }
      return;
    }

    // 简单的下一回合逻辑
    if (this.combatSystem.combatState.currentTurn === 'player') {
      this.endPlayerTurn();
    } else {
      this.combatSystem.startPlayerTurn();
      this.updateCombatUI();
    }
  }

  /**
   * 完成关卡
   */
  async completeLevel() {
    if (!this.currentLevelId) {
      throw new Error(ERRORS.LEVEL_NOT_FOUND);
    }

    try {
      // 完成关卡
      const nextLevel = await this.levelManager.completeLevel(this.currentLevelId);

      // 生成并发放奖励
      const rewards = this.levelManager.generateRewards(this.currentLevelId);
      for (const reward of rewards) {
        await this.levelManager.giveReward(reward);
      }

      // 显示奖励界面
      if (rewards.length > 0) {
        this.showRewardScreen(rewards);
      }

      // 检查是否有下一关
      if (nextLevel) {
        this.currentLevelId = nextLevel.id;
        this.currentState = GAME_STATES.LEVEL_SELECT;
        if (typeof showLevelSelect === 'function') {
          showLevelSelect();
        }
      } else {
        // 游戏通关
        this.gameVictory();
      }

      // 自动保存
      if (this.gameState.settings.autoSave) {
        await this.gameState.autoSave();
      }

      this.emit('levelCompleted', { levelId: this.currentLevelId, rewards });

    } catch (error) {
      console.error('完成关卡失败:', error);
      throw error;
    }
  }

  /**
   * 游戏胜利
   */
  gameVictory() {
    this.currentState = GAME_STATES.VICTORY;
    if (typeof showGameOverScreen === 'function') {
      showGameOverScreen(true);
    }

    if (this.renderer) {
      this.renderer.showFeedback('恭喜通关！', 'success');
    }

    this.emit('gameVictory');
  }

  /**
   * 游戏失败
   */
  gameDefeat() {
    this.currentState = GAME_STATES.GAME_OVER;
    if (typeof showGameOverScreen === 'function') {
      showGameOverScreen(false);
    }

    if (this.renderer) {
      this.renderer.showFeedback('游戏结束...', 'error');
    }

    this.emit('gameDefeat');
  }

  /**
   * 更新战斗UI
   * @private
   */
  updateCombatUI() {
    if (!this.renderer || !this.combatSystem.combatState) {
      return;
    }

    const combatState = this.combatSystem.combatState;

    // 使用新的更新方法而不是重新渲染
    if (typeof this.renderer.updateCombatUI === 'function') {
      this.renderer.updateCombatUI(combatState);
    } else {
      // 回退到旧方法
      this.renderer.renderPlayerState(combatState.player);
      this.renderer.renderEnemyState(combatState.enemy);
    }

    // 更新手牌
    if (this.cardManager && this.cardManager.hand) {
      const handContainer = document.querySelector('.hand-container');
      if (handContainer) {
        this.renderHandInContainer(this.cardManager.hand, handContainer);
      }
    }

    // 更新抽牌堆和弃牌堆数量
    this.updateDeckPileUI();
  }

  /**
   * 更新抽牌堆和弃牌堆UI
   * @private
   */
  updateDeckPileUI() {
    const deckCount = document.querySelector('.deck-count');
    if (deckCount && this.cardManager) {
      deckCount.textContent = this.cardManager.drawPile.length;
    }

    const discardCount = document.querySelector('.discard-count');
    if (discardCount && this.cardManager) {
      discardCount.textContent = this.cardManager.discardPile.length;
    }
  }

  /**
   * 在指定容器中渲染手牌
   * @param {Array} cards - 卡牌数组
   * @param {HTMLElement} container - 容器元素
   * @private
   */
  renderHandInContainer(cards, container) {
    container.innerHTML = '';

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      const canAfford = card.cost <= this.combatSystem.combatState.player.energy;
      if (!canAfford) {
        cardEl.classList.add('disabled');
      }

      cardEl.innerHTML = `
        <div class="card-header">
          <div class="card-name">${card.name}</div>
          <div class="card-cost">${card.cost}</div>
        </div>
        <div class="card-description">${card.description}</div>
      `;

      // 添加点击事件来打出卡牌
      if (canAfford && this.currentState === 'combat') {
        cardEl.style.cursor = 'pointer';
        cardEl.addEventListener('click', () => {
          this.playCard(card);
        });
      }

      container.appendChild(cardEl);
    });
  }

  /**
   * 打出卡牌
   * @param {Object} card - 要打出的卡牌
   */
  async playCard(card) {
    try {
      console.log('打出卡牌:', card);

      // 检查是否在战斗中且是玩家回合
      if (this.currentState !== 'combat') {
        console.warn('当前不在战斗中');
        return;
      }

      if (this.combatSystem.combatState.currentTurn !== 'player') {
        console.warn('当前不是玩家回合');
        return;
      }

      // 根据卡牌类型确定目标
      let target = 'enemy'; // 默认目标是敌人
      if (card.type === 'defense') {
        target = 'player'; // 防御卡作用于玩家
      } else if (card.type === 'skill') {
        // 技能卡根据效果类型决定目标
        if (card.effect) {
          if (['draw', 'energy', 'draw_energy'].includes(card.effect.type)) {
            target = 'player'; // 抽牌、加能量作用于玩家
          } else {
            target = 'enemy'; // 其他技能效果（伤害、易伤等）作用于敌人
          }
        }
      }

      console.log('卡牌目标:', target);

      // 使用 CombatSystem 打出卡牌（它会检查能量并执行效果）
      this.combatSystem.playCard(card.id, target);

      // 更新UI
      this.updateCombatUI();

      // 显示反馈
      if (this.renderer) {
        this.renderer.showFeedback(`使用了 ${card.name}`, 'success');
      }

    } catch (error) {
      console.error('打出卡牌失败:', error);
      if (this.renderer) {
        this.renderer.showFeedback(error.message, 'error');
      }
    }
  }

  /**
   * 显示奖励界面
   * @param {Array} rewards - 奖励数组
   * @private
   */
  showRewardScreen(rewards) {
    this.currentState = GAME_STATES.REWARD;
    if (typeof showRewardScreen === 'function') {
      showRewardScreen();
    }

    const rewardItemsContainer = document.getElementById('reward-items');
    const cardChoiceContainer = document.getElementById('card-choice-container');
    const cardChoiceCards = document.getElementById('card-choice-cards');
    const nextLevelBtn = document.getElementById('btn-next-level');
    const skipCardBtn = document.getElementById('btn-skip-card');

    // 清空之前的奖励内容
    if (rewardItemsContainer) {
      rewardItemsContainer.innerHTML = '';
    }
    if (cardChoiceCards) {
      cardChoiceCards.innerHTML = '';
    }

    // 处理奖励
    rewards.forEach(reward => {
      if (reward.type === 'gold') {
        // 显示金币奖励
        const goldDiv = document.createElement('div');
        goldDiv.className = 'reward-item gold-reward';
        goldDiv.innerHTML = `<span class="reward-icon">💰</span><span class="reward-text">+${reward.amount} 金币</span>`;
        if (rewardItemsContainer) {
          rewardItemsContainer.appendChild(goldDiv);
        }
      } else if (reward.type === 'card_choice' && reward.cards && reward.cards.length > 0) {
        // 显示卡牌选择
        if (cardChoiceContainer) {
          cardChoiceContainer.style.display = 'block';
        }

        // 隐藏"下一关"按钮，等选择完再显示
        if (nextLevelBtn) {
          nextLevelBtn.style.display = 'none';
        }

        // 渲染卡牌选项
        reward.cards.forEach(card => {
          const cardEl = this.createRewardCardElement(card);
          if (cardChoiceCards) {
            cardChoiceCards.appendChild(cardEl);
          }
        });

        // 设置跳过按钮
        if (skipCardBtn) {
          skipCardBtn.style.display = 'inline-block';
          skipCardBtn.onclick = () => {
            this.finishCardSelection();
          };
        }
      }
    });

    if (this.renderer) {
      // 显示奖励信息
      rewards.forEach(reward => {
        let message = '';
        switch (reward.type) {
          case 'gold':
            message = `获得 ${reward.amount} 金币！`;
            break;
          case 'card_choice':
            message = '选择一张卡牌加入卡组！';
            break;
          default:
            message = '获得奖励！';
        }
        this.renderer.showFeedback(message, 'success');
      });
    }
  }

  /**
   * 创建奖励卡牌元素
   * @param {Object} card - 卡牌数据
   * @returns {HTMLElement} 卡牌元素
   * @private
   */
  createRewardCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card-reward card-${card.rarity}`;
    cardEl.dataset.cardId = card.id;

    const rarityClass = {
      common: 'card-common',
      rare: 'card-rare',
      epic: 'card-epic'
    };

    cardEl.innerHTML = `
      <div class="card-icon">${card.icon || '🎴'}</div>
      <div class="card-info">
        <div class="card-name">${card.name}</div>
        <div class="card-cost">能量: ${card.cost}</div>
        <div class="card-description">${card.description}</div>
        <div class="card-rarity ${rarityClass[card.rarity] || ''}">${card.rarity || 'common'}</div>
      </div>
    `;

    // 点击选择卡牌
    cardEl.addEventListener('click', () => {
      this.selectCard(card);
    });

    return cardEl;
  }

  /**
   * 选择卡牌加入卡组
   * @param {Object} card - 选择的卡牌
   * @private
   */
  selectCard(card) {
    if (this.cardManager) {
      // 添加卡牌到卡组
      this.cardManager.addToDeck(card);

      if (this.renderer) {
        this.renderer.showFeedback(`获得了 ${card.name}！`, 'success');
      }

      // 禁用所有卡牌选择
      const cardCards = document.querySelectorAll('.card-reward');
      cardCards.forEach(el => {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.5';
      });

      // 高亮选中的卡牌
      const selectedCard = document.querySelector(`.card-reward[data-card-id="${card.id}"]`);
      if (selectedCard) {
        selectedCard.style.opacity = '1';
        selectedCard.classList.add('card-selected');
      }

      // 延迟后关闭选择界面
      setTimeout(() => {
        this.finishCardSelection();
      }, 500);
    }
  }

  /**
   * 完成卡牌选择
   * @private
   */
  finishCardSelection() {
    const cardChoiceContainer = document.getElementById('card-choice-container');
    const nextLevelBtn = document.getElementById('btn-next-level');
    const skipCardBtn = document.getElementById('btn-skip-card');

    if (cardChoiceContainer) {
      cardChoiceContainer.style.display = 'none';
    }
    if (nextLevelBtn) {
      nextLevelBtn.style.display = 'inline-block';
    }
    if (skipCardBtn) {
      skipCardBtn.style.display = 'none';
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   * @private
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器错误 [${event}]:`, error);
        }
      });
    }
  }

  /**
   * 获取当前游戏状态
   * @returns {Object} 游戏状态
   */
  getState() {
    return {
      currentState: this.currentState,
      currentLevelId: this.currentLevelId,
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      gameState: this.gameState.getState(),
      combatState: this.combatSystem.getCombatState(),
      levelStats: this.levelManager.getGameStats()
    };
  }

  /**
   * 保存游戏
   * @param {number} slotId - 存档槽位
   * @returns {Promise<boolean>}
   */
  async saveGame(slotId = 1) {
    try {
      return await this.gameState.saveToSlot(slotId);
    } catch (error) {
      console.error('保存游戏失败:', error);
      showError('保存失败: ' + error.message);
      return false;
    }
  }

  /**
   * 获取存档槽位信息
   * @returns {Promise<Array>}
   */
  async getSaveSlots() {
    return await this.gameState.getSaveSlots();
  }

  /**
   * 重置游戏
   * @returns {Promise<void>}
   */
  async resetGame() {
    try {
      // 确认重置
      if (!confirm('确定要重置游戏吗？所有进度将丢失！')) {
        return;
      }

      // 重置所有模块
      await this.gameState.resetGame();
      await this.levelManager.resetProgress();
      this.cardManager.resetGame();

      // 重置状态
      this.currentState = GAME_STATES.MENU;
      this.currentLevelId = null;

      // 显示主菜单
      if (typeof showMainMenu === 'function') {
        showMainMenu();
      }

      this.emit('gameReset');

    } catch (error) {
      console.error('重置游戏失败:', error);
      showError('重置失败: ' + error.message);
    }
  }
}

// 导出游戏状态常量和错误代码
export { GAME_STATES, ERRORS };

// 导出游戏单例
export const gameInstance = new Game();
export default gameInstance;
