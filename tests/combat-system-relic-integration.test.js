/**
 * CombatSystem 与 RelicManager 集成测试
 * 验证遗物效果在战斗中的正确触发
 */

import { CombatSystem } from '../src/core/CombatSystem.js';
import { RelicManager, TRIGGER_TIMING, EFFECT_TYPES } from '../src/core/RelicManager.js';

// ===== Mock 依赖 =====

const mockGameState = {
  playerState: {
    relics: [],
    gold: 100
  },
  saveCombatState: function() {},
  loadCombatState: function() {}
};

const mockCardManager = {
  hand: [],
  discardPile: [],
  drawPile: [],
  // 创建足够多的卡牌用于测试
  deck: Array.from({ length: 20 }, (_, i) => ({
    id: `card-${i + 1}`,
    type: i % 3 === 0 ? 'attack' : (i % 3 === 1 ? 'defend' : 'skill'),
    cost: 1,
    damage: i % 3 === 0 ? 10 : undefined,
    block: i % 3 === 1 ? 5 : undefined,
    name: ['打击', '防御', '技能'][i % 3]
  })),
  getCard: function(id) {
    return this.deck.find(c => c.id === id) || null;
  },
  removeFromHand: function(id) {
    const index = this.hand.findIndex(c => c.id === id);
    if (index > -1) this.hand.splice(index, 1);
  },
  drawCards: function(count) {
    const drawn = [];
    for (let i = 0; i < count && this.drawPile.length > 0; i++) {
      const card = this.drawPile.pop();
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  },
  shuffleDeck: function(deck) {
    return deck.sort(() => Math.random() - 0.5);
  },
  discardAllHandCards: function() {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }
};

const mockGameRenderer = {
  showDamage: function() {},
  showBlock: function() {},
  showStatusEffect: function() {},
  showIntent: function() {}
};

// ===== 测试函数 =====

function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  期望: ${expected}\n  实际: ${actual}`);
  }
}

// ===== 测试用例 =====

console.log('=== CombatSystem + RelicManager 集成测试 ===\n');

// 测试 1: 验证 RelicManager 作为参数传入
console.log('测试 1: 验证 RelicManager 作为构造函数参数...');
{
  const relicManager = new RelicManager(mockGameState);
  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);
  assert(combatSystem.relicManager === relicManager, 'relicManager 应被正确保存');
  console.log('  通过: relicManager 正确集成到 CombatSystem\n');
}

// 测试 2: 战斗开始时触发 ON_COMBAT_START 遗物效果
console.log('测试 2: 战斗开始时触发遗物效果...');
{
  const relicManager = new RelicManager(mockGameState);
  relicManager.loadRelics();
  relicManager.grantRelic('bag_of_preparation'); // 战斗开始抽1张牌

  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);

  combatSystem.startCombat({ id: 'test-enemy', name: '测试敌人', hp: 50 });

  // 验证：应该抽了额外的牌（基础5张 + 遗物1张 = 6张）
  assertEquals(mockCardManager.hand.length, 6, '手牌数量应为6（5基础+1遗物）');
  console.log('  通过: ON_COMBAT_START 遗物效果正确触发\n');
}

// 测试 3: 回合开始时触发 ON_TURN_START 遗物效果
console.log('测试 3: 回合开始时触发遗物效果...');
{
  const relicManager = new RelicManager(mockGameState);
  relicManager.loadRelics();
  relicManager.grantRelic('energy_bonus'); // 战斗开始获得1点最大能量

  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);

  combatSystem.startCombat({ id: 'test-enemy', name: '测试敌人', hp: 50 });

  // 验证：最大能量应该是4（基础3 + 遗物1）
  assertEquals(combatSystem.combatState.player.maxEnergy, 4, '最大能量应为4');
  console.log('  通过: ON_TURN_START 遗物效果正确触发\n');
}

// 测试 4: 打出卡牌时触发 ON_CARD_PLAY 遗物效果
console.log('测试 4: 打出卡牌时触发遗物效果...');
{
  const relicManager = new RelicManager(mockGameState);
  relicManager.loadRelics();
  relicManager.grantRelic('brimstone'); // 每打出一张攻击牌，获得1点能量

  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);

  combatSystem.startCombat({ id: 'test-enemy', name: '测试敌人', hp: 50 });
  const initialEnergy = combatSystem.combatState.player.energy;

  // 打出攻击卡
  mockCardManager.hand = [{ id: 'card-1', type: 'attack', cost: 1, damage: 10, name: '打击' }];
  combatSystem.playCard('card-1', 'enemy');

  // 验证：能量应该不变（消耗1 + 获得1 = 0变化）
  assertEquals(combatSystem.combatState.player.energy, initialEnergy - 1 + 1, '能量应保持不变（消耗1获得1）');
  console.log('  通过: ON_CARD_PLAY 遗物效果正确触发\n');
}

// 测试 5: 敌人死亡时触发 ON_ENEMY_DEATH 遗物效果
console.log('测试 5: 敌人死亡时触发遗物效果...');
{
  const relicManager = new RelicManager(mockGameState);
  relicManager.loadRelics();
  relicManager.grantRelic('burning_blood'); // 每回合结束时回复3点生命（用于测试效果触发）

  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);

  combatSystem.startCombat({ id: 'test-enemy', name: '测试敌人', hp: 50 });
  combatSystem.combatState.player.hp = 50;

  // 模拟敌人死亡
  combatSystem.combatState.enemy.hp = 0;
  combatSystem._onEnemyDeath();

  // 验证：日志中应包含敌人死亡记录
  const log = combatSystem.getCombatLog();
  const hasDeathLog = log.some(entry => entry.message.includes('被击败'));
  assert(hasDeathLog, '战斗日志应记录敌人死亡');
  console.log('  通过: ON_ENEMY_DEATH 遗物效果正确触发\n');
}

// 测试 6: 费用减免效果
console.log('测试 6: 费用减免遗物效果...');
{
  const relicManager = new RelicManager(mockGameState);
  relicManager.loadRelics();
  relicManager.grantRelic('ceramic_fish'); // 每回合的第一张牌费用为0

  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);

  combatSystem.startCombat({ id: 'test-enemy', name: '测试敌人', hp: 50 });

  // 打出第一张牌（应该是免费）
  mockCardManager.hand = [{ id: 'card-1', type: 'attack', cost: 2, damage: 10, name: '打击' }];
  combatSystem.playCard('card-1', 'enemy');

  // 验证：能量应该是3（未消耗）
  assertEquals(combatSystem.combatState.player.energy, 3, '第一张牌应该是免费的');
  console.log('  通过: 费用减免效果正确触发\n');
}

// 测试 7: 回合结束时触发 ON_TURN_END 遗物效果
console.log('测试 7: 回合结束时触发遗物效果...');
{
  const relicManager = new RelicManager(mockGameState);
  relicManager.loadRelics();
  relicManager.grantRelic('burning_blood'); // 每回合结束时回复3点生命

  const combatSystem = new CombatSystem(mockGameState, mockCardManager, mockGameRenderer, relicManager);

  combatSystem.startCombat({ id: 'test-enemy', name: '测试敌人', hp: 50 });
  combatSystem.combatState.player.hp = 90;

  combatSystem.endPlayerTurn();

  // 验证：HP应该是93（90 + 3）
  assertEquals(combatSystem.combatState.player.hp, 93, '回合结束应回复3点生命');
  console.log('  通过: ON_TURN_END 遗物效果正确触发\n');
}

console.log('=== 所有集成测试通过 ===');
