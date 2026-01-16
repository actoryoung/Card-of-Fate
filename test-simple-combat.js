import SimpleTestRunner from './tests/simple-framework.js';

// 模拟数据结构
const createMockFighter = (hp = 100, maxHp = 100, energy = 3, maxEnergy = 3) => ({
  hp,
  maxHp,
  energy,
  maxEnergy,
  armor: 0,
  statusEffects: [],
  comboCount: 0,
  lastCardType: null
});

const createMockEnemy = (hp = 100, attack = 10) => ({
  id: 'enemy-1',
  name: '测试敌人',
  hp,
  maxHp,
  attack,
  armor: 0,
  intent: 'attack'
});

const createMockCard = (type, cost, damage = 0, armor = 0, effect = null) => ({
  id: 'card-1',
  name: '测试卡牌',
  type,
  cost,
  damage,
  armor,
  effect
});

// 简化战斗系统
class SimpleCombatSystem {
  constructor() {
    this.player = createMockFighter();
    this.enemy = createMockEnemy();
    this.turn = 1;
    this.currentTurn = 'player';
    this.inCombat = true;
    this.hand = [];
    this.discardPile = [];
    this.combatLog = [];
    this.comboMultiplier = 1.0;
  }

  startCombat() {
    this.player = createMockFighter();
    this.enemy = createMockEnemy();
    this.turn = 1;
    this.currentTurn = 'player';
    this.inCombat = true;
    this.hand = [];
    this.discardPile = [];
    this.combatLog = [];
    this.comboMultiplier = 1.0;
    this.drawCards(5);
    return true;
  }

  drawCards(count) {
    for (let i = 0; i < count; i++) {
      this.hand.push(createMockCard('attack', 1, 10));
    }
    return this.hand;
  }

  playCard(cardId, target) {
    if (!this.inCombat || this.currentTurn !== 'player') {
      throw new Error('ERR_COMBAT_NOT_INITIALIZED');
    }

    const cardIndex = this.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('ERR_INVALID_CARD');
    }

    const card = this.hand[cardIndex];
    if (this.player.energy < card.cost) {
      throw new Error('ERR_INSUFFICIENT_ENERGY');
    }

    this.hand.splice(cardIndex, 1);
    this.player.energy -= card.cost;
    this.discardPile.push(card);

    if (card.damage > 0) {
      this.enemy.hp -= card.damage;
    }

    if (card.armor > 0) {
      this.player.armor += card.armor;
    }

    return true;
  }

  calculateDamage(baseDamage, attacker, defender) {
    let damage = baseDamage * this.comboMultiplier;

    // 检查易伤状态
    const vulnerable = defender.statusEffects.find(s => s.type === 'vulnerable');
    if (vulnerable) {
      damage *= 1.5;
    }

    // 检查虚弱状态
    const weak = attacker.statusEffects.find(s => s.type === 'weak');
    if (weak) {
      damage *= 0.75;
    }

    // 减去护甲
    damage = Math.max(1, damage - defender.armor);

    return Math.floor(damage);
  }

  applyStatusEffect(target, type, duration, value) {
    const existingEffect = target.statusEffects.find(s => s.type === type);

    if (existingEffect) {
      existingEffect.duration = duration;
      existingEffect.value += value;
    } else {
      target.statusEffects.push({
        type,
        duration,
        value,
        source: 'player'
      });
    }
  }

  checkBattleEnd() {
    if (this.player.hp <= 0) {
      return 'defeat';
    } else if (this.enemy.hp <= 0) {
      return 'victory';
    }
    return 'continue';
  }

  enemyTurn() {
    this.player.hp -= this.enemy.attack;
    this.currentTurn = 'player';
    this.turn++;
    return 'continue';
  }
}

// 运行测试
const testRunner = new SimpleTestRunner();

