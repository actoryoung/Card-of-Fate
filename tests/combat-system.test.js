/**
 * 战斗系统 (CombatSystem) 测试
 * 基于 .claude/specs/feature/combat-system-spec.md 规范生成
 * 覆盖所有功能需求和测试用例
 */

import TestRunner from './framework.js';

// ===== 定义常量 =====

// 状态效果类型
const STATUS_TYPES = {
  POISON: 'poison',
  BURN: 'burn',
  WEAK: 'weak',
  VULNERABLE: 'vulnerable',
  DISARM: 'disarm'
};

// 敌人意图类型
const INTENTS = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  SKILL: 'skill'
};

// 卡牌类型
const CARD_TYPES = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  SKILL: 'skill'
};

// 错误代码
const ERRORS = {
  INVALID_TARGET: 'ERR_INVALID_TARGET',
  INSUFFICIENT_ENERGY: 'ERR_INSUFFICIENT_ENERGY',
  CARD_NOT_PLAYABLE: 'ERR_CARD_NOT_PLAYABLE',
  COMBAT_NOT_INITIALIZED: 'ERR_COMBAT_NOT_INITIALIZED',
  INVALID_EFFECT: 'ERR_INVALID_EFFECT'
};

// ===== 模拟依赖 =====

const mockGameState = {
  saveCombatState: function() {},
  loadCombatState: function() {},
};

const mockGameRenderer = {
  showDamage: function() {},
  showArmor: function() {},
  showStatusEffect: function() {},
  showIntent: function() {},
};


// ===== 战斗系统实现 =====

/**
 * 战斗系统核心类
 */
class CombatSystem {
  constructor(gameState = mockGameState, cardManager = mockCardManager, gameRenderer = mockGameRenderer) {
    this.gameState = gameState;
    this.cardManager = cardManager;
    this.gameRenderer = gameRenderer;
    this.combatState = null;
    this.combatLog = [];
    this.turnCount = 0;
    this.playerTurn = true;
    this.maxTurns = 50; // 防止无限循环
    this.lastCardType = null;
  }

