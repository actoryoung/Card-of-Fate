/**
 * 战斗系统核心类
 * 处理战斗回合流程、卡牌效果执行、伤害计算、状态效果管理
 */

// 状态效果类型常量
const STATUS_TYPES = {
  POISON: 'poison',
  BURN: 'burn',
  WEAK: 'weak',
  VULNERABLE: 'vulnerable',
  DISARM: 'disarm'
};

// 敌人意图类型常量
const INTENTS = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  SKILL: 'skill'
};

// 卡牌类型常量
const CARD_TYPES = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  SKILL: 'skill'
};

// 错误代码常量
const ERRORS = {
  INVALID_TARGET: 'ERR_INVALID_TARGET',
  INSUFFICIENT_ENERGY: 'ERR_INSUFFICIENT_ENERGY',
  CARD_NOT_PLAYABLE: 'ERR_CARD_NOT_PLAYABLE',
  COMBAT_NOT_INITIALIZED: 'ERR_COMBAT_NOT_INITIALIZED',
  INVALID_EFFECT: 'ERR_INVALID_EFFECT'
};

class CombatSystem {
  /**
   * 构造函数
   * @param {Object} gameState - 游戏状态管理器
   * @param {Object} cardManager - 卡牌管理器
   * @param {Object} gameRenderer - 游戏渲染器
   */
  constructor(gameState = null, cardManager = null, gameRenderer = null) {
    this.gameState = gameState;
    this.cardManager = cardManager;
    this.gameRenderer = gameRenderer;

    // 战斗状态
    this.combatState = null;
    this.combatLog = [];
    this.turnCount = 0;
    this.playerTurn = true;
    this.maxTurns = 50; // 防止无限循环

    // 连击系统
    this.lastCardType = null;
  }

  /**
   * 开始战斗
   * @param {Object} enemy - 敌人对象
   */
  startCombat(enemy) {
    // 清空手牌和弃牌堆，确保每次战斗从干净状态开始
    if (this.cardManager) {
      this.cardManager.hand = [];
      this.cardManager.discardPile = [];
      // 重新初始化抽牌堆（从卡组复制）并洗牌
      if (this.cardManager.deck && this.cardManager.deck.length > 0) {
        this.cardManager.drawPile = this.cardManager.shuffleDeck([...this.cardManager.deck]);
      }
      console.log('[CombatSystem] 战斗开始：已清空手牌和弃牌堆，抽牌堆洗牌后为', this.cardManager.drawPile.length, '张');
    }

    // 初始化战斗状态
    this.combatState = {
      turn: 1,
      currentTurn: 'player',
      inCombat: true,
      player: {
        hp: 100,
        maxHp: 100,
        energy: 3,
        maxEnergy: 3,
        armor: 0,
        statusEffects: [],
        bonusDamage: 0
      },
      enemy: {
        id: enemy.id,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.hp,
        attack: enemy.attack || 10,
        armor: enemy.armor || 0,
        intent: null,
        statusEffects: []
      }
    };

    // 重置战斗相关状态
    this.combatLog = [];
    this.turnCount = 0;
    this.playerTurn = true;
    this.lastCardType = null;

    // 添加战斗日志
    this.addCombatLog(`战斗开始！敌人: ${enemy.name}`);

    // 开始玩家回合
    this.startPlayerTurn();
  }

  /**
   * 开始玩家回合
   */
  startPlayerTurn() {
    if (!this.combatState) return;

    this.playerTurn = true;
    this.combatState.currentTurn = 'player';

    // 触发回合开始效果
    this.processTurnStartEffects(this.combatState.player);

    // 自动抽5张牌
    this.drawCards(5);

    // 重置能量
    this.combatState.player.energy = this.combatState.player.maxEnergy;

    // 检查状态效果
    this.processStatusEffects(this.combatState.player);
    this.processStatusEffects(this.combatState.enemy);

    this.addCombatLog(`玩家回合开始 #${this.combatState.turn}`);
  }