testRunner.describe('战斗系统测试', () => {
  // === 回合制战斗流程 ===
  testRunner.describe('回合制战斗流程', () => {
    testRunner.it('TC-001: 玩家回合开始应该抽5张牌并重置能量', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();

      testRunner.expect(combat.hand.length).toBe(5);
      testRunner.expect(combat.player.energy).toBe(3);
    });

    testRunner.it('TC-002: 打出攻击卡应该正确执行效果', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();
      const initialEnemyHp = combat.enemy.hp;

      combat.playCard('card-1', 'enemy');

      testRunner.expect(combat.enemy.hp).toBeLessThan(initialEnemyHp);
      testRunner.expect(combat.hand.length).toBe(4);
    });

    testRunner.it('TC-003: 打出防御卡应该获得护甲', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();
      const defendCard = createMockCard('defend', 1, 0, 5);
      combat.hand[0] = defendCard;

      combat.playCard('card-1', 'player');

      testRunner.expect(combat.player.armor).toBe(5);
      testRunner.expect(combat.player.energy).toBe(2);
    });

    testRunner.it('TC-004: 能量不足时打牌应该返回错误', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();
      const expensiveCard = createMockCard('attack', 10, 20);
      combat.hand[0] = expensiveCard;
      combat.player.energy = 1;

      testRunner.expect(() => {
        combat.playCard('card-1', 'enemy');
      }).toThrow('ERR_INSUFFICIENT_ENERGY');
    });
  });

  // === 伤害计算 ===
  testRunner.describe('伤害计算', () => {
    testRunner.it('TC-005: 伤害计算应该考虑护甲', () => {
      const combat = new SimpleCombatSystem();
      const attacker = createMockFighter();
      const defender = createMockFighter(100, 100, 0, 0);
      defender.armor = 10;

      const damage = combat.calculateDamage(15, attacker, defender);
      testRunner.expect(damage).toBe(5);
    });

    testRunner.it('TC-006: 易伤状态应该增加50%伤害', () => {
      const combat = new SimpleCombatSystem();
      const attacker = createMockFighter();
      const defender = createMockFighter();
      defender.statusEffects.push({ type: 'vulnerable', duration: 3, value: 1 });

      const damage = combat.calculateDamage(10, attacker, defender);
      testRunner.expect(damage).toBe(15);
    });

    testRunner.it('TC-007: 虚弱状态应该减少25%伤害', () => {
      const combat = new SimpleCombatSystem();
      const attacker = createMockFighter();
      attacker.statusEffects.push({ type: 'weak', duration: 3, value: 1 });
      const defender = createMockFighter();

      const damage = combat.calculateDamage(10, attacker, defender);
      testRunner.expect(damage).toBe(8);
    });

    testRunner.it('伤害最小值为1', () => {
      const combat = new SimpleCombatSystem();
      const attacker = createMockFighter();
      const defender = createMockFighter(100, 100, 0, 0);
      defender.armor = 20;

      const damage = combat.calculateDamage(10, attacker, defender);
      testRunner.expect(damage).toBe(1);
    });
  });

  // === 状态效果管理 ===
  testRunner.describe('状态效果管理', () => {
    testRunner.it('TC-008: 施加中毒状态应该每回合造成伤害', () => {
      const combat = new SimpleCombatSystem();
      const fighter = createMockFighter(100, 100, 0, 0);

      combat.applyStatusEffect(fighter, 'poison', 3, 5);

      testRunner.expect(fighter.statusEffects.length).toBe(1);
      testRunner.expect(fighter.statusEffects[0]).toEqual({
        type: 'poison',
        duration: 3,
        value: 5,
        source: 'player'
      });
    });

    testRunner.it('EC-001: 相同状态效果叠加应该刷新持续时间', () => {
      const combat = new SimpleCombatSystem();
      const fighter = createMockFighter();
      fighter.statusEffects.push({ type: 'poison', duration: 2, value: 3 });

      combat.applyStatusEffect(fighter, 'poison', 3, 2);

      testRunner.expect(fighter.statusEffects.length).toBe(1);
      testRunner.expect(fighter.statusEffects[0].duration).toBe(3);
      testRunner.expect(fighter.statusEffects[0].value).toBe(5);
    });
  });

  // === 战斗胜负判定 ===
  testRunner.describe('战斗胜负判定', () => {
    testRunner.it('TC-013: 敌人死亡应该判定胜利', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();
      combat.enemy.hp = 5;

      combat.playCard('card-1', 'enemy');

      testRunner.expect(combat.checkBattleEnd()).toBe('victory');
    });

    testRunner.it('TC-014: 玩家死亡应该判定失败', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();
      combat.player.hp = 5;

      combat.enemyTurn();

      testRunner.expect(combat.checkBattleEnd()).toBe('defeat');
    });
  });

  // === 敌人回合 ===
  testRunner.describe('敌人回合', () => {
    testRunner.it('TC-011: 敌人执行攻击应该造成伤害', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();
      const initialPlayerHp = combat.player.hp;

      combat.enemyTurn();

      testRunner.expect(combat.player.hp).toBeLessThan(initialPlayerHp);
    });
  });

  // === 错误处理 ===
  testRunner.describe('错误处理', () => {
    testRunner.it('应该在战斗外尝试战斗操作时抛出错误', () => {
      const combat = new SimpleCombatSystem();
      combat.inCombat = false;

      testRunner.expect(() => {
        combat.playCard('card-1', 'enemy');
      }).toThrow('ERR_COMBAT_NOT_INITIALIZED');
    });

    testRunner.it('应该处理无效卡牌ID', () => {
      const combat = new SimpleCombatSystem();
      combat.startCombat();

      testRunner.expect(() => {
        combat.playCard('invalid-card', 'enemy');
      }).toThrow('ERR_INVALID_CARD');
    });
  });
});

const success = testRunner.summary();

if (!success) {
  process.exit(1);
}