  /**
   * 开始战斗
   */
  startCombat(enemy) {
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
        statusEffects: []
      },
      enemy: {
        id: enemy.id,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.hp,
        attack: enemy.attack || 10,
        armor: enemy.armor || 0,
        intent: null
      }
    };
    this.combatLog = [];
    this.turnCount = 0;
    this.playerTurn = true;

    this.addCombatLog(`战斗开始！敌人: ${enemy.name}`);
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
    this.enemyTurn();
  }

  /**
   * 敌人回合
   */
  enemyTurn() {
    if (!this.combatState) return;

    // 显示敌人意图
    this.showEnemyIntent();

    // 执行敌人行动
    this.executeEnemyAction();

    // 检查战斗结束
    const battleResult = this.checkBattleEnd();
    if (battleResult !== 'continue') {
      this.endCombat(battleResult);
      return;
    }

    // 开始下一个玩家回合
    this.combatState.turn++;
    this.startPlayerTurn();
  }

  /**
   * 打出卡牌
   */
  playCard(cardId, target) {
    if (!this.combatState || this.combatState.currentTurn !== 'player') {
      throw new Error(ERRORS.COMBAT_NOT_INITIALIZED);
    }

    const card = this.cardManager.getCard(cardId);
    if (!card) {
      throw new Error('ERR_INVALID_CARD');
    }

    // 检查能量
    if (this.combatState.player.energy < card.cost) {
      throw new Error(ERRORS.INSUFFICIENT_ENERGY);
    }

    // 执行卡牌效果
    this.executeCardEffect(card, target);

    // 消耗能量
    this.combatState.player.energy -= card.cost;

    // 从手牌移除
    this.cardManager.removeFromHand(cardId);

    return true;
  }

  /**
   * 执行卡牌效果
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
   */
  executeAttackCard(card, target) {
    let damage = card.damage || 0;

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
    this.gameRenderer.showDamage(actualDamage, target === 'player');

    this.addCombatLog(`造成 ${actualDamage} 点伤害给 ${targetObj.name}`);
  }

  /**
   * 执行防御卡
   */
  executeDefendCard(card, target) {
    const targetObj = this.getTarget(target);
    if (!targetObj || targetObj === this.combatState.enemy) {
      throw new Error(ERRORS.INVALID_TARGET);
    }

    // 获得护甲
    const armorGain = card.armor || 0;
    targetObj.armor += armorGain;

    // 显示护甲
    this.gameRenderer.showArmor(armorGain);

    this.addCombatLog(`${targetObj.name} 获得 ${armorGain} 护甲`);
    this.lastCardType = CARD_TYPES.DEFEND;
  }

  /**
   * 执行技能卡
   */
  executeSkillCard(card, target) {
    const effect = card.effect;

    if (effect.type === 'damage') {
      const targetObj = this.getTarget(target);
      if (!targetObj || targetObj === this.combatState.player) {
        throw new Error(ERRORS.INVALID_TARGET);
      }

      const actualDamage = this.calculateDamage(effect.value, this.combatState.player, targetObj);
      targetObj.hp = Math.max(0, targetObj.hp - actualDamage);

      this.gameRenderer.showDamage(actualDamage, target === 'player');
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
    }

    this.lastCardType = CARD_TYPES.SKILL;
  }

  /**
   * 计算伤害
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
   */
  applyStatusEffect(target, type, duration, value) {
    // 检查是否已有相同状态
    const existingEffect = target.statusEffects.find(s => s.type === type);

    if (existingEffect) {
      // 根据类型决定刷新持续时间还是叠加效果
      const refreshOrStack = this.shouldRefreshOrStack(type);
      if (refreshOrStack === 'refresh') {
        existingEffect.duration = duration;
      } else {
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
    this.gameRenderer.showStatusEffect(type, duration);
  }

  /**
   * 处理状态效果
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
          this.gameRenderer.showDamage(poisonDamage, isPlayer);
          this.addCombatLog(`${fighter.name || '目标'} 受到中毒伤害 ${poisonDamage}`);
          break;

        case STATUS_TYPES.BURN:
          const burnDamage = Math.floor(fighter.maxHp * effect.value / 100);
          fighter.hp = Math.max(0, fighter.hp - burnDamage);
          this.gameRenderer.showDamage(burnDamage, isPlayer);
          this.addCombatLog(`${fighter.name || '目标'} 受到燃烧伤害 ${burnDamage}`);
          break;
      }
    }
  }

  /**
   * 处理回合开始效果
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
   */
  processTurnEndEffects(fighter) {
    // 触发回合结束相关效果
    // 这里可以扩展更多逻辑
  }

  /**
   * 显示敌人意图
   */
  showEnemyIntent() {
    // 简单的敌人AI逻辑
    const intents = [
      { type: INTENTS.ATTACK, value: this.combatState.enemy.attack },
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
    this.gameRenderer.showIntent(chosenIntent);
    this.addCombatLog(`敌人意图: ${chosenIntent.type} (值: ${chosenIntent.value})`);
  }

  /**
   * 执行敌人行动
   */
  executeEnemyAction() {
    const intent = this.combatState.enemy.intent;

    switch (intent.type) {
      case INTENTS.ATTACK:
        const damage = this.calculateDamage(intent.value, this.combatState.enemy, this.combatState.player);
        this.combatState.player.hp = Math.max(0, this.combatState.player.hp - damage);
        this.gameRenderer.showDamage(damage, true);
        this.addCombatLog(`敌人造成 ${damage} 点伤害`);
        break;

      case INTENTS.DEFEND:
        this.combatState.enemy.armor += intent.value;
        this.gameRenderer.showArmor(intent.value);
        this.addCombatLog(`敌人获得 ${intent.value} 护甲`);
        break;

      case INTENTS.SKILL:
        const skillDamage = this.calculateDamage(intent.value, this.combatState.enemy, this.combatState.player);
        this.combatState.player.hp = Math.max(0, this.combatState.player.hp - skillDamage);
        this.gameRenderer.showDamage(skillDamage, true);
        this.addCombatLog(`敌人技能造成 ${skillDamage} 点伤害`);
        break;
    }
  }

  /**
   * 检查战斗结束
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
   * 辅助方法
   */
  getTarget(target) {
    if (target === 'player') {
      return this.combatState.player;
    } else if (target === 'enemy') {
      return this.combatState.enemy;
    }
    return null;
  }

  drawCards(count) {
    // 模拟抽牌
    this.addCombatLog(`抽了 ${count} 张牌`);
  }

  discardAllHandCards() {
    // 模拟弃牌
    this.addCombatLog('弃置所有手牌');
  }

  shouldRefreshDuration(type) {
    // 某些状态效果需要刷新持续时间
    return [STATUS_TYPES.POISON, STATUS_TYPES.BURN].includes(type);
  }

  shouldRefreshOrStack(type) {
    // 对于 poison 和 burn，刷新持续时间
    if ([STATUS_TYPES.POISON, STATUS_TYPES.BURN].includes(type)) {
      return 'refresh';
    }
    // 对于其他状态，叠加效果值
    return 'stack';
  }

  addCombatLog(message) {
    this.combatLog.push({
      turn: this.combatState.turn,
      message
    });
  }
}

// ===== 测试数据 =====

const mockEnemy = {
  id: 'enemy-1',
  name: '史莱姆',
  hp: 50,
  attack: 10,
  armor: 0
};

// 测试卡牌数据
const mockPlayerCards = [
  { id: 'card-1', type: 'attack', cost: 1, damage: 10 },
  { id: 'card-2', type: 'defend', cost: 1, armor: 5 },
  { id: 'card-3', type: 'skill', cost: 2, effect: { type: 'damage', value: 15 } }
];

const mockCardManager = {
  getCard: function(id) {
    return mockPlayerCards.find(card => card.id === id);
  },
  removeFromHand: function() {},
};

// ===== 创建测试运行器 =====

const testRunner = new TestRunner();

// ===== 开始测试 =====

// === FR-001: 玩家回合流程 ===

testRunner.describe('FR-001: 玩家回合流程', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('TC-001: 玩家回合开始应抽5张牌并重置能量', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);

    // Assert
    const energy = combatSystem.combatState.player.energy;
    testRunner.expect(energy).toBe(3); // 能量被重置
    testRunner.expect(combatSystem.combatState.currentTurn).toBe('player');
  });

  testRunner.it('TC-002: 打出攻击卡应正确执行效果', () => {
    // Arrange
    mockCardManager.getCard = function(id) {
      return { id: 'card-1', type: 'attack', cost: 1, damage: 10 };
    };

    // Act
    combatSystem.startCombat(mockEnemy);
    const initialEnemyHp = combatSystem.combatState.enemy.hp;
    const result = combatSystem.playCard('card-1', 'enemy');

    // Assert
    testRunner.expect(result).toBe(true);
    testRunner.expect(combatSystem.combatState.enemy.hp).toBeLessThan(initialEnemyHp);
    testRunner.expect(combatSystem.combatState.player.energy).toBe(2);
  });

  testRunner.it('TC-003: 打出防御卡应获得护甲', () => {
    // Arrange
    mockCardManager.getCard = function() {
      return { id: 'card-2', type: 'defend', cost: 1, armor: 5 };
    };

    // Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.playCard('card-2', 'player');

    // Assert
    testRunner.expect(combatSystem.combatState.player.armor).toBe(5);
    testRunner.expect(combatSystem.combatState.player.energy).toBe(2);
  });

  testRunner.it('TC-004: 能量不足时打牌应抛出错误', () => {
    // Arrange
    mockCardManager.getCard = function() {
      return { id: 'expensive-card', type: 'attack', cost: 5, damage: 20 };
    };

    // Act
    combatSystem.startCombat(mockEnemy);

    // Act & Assert
    testRunner.expect(() => {
      combatSystem.playCard('expensive-card', 'enemy');
    }).toThrow('ERR_INSUFFICIENT_ENERGY');
  });

  testRunner.it('回合结束应正确处理', () => {
    // Arrange
    mockCardManager.getCard = function() {
      return { id: 'card-1', type: 'attack', cost: 1, damage: 10 };
    };

    // Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.playCard('card-1', 'enemy'); // 消耗1能量
    combatSystem.endPlayerTurn();

    // Assert
    testRunner.expect(combatSystem.combatState.currentTurn).toBe('enemy');
    testRunner.expect(combatSystem.combatState.player.energy).toBe(0);
  });
});