  /**
   * 结束玩家回合
   */
  endPlayerTurn() {
    if (!this.combatState || this.combatState.currentTurn !== 'player') return;

    // 触发回合结束效果
    this.processTurnEndEffects(this.combatState.player);

    // 弃置所有手牌
    this.discardAllHandCards();

    // 结束回合
    this.playerTurn = false;
    this.combatState.currentTurn = 'enemy';
  }

  /**
   * 敌人回合
   * @param {boolean} autoStartNextTurn - 是否自动开始下一回合
   * @returns {string} 战斗结果
   */
  enemyTurn(autoStartNextTurn = true) {
    if (!this.combatState) {
      console.warn('[CombatSystem] 敌人回合：combatState 不存在');
      return 'continue';
    }

    console.log('[CombatSystem] 敌人回合开始');
    console.log('[CombatSystem] 玩家HP:', this.combatState.player.hp, '敌人HP:', this.combatState.enemy.hp);

    // 显示敌人意图
    this.showEnemyIntent();

    // 执行敌人行动
    this.executeEnemyAction();

    console.log('[CombatSystem] 敌人行动完成');
    console.log('[CombatSystem] 玩家HP:', this.combatState.player.hp, '敌人HP:', this.combatState.enemy.hp);

    // 检查战斗结束
    const battleResult = this.checkBattleEnd();
    console.log('[CombatSystem] 战斗结果:', battleResult);

    if (battleResult !== 'continue') {
      this.endCombat(battleResult);
      return battleResult;
    }

    // 自动开始下一个玩家回合
    if (autoStartNextTurn) {
      this.combatState.turn++;
      this.startPlayerTurn();
    }
    // 否则保持敌人回合，等待手动切换

    return 'continue';
  }

  /**
   * 打出卡牌
   * @param {string} cardId - 卡牌ID
   * @param {string} targetId - 目标ID ('player' 或 'enemy')
   * @returns {boolean} 是否成功打出卡牌
   */
  playCard(cardId, targetId) {
    if (!this.combatState || this.combatState.currentTurn !== 'player') {
      throw new Error(ERRORS.COMBAT_NOT_INITIALIZED);
    }

    const card = this.cardManager ? this.cardManager.getCard(cardId) : null;
    if (!card) {
      throw new Error('ERR_INVALID_CARD');
    }

    // 检查卡牌类型是否有效
    if (!Object.values(CARD_TYPES).includes(card.type)) {
      throw new Error(ERRORS.INVALID_EFFECT);
    }

    // 检查目标是否有效
    if (targetId !== 'player' && targetId !== 'enemy') {
      throw new Error(ERRORS.INVALID_TARGET);
    }

    // 检查能量
    if (this.combatState.player.energy < card.cost) {
      throw new Error(ERRORS.INSUFFICIENT_ENERGY);
    }

    // 执行卡牌效果
    this.executeCardEffect(card, targetId);

    // 消耗能量
    this.combatState.player.energy -= card.cost;

    // 从手牌移除
    if (this.cardManager && this.cardManager.removeFromHand) {
      this.cardManager.removeFromHand(cardId);
    }

    return true;
  }

  /**
   * 执行卡牌效果
   * @param {Object} card - 卡牌对象
   * @param {string} target - 目标
   */
  executeCardEffect(card, target) {
    switch (card.type) {
      case CARD_TYPES.ATTACK:
        this.executeAttackCard(card, target);
        break;
      case CARD_TYPES.DEFEND:
        this.executeDefendCard(card, target);
        break;
      case CARD_TYPES.SKILL:
        this.executeSkillCard(card, target);
        break;
      default:
        throw new Error(ERRORS.INVALID_EFFECT);
    }
  }

