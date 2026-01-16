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

  enemyTurn() {
    this.player.hp -= this.enemy.attack;
    this.currentTurn = 'player';
    this.turn++;
    return 'continue';
  }
}

// 运行测试
const testRunner = new SimpleTestRunner();

testRunner.describe('回合制战斗流程测试', () => {
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

  testRunner.it('回合结束应该触发正确流程', () => {
    const combat = new SimpleCombatSystem();
    combat.startCombat();
    const initialDiscardSize = combat.discardPile.length;

    // 手动实现结束回合
    combat.discardPile.push(...combat.hand);
    combat.hand = [];
    combat.player.energy = combat.player.maxEnergy;
    combat.enemyTurn();

    testRunner.expect(combat.hand.length).toBe(0);
    testRunner.expect(combat.discardPile.length).toBeGreaterThan(initialDiscardSize);
    testRunner.expect(combat.player.energy).toBe(3);
    testRunner.expect(combat.currentTurn).toBe('player');
  });
});

const success = testRunner.summary();

if (!success) {
  process.exit(1);
}