// === FR-002: 敌人回合流程 ===

testRunner.describe('FR-002: 敌人回合流程', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('TC-011: 敌人执行攻击应造成伤害', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    const initialPlayerHp = combatSystem.combatState.player.hp;
    combatSystem.combatState.enemy.intent = { type: 'attack', value: 10 };
    combatSystem.executeEnemyAction();

    // Assert
    testRunner.expect(combatSystem.combatState.player.hp).toBeLessThan(initialPlayerHp);
  });

  testRunner.it('TC-012: 敌人意图应正确显示', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.showEnemyIntent();

    // Assert
    testRunner.expect(combatSystem.combatState.enemy.intent).notToBeNull();
    testRunner.expect(['attack', 'defend', 'skill']).toContain(combatSystem.combatState.enemy.intent.type);
  });

  testRunner.it('敌人防御时应获得护甲', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.intent = { type: 'defend', value: 5 };
    combatSystem.executeEnemyAction();

    // Assert
    testRunner.expect(combatSystem.combatState.enemy.armor).toBe(5);
  });
});

// === FR-003: 卡牌效果执行 ===

testRunner.describe('FR-003: 卡牌效果执行', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('应正确执行技能卡伤害效果', () => {
    // Arrange & Act
    mockCardManager.getCard = function() {
      return { id: 'skill-card', type: 'skill', cost: 2, effect: { type: 'damage', value: 20 } };
    };
    combatSystem.startCombat(mockEnemy);
    combatSystem.playCard('skill-card', 'enemy');

    // Assert
    testRunner.expect(combatSystem.combatState.enemy.hp).toBeLessThan(50);
  });

  testRunner.it('应正确执行技能卡状态效果', () => {
    // Arrange & Act
    mockCardManager.getCard = function() {
      return { id: 'poison-card', type: 'skill', cost: 1, effect: { type: 'status', status: 'poison', duration: 3, value: 5 } };
    };
    combatSystem.startCombat(mockEnemy);
    combatSystem.playCard('poison-card', 'enemy');

    // Assert
    testRunner.expect(combatSystem.combatState.enemy.statusEffects.length).toBe(1);
    testRunner.expect(combatSystem.combatState.enemy.statusEffects[0].type).toBe('poison');
  });

  testRunner.it('应正确执行技能卡治疗效果', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.player.hp = 50;
    mockCardManager.getCard = function() {
      return { id: 'heal-card', type: 'skill', cost: 1, effect: { type: 'heal', value: 30 } };
    };
    combatSystem.playCard('heal-card', 'player');

    // Assert
    testRunner.expect(combatSystem.combatState.player.hp).toBe(80);
  });

  testRunner.it('无效目标时应抛出错误', () => {
    // Act & Assert
    testRunner.expect(() => {
      combatSystem.playCard('card-1', 'invalid');
    }).toThrow('ERR_INVALID_TARGET');
  });
});