  /**
   * 执行攻击卡
   * @param {Object} card - 攻击卡
   * @param {string} target - 目标
   */
  executeAttackCard(card, target) {
    // 从 effect 中获取伤害值
    let damage = 0;
    if (card.effect) {
      if (card.effect.type === 'damage') {
        damage = card.effect.value || 0;
      } else if (card.effect.type === 'damage_multi') {
        damage = (card.effect.value || 0) * (card.effect.count || 1);
      }
    }

    // 如果没有 effect，尝试直接从 card 获取
    if (damage === 0 && card.damage) {
      damage = card.damage;
    }

    // 连击系统
    if (this.lastCardType === CARD_TYPES.ATTACK) {
      damage = Math.floor(damage * 1.1); // 10% 连击加成
    }
    this.lastCardType = CARD_TYPES.ATTACK;

    const targetObj = this.getTarget(target);
    if (!targetObj || targetObj === this.combatState.player) {
      throw new Error(ERRORS.INVALID_TARGET);
    }

    const actualDamage = this.calculateDamage(damage, this.combatState.player, targetObj);

    // 应用伤害
    targetObj.hp = Math.max(0, targetObj.hp - actualDamage);

    // 显示伤害
    if (this.gameRenderer && this.gameRenderer.showDamage) {
      this.gameRenderer.showDamage(actualDamage, target === 'player');
    }

    this.addCombatLog(`造成 ${actualDamage} 点伤害给 ${targetObj.name}`);
  }

  /**
   * 执行防御卡
   * @param {Object} card - 防御卡
   * @param {string} target - 目标
   */
  executeDefendCard(card, target) {
    const targetObj = this.getTarget(target);
    if (!targetObj || targetObj === this.combatState.enemy) {
      throw new Error(ERRORS.INVALID_TARGET);
    }

    // 从 effect 中获取护甲值
    let armorGain = 0;
    if (card.effect && card.effect.type === 'armor') {
      armorGain = card.effect.value || 0;
    } else if (card.armor) {
      armorGain = card.armor;
    }

    targetObj.armor += armorGain;

    // 显示护甲
    if (this.gameRenderer && this.gameRenderer.showArmor) {
      this.gameRenderer.showArmor(armorGain);
    }

    this.addCombatLog(`${targetObj.name} 获得 ${armorGain} 护甲`);
    this.lastCardType = CARD_TYPES.DEFEND;
  }

  /**
   * 执行技能卡
   * @param {Object} card - 技能卡
   * @param {string} target - 目标
   */
  executeSkillCard(card, target) {
    const effect = card.effect;
    console.log('[CombatSystem] 执行技能卡效果:', effect.type, effect);

    if (effect.type === 'damage') {
      const targetObj = this.getTarget(target);
      if (!targetObj || targetObj === this.combatState.player) {
        throw new Error(ERRORS.INVALID_TARGET);
      }

      const actualDamage = this.calculateDamage(effect.value, this.combatState.player, targetObj);
      targetObj.hp = Math.max(0, targetObj.hp - actualDamage);

      if (this.gameRenderer && this.gameRenderer.showDamage) {
        this.gameRenderer.showDamage(actualDamage, target === 'player');
      }
      this.addCombatLog(`技能造成 ${actualDamage} 点伤害`);

    } else if (effect.type === 'status') {
      const targetObj = this.getTarget(target);
      if (!targetObj) {
        throw new Error(ERRORS.INVALID_TARGET);
      }

      this.applyStatusEffect(targetObj, effect.status, effect.duration, effect.value);
      this.addCombatLog(`对 ${targetObj.name} 施加 ${effect.status} 状态`);

    } else if (effect.type === 'heal') {
      const targetObj = this.getTarget(target);
      if (!targetObj || targetObj === this.combatState.enemy) {
        throw new Error(ERRORS.INVALID_TARGET);
      }

      const healAmount = effect.value;
      targetObj.hp = Math.min(targetObj.maxHp, targetObj.hp + healAmount);
      this.addCombatLog(`${targetObj.name} 恢复 ${healAmount} 生命`);

    } else if (effect.type === 'draw') {
      // 抽牌效果
      const drawCount = effect.value || 1;
      console.log('[CombatSystem] 抽牌效果:', drawCount);
      const drawnCards = this.drawCards(drawCount);
      this.addCombatLog(`抽了 ${drawnCards.length} 张牌`);

    } else if (effect.type === 'energy') {
      // 获得能量效果
      const energyGain = effect.value || 1;
      console.log('[CombatSystem] 能量效果:', energyGain);
      this.combatState.player.energy = Math.min(
        this.combatState.player.maxEnergy,
        this.combatState.player.energy + energyGain
      );
      this.addCombatLog(`获得 ${energyGain} 点能量`);

    } else if (effect.type === 'vulnerable') {
      // 易伤效果
      const targetObj = this.getTarget(target);
      if (!targetObj || targetObj === this.combatState.player) {
        throw new Error(ERRORS.INVALID_TARGET);
      }

      const duration = effect.value || 1;
      this.applyStatusEffect(targetObj, 'vulnerable', duration, 0);
      this.addCombatLog(`敌人获得易伤，持续 ${duration} 回合`);

    } else if (effect.type === 'draw_energy') {
      // 抽牌+能量效果（战斗节奏卡）
      const value = effect.value || 1;
      console.log('[CombatSystem] 抽牌+能量效果:', value);

      // 抽1张牌
      const drawnCards = this.drawCards(1);

      // 获得1点能量
      this.combatState.player.energy = Math.min(
        this.combatState.player.maxEnergy,
        this.combatState.player.energy + value
      );

      this.addCombatLog(`抽 ${drawnCards.length} 张牌，获得 ${value} 点能量`);

    } else {
      console.warn('[CombatSystem] 未知的技能效果类型:', effect.type);
      throw new Error(ERRORS.INVALID_EFFECT);
    }

    this.lastCardType = CARD_TYPES.SKILL;
  }