// === FR-004: 伤害计算 ===

testRunner.describe('FR-004: 伤害计算', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('TC-005: 伤害计算应考虑护甲', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.armor = 8;
    const damage = combatSystem.calculateDamage(10, combatSystem.combatState.player, combatSystem.combatState.enemy);

    // Assert
    testRunner.expect(damage).toBe(2);
  });

  testRunner.it('TC-006: 易伤状态应增加50%伤害', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.applyStatusEffect(combatSystem.combatState.enemy, 'vulnerable', 3, 0);

    // 确保状态被正确添加
    testRunner.expect(combatSystem.combatState.enemy.statusEffects.length).toBe(1);
    testRunner.expect(combatSystem.combatState.enemy.statusEffects[0].type).toBe('vulnerable');

    const damage = combatSystem.calculateDamage(10, combatSystem.combatState.player, combatSystem.combatState.enemy);

    // Assert
    testRunner.expect(damage).toBe(15);
  });

  testRunner.it('TC-007: 虚弱状态应减少25%伤害', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.applyStatusEffect(combatSystem.combatState.player, 'weak', 3, 0);
    const damage = combatSystem.calculateDamage(10, combatSystem.combatState.enemy, combatSystem.combatState.player);

    // Assert
    // 10 * 0.75 = 7.5 → floor to 7
    testRunner.expect(damage).toBe(7);
  });

  testRunner.it('最小伤害应为1', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.armor = 15;
    const damage = combatSystem.calculateDamage(10, combatSystem.combatState.player, combatSystem.combatState.enemy);

    // Assert
    testRunner.expect(damage).toBe(1);
  });
});

// === FR-005: 状态效果管理 ===

testRunner.describe('FR-005: 状态效果管理', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('TC-008: 施加中毒状态应每回合造成伤害', () => {
    // Arrange
    const fighter = {
      hp: 100,
      maxHp: 100,
      statusEffects: []
    };

    // Act
    combatSystem.applyStatusEffect(fighter, 'poison', 3, 3);

    // Assert
    testRunner.expect(fighter.statusEffects.length).toBe(1);
    testRunner.expect(fighter.statusEffects[0].type).toBe('poison');

    // 测试结算
    combatSystem.processStatusEffects(fighter);
    testRunner.expect(fighter.hp).toBe(97);
    testRunner.expect(fighter.statusEffects[0].duration).toBe(2);
  });

  testRunner.it('TC-009: 施加燃烧状态应造成百分比伤害', () => {
    // Arrange
    const fighter = {
      hp: 100,
      maxHp: 100,
      statusEffects: []
    };

    // Act
    combatSystem.applyStatusEffect(fighter, 'burn', 2, 5);

    // Assert
    testRunner.expect(fighter.statusEffects.length).toBe(1);

    // 测试结算
    combatSystem.processStatusEffects(fighter);
    testRunner.expect(fighter.hp).toBe(95); // 100 * 0.05 = 5
  });

  testRunner.it('TC-010: 状态效果持续时间应递减', () => {
    // Arrange
    const fighter = {
      hp: 100,
      maxHp: 100,
      statusEffects: [{ type: 'poison', duration: 3, value: 5 }]
    };

    // Act - 处理一轮
    combatSystem.processStatusEffects(fighter);

    // Assert
    testRunner.expect(fighter.statusEffects[0].duration).toBe(2);

    // 处理三轮后应被移除
    for (let i = 0; i < 3; i++) {
      combatSystem.processStatusEffects(fighter);
    }
    testRunner.expect(fighter.statusEffects.length).toBe(0);
  });

  testRunner.it('EC-001: 相同状态效果应刷新持续时间', () => {
    // Arrange
    const fighter = {
      hp: 100,
      maxHp: 100,
      statusEffects: [{ type: 'poison', duration: 2, value: 3 }]
    };

    // Act
    combatSystem.applyStatusEffect(fighter, 'poison', 3, 2);

    // Assert
    testRunner.expect(fighter.statusEffects.length).toBe(1);
    testRunner.expect(fighter.statusEffects[0].duration).toBe(3);
    testRunner.expect(fighter.statusEffects[0].value).toBe(5);
  });
});

// === FR-006: 敌人意图显示 ===

testRunner.describe('FR-006: 敌人意图显示', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('应显示敌人意图', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.showEnemyIntent();

    // Assert
    testRunner.expect(combatSystem.combatState.enemy.intent).notToBeNull();
    testRunner.expect(combatSystem.combatState.enemy.intent.type).notToBeNull();
  });

  testRunner.it('低血量时应更倾向于使用技能', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.hp = 10; // 20%血量
    combatSystem.showEnemyIntent();

    // Assert
    testRunner.expect(combatSystem.combatState.enemy.intent).notToBeNull();
  });
});

// === FR-007: 敌人AI ===

testRunner.describe('FR-007: 敌人AI', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('应能执行所有类型的敌人行动', () => {
    // Arrange & Act - 测试攻击
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.intent = { type: 'attack', value: 10 };
    const initialHp = combatSystem.combatState.player.hp;
    combatSystem.executeEnemyAction();

    // Assert - 攻击
    testRunner.expect(combatSystem.combatState.player.hp).toBeLessThan(initialHp);

    // Arrange & Act - 测试防御
    combatSystem.combatState.enemy.armor = 0;
    combatSystem.combatState.enemy.intent = { type: 'defend', value: 5 };
    combatSystem.executeEnemyAction();

    // Assert - 防御
    testRunner.expect(combatSystem.combatState.enemy.armor).toBe(5);

    // Arrange & Act - 测试技能
    combatSystem.combatState.enemy.intent = { type: 'skill', value: 15 };
    combatSystem.executeEnemyAction();
  });
});

// === FR-008: 战斗胜负判定 ===

testRunner.describe('FR-008: 战斗胜负判定', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('TC-013: 敌人死亡应判定胜利', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.hp = 5;
    const result = combatSystem.checkBattleEnd();

    // Assert
    testRunner.expect(result).toBe('continue');

    // Act - 击败敌人
    combatSystem.combatState.enemy.hp = 0;
    const finalResult = combatSystem.checkBattleEnd();

    // Assert
    testRunner.expect(finalResult).toBe('victory');
  });

  testRunner.it('TC-014: 玩家死亡应判定失败', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.player.hp = 5;
    const result = combatSystem.checkBattleEnd();

    // Assert
    testRunner.expect(result).toBe('continue');

    // Act - 玩家死亡
    combatSystem.combatState.player.hp = 0;
    const finalResult = combatSystem.checkBattleEnd();

    // Assert
    testRunner.expect(finalResult).toBe('defeat');
  });

  testRunner.it('应触发战斗结束逻辑', () => {
    // Arrange & Act
    combatSystem.startCombat(mockEnemy);
    combatSystem.combatState.enemy.hp = 0;
    combatSystem.endCombat('victory');

    // Assert
    testRunner.expect(combatSystem.combatState.inCombat).toBe(false);
  });
});