  /**
   * 计算伤害
   * @param {number} baseDamage - 基础伤害
   * @param {Object} attacker - 攻击者
   * @param {Object} defender - 防御者
   * @returns {number} 最终伤害
   */
  calculateDamage(baseDamage, attacker, defender) {
    let damage = baseDamage;

    // 添加攻击者加成
    if (attacker.bonusDamage) {
      damage += attacker.bonusDamage;
    }

    // 处理状态效果
    if (defender.statusEffects && defender.statusEffects.length > 0) {
      // 虚弱效果减少25%伤害
      const weakEffect = defender.statusEffects.find(s => s.type === STATUS_TYPES.WEAK);
      if (weakEffect) {
        damage = Math.floor(damage * 0.75);
      }

      // 易伤效果增加50%伤害
      const vulnerableEffect = defender.statusEffects.find(s => s.type === STATUS_TYPES.VULNERABLE);
      if (vulnerableEffect) {
        damage = Math.floor(damage * 1.5);
      }
    }

    // 计算最终伤害
    damage = damage - defender.armor;

    // 最小伤害为1
    damage = Math.max(1, damage);

    return damage;
  }

  /**
   * 应用状态效果
   * @param {Object} target - 目标
   * @param {string} type - 状态类型
   * @param {number} duration - 持续回合数
   * @param {number} value - 效果值
   */
  applyStatusEffect(target, type, duration, value) {
    // 检查是否已有相同状态
    const existingEffect = target.statusEffects.find(s => s.type === type);

    if (existingEffect) {
      // 对于 poison 和 burn，刷新持续时间并增加效果值
      if ([STATUS_TYPES.POISON, STATUS_TYPES.BURN].includes(type)) {
        existingEffect.duration = duration;
        existingEffect.value += value;
      } else {
        // 对于其他状态，只叠加效果值
        existingEffect.value += value;
      }
    } else {
      // 添加新状态
      target.statusEffects.push({
        type,
        duration,
        value,
        source: 'player'
      });
    }

    // 显示状态效果
    if (this.gameRenderer && this.gameRenderer.showStatusEffect) {
      this.gameRenderer.showStatusEffect(type, duration);
    }
  }

  /**
   * 处理状态效果
   * @param {Object} fighter - 战斗者
   */
  processStatusEffects(fighter) {
    if (!fighter || !fighter.statusEffects || fighter.statusEffects.length === 0) {
      return;
    }

    const isPlayer = this.combatState && fighter === this.combatState.player;
    const isEnemy = this.combatState && fighter === this.combatState.enemy;

    const effectsToProcess = [...fighter.statusEffects];

    for (const effect of effectsToProcess) {
      switch (effect.type) {
        case STATUS_TYPES.POISON:
          const poisonDamage = effect.value;
          fighter.hp = Math.max(0, fighter.hp - poisonDamage);
          if (this.gameRenderer && this.gameRenderer.showDamage) {
            this.gameRenderer.showDamage(poisonDamage, isPlayer);
          }
          this.addCombatLog(`${fighter.name || '目标'} 受到中毒伤害 ${poisonDamage}`);
          break;

        case STATUS_TYPES.BURN:
          const burnDamage = Math.floor(fighter.maxHp * effect.value / 100);
          fighter.hp = Math.max(0, fighter.hp - burnDamage);
          if (this.gameRenderer && this.gameRenderer.showDamage) {
            this.gameRenderer.showDamage(burnDamage, isPlayer);
          }
          this.addCombatLog(`${fighter.name || '目标'} 受到燃烧伤害 ${burnDamage}`);
          break;
      }
    }
  }

  /**
   * 处理回合开始效果
   * @param {Object} fighter - 战斗者
   */
  processTurnStartEffects(fighter) {
    if (!fighter || !fighter.statusEffects) {
      return;
    }

    // 减少所有持续回合数
    fighter.statusEffects = fighter.statusEffects.filter(effect => {
      effect.duration--;
      return effect.duration > 0;
    });
  }

  /**
   * 处理回合结束效果
   * @param {Object} fighter - 战斗者
   */
  processTurnEndEffects(fighter) {
    // 触发回合结束相关效果
    // 这里可以扩展更多逻辑
  }

  /**
   * 显示敌人意图
   */
  showEnemyIntent() {
    if (!this.combatState || !this.combatState.enemy) {
      console.warn('[CombatSystem] showEnemyIntent: 敌人不存在');
      return;
    }

    // 简单的敌人AI逻辑
    const intents = [
      { type: INTENTS.ATTACK, value: this.combatState.enemy.attack || 10 },
      { type: INTENTS.DEFEND, value: 5 },
      { type: INTENTS.SKILL, value: 8 }
    ];

    // 根据敌人状态选择意图
    const hpRatio = this.combatState.enemy.hp / this.combatState.enemy.maxHp;
    let chosenIntent;

    if (hpRatio < 0.3 && Math.random() < 0.3) {
      chosenIntent = intents[2]; // 低血量时使用技能
    } else if (hpRatio < 0.6 && Math.random() < 0.4) {
      chosenIntent = intents[1]; // 中等血量时防御
    } else {
      chosenIntent = intents[0]; // 默认攻击
    }

    this.combatState.enemy.intent = chosenIntent;
    console.log('[CombatSystem] 敌人意图:', chosenIntent);

    if (this.gameRenderer && this.gameRenderer.showIntent) {
      this.gameRenderer.showIntent(chosenIntent);
    }
    this.addCombatLog(`敌人意图: ${chosenIntent.type} (值: ${chosenIntent.value})`);
  }

  /**
   * 执行敌人行动
   */
  executeEnemyAction() {
    if (!this.combatState || !this.combatState.enemy) {
      console.warn('[CombatSystem] executeEnemyAction: 敌人不存在');
      return;
    }

    const intent = this.combatState.enemy.intent;
    if (!intent) {
      console.warn('[CombatSystem] 敌人没有意图，默认攻击');
      // 如果没有意图，默认攻击
      this.combatState.enemy.intent = {
        type: INTENTS.ATTACK,
        value: this.combatState.enemy.attack || 10
      };
      return this.executeEnemyAction();
    }

    console.log('[CombatSystem] 执行敌人行动:', intent.type, intent.value);

    switch (intent.type) {
      case INTENTS.ATTACK:
        const damage = this.calculateDamage(intent.value, this.combatState.enemy, this.combatState.player);
        this.combatState.player.hp = Math.max(0, this.combatState.player.hp - damage);
        if (this.gameRenderer && this.gameRenderer.showDamage) {
          this.gameRenderer.showDamage(damage, true);
        }
        this.addCombatLog(`敌人造成 ${damage} 点伤害`);
        break;

      case INTENTS.DEFEND:
        this.combatState.enemy.armor += intent.value;
        if (this.gameRenderer && this.gameRenderer.showArmor) {
          this.gameRenderer.showArmor(intent.value);
        }
        this.addCombatLog(`敌人获得 ${intent.value} 护甲`);
        break;

      case INTENTS.SKILL:
        const skillDamage = this.calculateDamage(intent.value, this.combatState.enemy, this.combatState.player);
        this.combatState.player.hp = Math.max(0, this.combatState.player.hp - skillDamage);
        if (this.gameRenderer && this.gameRenderer.showDamage) {
          this.gameRenderer.showDamage(skillDamage, true);
        }
        this.addCombatLog(`敌人技能造成 ${skillDamage} 点伤害`);
        break;

      default:
        console.warn('[CombatSystem] 未知的敌人意图类型:', intent.type);
        // 默认攻击
        const defaultDamage = this.calculateDamage(10, this.combatState.enemy, this.combatState.player);
        this.combatState.player.hp = Math.max(0, this.combatState.player.hp - defaultDamage);
        this.addCombatLog(`敌人造成 ${defaultDamage} 点伤害（默认）`);
    }
  }