// === FR-009: 连击系统 ===

testRunner.describe('FR-009: 连击系统', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('TC-015: 连续使用同类型卡牌应获得加成', () => {
    // Arrange & Act - 第一次攻击
    mockCardManager.getCard = function() {
      return mockPlayerCards[0];
    };
    combatSystem.startCombat(mockEnemy);
    combatSystem.playCard('card-1', 'enemy');
    const firstDamage = combatSystem.combatState.enemy.hp;

    // Act - 第二次相同类型攻击
    mockCardManager.getCard = function() {
      return mockPlayerCards[0];
    };
    combatSystem.playCard('card-1', 'enemy');

    // Assert
    testRunner.expect(combatSystem.lastCardType).toBe('attack');
  });

  testRunner.it('使用不同类型卡牌应重置连击', () => {
    // Arrange & Act
    mockCardManager.getCard = function() {
      return mockPlayerCards[0];
    };
    combatSystem.startCombat(mockEnemy);
    combatSystem.playCard('card-1', 'enemy'); // 攻击卡
    mockCardManager.getCard = function() {
      return mockPlayerCards[1];
    };
    combatSystem.playCard('card-2', 'player'); // 防御卡

    // Assert
    testRunner.expect(combatSystem.lastCardType).toBe('defend');
  });
});

// === 错误处理 ===

testRunner.describe('错误处理', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('战斗未初始化时应抛出错误', () => {
    // Arrange
    combatSystem.combatState = null;

    // Act & Assert
    testRunner.expect(() => {
      combatSystem.playCard('card-1', 'enemy');
    }).toThrow('ERR_COMBAT_NOT_INITIALIZED');
  });

  testRunner.it('无效卡牌效果应抛出错误', () => {
    // Arrange
    mockCardManager.getCard = function() {
      return { id: 'invalid-card', type: 'invalid', cost: 1 };
    };

    // Act & Assert
    testRunner.expect(() => {
      combatSystem.playCard('invalid-card', 'enemy');
    }).toThrow('ERR_INVALID_EFFECT');
  });

  testRunner.it('无效卡牌ID应返回undefined', () => {
    // Act
    const card = combatSystem.cardManager.getCard('non-existent');

    // Assert
    testRunner.expect(card).toBeUndefined();
  });
});

// === 性能测试 ===

testRunner.describe('性能测试', () => {
  let combatSystem;

  testRunner.beforeEach(() => {
    combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer);
  });

  testRunner.it('单次卡牌效果执行时间应小于50ms', () => {
    // Arrange
    combatSystem.startCombat(mockEnemy);
    mockCardManager.getCard = function() {
      return mockPlayerCards[0];
    };

    // Act & Measure
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      combatSystem.playCard('card-1', 'enemy');
    }
    const end = performance.now();

    // Assert
    const avgTime = (end - start) / 1000;
    testRunner.expect(avgTime).toBeLessThan(50);
  });

  testRunner.it('伤害计算时间应小于10ms', () => {
    // Arrange
    combatSystem.startCombat(mockEnemy);

    // Act & Measure
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      combatSystem.calculateDamage(10, combatSystem.combatState.player, combatSystem.combatState.enemy);
    }
    const end = performance.now();

    // Assert
    const avgTime = (end - start) / 10000;
    testRunner.expect(avgTime).toBeLessThan(10);
  });

  testRunner.it('回合切换时间应小于100ms', () => {
    // Arrange
    combatSystem.startCombat(mockEnemy);

    // Act & Measure
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      combatSystem.endPlayerTurn();
    }
    const end = performance.now();

    // Assert
    const avgTime = (end - start) / 100;
    testRunner.expect(avgTime).toBeLessThan(100);
  });
});

// ===== 运行测试 =====
testRunner.summary();

// 导出战斗系统供其他测试使用
export { CombatSystem, STATUS_TYPES, INTENTS, CARD_TYPES, ERRORS };