  /**
   * 检查战斗结束
   * @returns {string} 'victory'、'defeat'、'draw' 或 'continue'
   */
  checkBattleEnd() {
    if (this.combatState.player.hp <= 0) {
      return 'defeat';
    }

    if (this.combatState.enemy.hp <= 0) {
      return 'victory';
    }

    // 防止无限循环
    if (this.turnCount++ >= this.maxTurns) {
      return 'draw';
    }

    return 'continue';
  }

  /**
   * 结束战斗
   * @param {string} result - 战斗结果
   */
  endCombat(result) {
    this.combatState.inCombat = false;

    switch (result) {
      case 'victory':
        this.addCombatLog('战斗胜利！');
        break;
      case 'defeat':
        this.addCombatLog('战斗失败！');
        break;
      case 'draw':
        this.addCombatLog('战斗平局！');
        break;
    }
  }

  /**
   * 辅助方法：获取目标对象
   * @param {string} target - 目标标识符
   * @returns {Object|null} 目标对象
   */
  getTarget(target) {
    if (target === 'player') {
      return this.combatState.player;
    } else if (target === 'enemy') {
      return this.combatState.enemy;
    }
    return null;
  }

  /**
   * 辅助方法：抽牌
   * @param {number} count - 抽牌数量
   */
  drawCards(count) {
    // 调用 CardManager 的抽牌方法
    if (this.cardManager && this.cardManager.drawCards) {
      const drawnCards = this.cardManager.drawCards(count);
      this.addCombatLog(`抽了 ${drawnCards.length} 张牌`);
      return drawnCards;
    }
    this.addCombatLog(`抽牌失败：卡牌管理器不可用`);
    return [];
  }

  /**
   * 辅助方法：弃置所有手牌
   */
  discardAllHandCards() {
    // 模拟弃牌
    if (this.cardManager && this.cardManager.discardAllHandCards) {
      this.cardManager.discardAllHandCards(this.combatState.player);
    }
    this.addCombatLog('弃置所有手牌');
  }

  /**
   * 辅助方法：判断状态效果刷新或叠加
   * @param {string} type - 状态类型
   * @returns {string} 'refresh' 或 'stack'
   */
  shouldRefreshOrStack(type) {
    // 对于 poison 和 burn，刷新持续时间
    if ([STATUS_TYPES.POISON, STATUS_TYPES.BURN].includes(type)) {
      return 'refresh';
    }
    // 对于其他状态，叠加效果值
    return 'stack';
  }

  /**
   * 辅助方法：添加战斗日志
   * @param {string} message - 日志消息
   */
  addCombatLog(message) {
    const turn = this.combatState ? this.combatState.turn : 0;
    this.combatLog.push({
      turn,
      message
    });
  }

  /**
   * 获取战斗状态
   * @returns {Object} 战斗状态
   */
  getCombatState() {
    return this.combatState;
  }

  /**
   * 获取战斗日志
   * @returns {Array} 战斗日志数组
   */
  getCombatLog() {
    return this.combatLog;
  }
}

// 导出类和常量
export {
  CombatSystem,
  STATUS_TYPES,
  INTENTS,
  CARD_TYPES,
  ERRORS
};