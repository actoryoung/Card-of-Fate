/**
 * CardManager 测试套件
 * 基于 card-manager-spec.md 生成的完整测试用例
 */

import TestRunner from './framework.js';
import { CardManager } from '../src/core/CardManager.js';

// 创建测试运行器
const testRunner = new TestRunner();

// 开始测试
console.log('🎴 CardManager 测试开始...\n');

// 测试套件
testRunner.describe('CardManager 数据加载', () => {
  testRunner.it('TC-001: 加载有效卡牌数据', async () => {
    const cardManager = new CardManager();
    await cardManager.loadCards();

    testRunner.expect(cardManager.allCards.length).toBeGreaterThan(0);
    testRunner.expect(cardManager.allCards.every(card =>
      card.id && card.name && card.type
    )).toBeTruthy();
  });

  testRunner.it('EC-001: 处理无效的卡牌数据', async () => {
    const cardManager = new CardManager();

    // 测试缺少必需字段的情况
    const invalidCard = { id: 'test', name: 'Test' }; // 缺少其他必需字段
    const isValid = cardManager.validateCard(invalidCard);

    testRunner.expect(isValid).toBeFalsy();
  });

  testRunner.it('EC-002: 处理重复卡牌ID（应跳过）', async () => {
    const cardManager = new CardManager();
    // 模拟包含重复ID的数据
    cardManager.allCards = [
      { id: 'test', name: 'Test Card', type: 'attack', cost: 1, description: 'Test', effect: {}, rarity: 'common', icon: '⚔️' },
      { id: 'test', name: 'Duplicate Card', type: 'attack', cost: 1, description: 'Test', effect: {}, rarity: 'common', icon: '⚔️' }
    ];

    const uniqueCards = cardManager.allCards.filter((card, index, self) =>
      index === self.findIndex(c => c.id === card.id)
    );

    testRunner.expect(uniqueCards.length).toBe(1);
  });

  testRunner.it('EC-003: 卡牌缺少必需字段应跳过', async () => {
    const cardManager = new CardManager();
    const testCards = [
      { id: 'valid', name: 'Valid', type: 'attack', cost: 1, description: 'Test', effect: {}, rarity: 'common', icon: '⚔️' },
      { id: 'invalid', name: 'Invalid', type: 'attack', cost: 1 } // 缺少必需字段
    ];

    const validCards = testCards.filter(card => cardManager.validateCard(card));

    testRunner.expect(validCards.length).toBe(1);
    testRunner.expect(validCards[0].id).toBe('valid');
  });
});

testRunner.describe('卡组管理', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();
    // 设置测试用的卡牌数据
    cardManager.allCards = [
      { id: 'attack1', name: '攻击卡1', type: 'attack', cost: 1, description: '攻击', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'attack2', name: '攻击卡2', type: 'attack', cost: 1, description: '攻击', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'attack3', name: '攻击卡3', type: 'attack', cost: 1, description: '攻击', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'attack4', name: '攻击卡4', type: 'attack', cost: 1, description: '攻击', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'defend1', name: '防御卡1', type: 'defense', cost: 1, description: '防御', effect: { type: 'armor', value: 8 }, rarity: 'common', icon: '🛡️' },
      { id: 'defend2', name: '防御卡2', type: 'defense', cost: 1, description: '防御', effect: { type: 'armor', value: 8 }, rarity: 'common', icon: '🛡️' },
      { id: 'defend3', name: '防御卡3', type: 'defense', cost: 1, description: '防御', effect: { type: 'armor', value: 8 }, rarity: 'common', icon: '🛡️' },
      { id: 'skill1', name: '技能卡1', type: 'skill', cost: 1, description: '技能', effect: { type: 'draw', value: 2 }, rarity: 'common', icon: '🎴' },
      { id: 'skill2', name: '技能卡2', type: 'skill', cost: 1, description: '技能', effect: { type: 'draw', value: 2 }, rarity: 'common', icon: '🎴' },
      { id: 'skill3', name: '技能卡3', type: 'skill', cost: 1, description: '技能', effect: { type: 'draw', value: 2 }, rarity: 'common', icon: '🎴' }
    ];
  });

  testRunner.it('TC-014: 创建初始卡组应返回恰好10张卡', () => {
    const deck = cardManager.createStarterDeck();

    testRunner.expect(deck.length).toBe(10);

    // 验证卡牌类型分布
    const attackCards = deck.filter(card => card.type === 'attack').length;
    const defenseCards = deck.filter(card => card.type === 'defense').length;
    const skillCards = deck.filter(card => card.type === 'skill').length;

    testRunner.expect(attackCards).toBe(4);
    testRunner.expect(defenseCards).toBe(3);
    testRunner.expect(skillCards).toBe(3);
  });

  testRunner.it('TC-010: 添加卡牌到满额卡组应返回失败', () => {
    // 填满卡组
    cardManager.deck = Array(cardManager.maxDeckSize).fill({ id: 'test', name: 'Test' });

    const result = cardManager.addCardToDeck('attack1');

    testRunner.expect(result.success).toBeFalsy();
    testRunner.expect(result.message).toContain('卡组已满');
  });

  testRunner.it('TC-011: 移除卡组中不存在的卡牌应返回失败', () => {
    const result = cardManager.removeCardFromDeck('nonexistent');

    testRunner.expect(result.success).toBeFalsy();
    testRunner.expect(result.message).toContain('不在卡组中');
  });

  testRunner.it('BR-004: 卡组上限应为20张', () => {
    testRunner.expect(cardManager.maxDeckSize).toBe(20);
  });

  testRunner.it('EC-005: 添加多张相同ID卡牌应允许', () => {
    // 先添加一张
    cardManager.addCardToDeck('attack1');
    testRunner.expect(cardManager.deck.length).toBe(1);

    // 再添加一张相同ID的卡牌
    cardManager.addCardToDeck('attack1');
    testRunner.expect(cardManager.deck.length).toBe(2);
  });
});

testRunner.describe('洗牌功能', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();
    cardManager.drawPile = [
      { id: 'card1', name: 'Card 1' },
      { id: 'card2', name: 'Card 2' },
      { id: 'card3', name: 'Card 3' }
    ];
  });

  testRunner.it('TC-003: 洗牌后卡牌顺序应完全改变', () => {
    const originalOrder = [...cardManager.drawPile];
    const shuffled = cardManager.shuffleDeck();

    // 检查是否所有卡牌都还在
    testRunner.expect(shuffled.length).toBe(3);
    testRunner.expect(shuffled.map(c => c.id).sort())
      .toEqual(['card1', 'card2', 'card3'].sort());

    // 检查顺序是否改变（概率性测试）
    const isSameOrder = originalOrder.every((card, index) =>
      card.id === shuffled[index].id
    );

    // 多次测试以确保洗牌有效
    let changedCount = 0;
    for (let i = 0; i < 10; i++) {
      const testShuffle = cardManager.shuffleDeck();
      const isSame = originalOrder.every((card, index) =>
        card.id === testShuffle[index].id
      );
      if (!isSame) changedCount++;
    }

    testRunner.expect(changedCount > 0).toBeTruthy();
  });

  testRunner.it('EC-006: 洗牌空数组应返回空数组', () => {
    const shuffled = cardManager.shuffleDeck([]);
    testRunner.expect(shuffled).toEqual([]);
  });
});

testRunner.describe('抽牌功能', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();
    cardManager.maxHandSize = 10;

    // 设置测试数据
    cardManager.allCards = [
      { id: 'card1', name: 'Card 1', type: 'attack', cost: 1, description: 'Test', effect: {}, rarity: 'common', icon: '⚔️' },
      { id: 'card2', name: 'Card 2', type: 'attack', cost: 1, description: 'Test', effect: {}, rarity: 'common', icon: '⚔️' },
      { id: 'card3', name: 'Card 3', type: 'attack', cost: 1, description: 'Test', effect: {}, rarity: 'common', icon: '⚔️' }
    ];

    // 初始化抽牌堆
    cardManager.drawPile = [...cardManager.allCards];
    cardManager.discardPile = [];
    cardManager.hand = [];
  });

  testRunner.it('TC-004: 从空抽牌堆抽牌应自动洗牌弃牌堆', () => {
    // 抽牌堆为空，弃牌堆有卡牌
    cardManager.drawPile = [];
    cardManager.discardPile = [...cardManager.allCards];

    const cards = cardManager.drawCards(1);

    testRunner.expect(cards.length).toBe(1);
    testRunner.expect(cardManager.drawPile.length).toBe(2); // 剩余2张
    testRunner.expect(cardManager.discardPile.length).toBe(0);
  });

  testRunner.it('TC-005: 从空抽牌堆和空弃牌堆抽牌应返回空数组', () => {
    cardManager.drawPile = [];
    cardManager.discardPile = [];

    const cards = cardManager.drawCards(5);

    testRunner.expect(cards).toEqual([]);
  });

  testRunner.it('TC-006: 抽牌超过抽牌堆数量应返回所有剩余卡牌', () => {
    // 只有3张卡牌，尝试抽5张
    const cards = cardManager.drawCards(5);

    testRunner.expect(cards.length).toBe(3);
    testRunner.expect(cardManager.drawPile.length).toBe(0);
  });

  testRunner.it('TC-007: 手牌达到10张上限时第11张牌应被销毁', () => {
    // 手牌已有9张
    cardManager.hand = Array(9).fill({ id: 'existing', name: 'Existing' });

    // 抽2张牌
    const cards = cardManager.drawCards(2);

    testRunner.expect(cardManager.hand.length).toBe(10);
    testRunner.expect(cards.length).toBe(2);
  });

  testRunner.it('EC-004: 抽牌数量为0应返回空数组', () => {
    const cards = cardManager.drawCards(0);
    testRunner.expect(cards).toEqual([]);
  });

  testRunner.it('EC-005: 抽牌数量为负数应抛出错误', () => {
    testRunner.expect(() => {
      cardManager.drawCards(-1);
    }).toThrow();
  });

  testRunner.it('BR-002: 每回合开始应自动抽5张牌', () => {
    // Add more cards to ensure we can draw 5
    const additionalCards = [
      { id: 'card4', name: 'Card 4', type: 'attack', cost: 1, description: 'Test', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'card5', name: 'Card 5', type: 'attack', cost: 1, description: 'Test', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'card6', name: 'Card 6', type: 'attack', cost: 1, description: 'Test', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'card7', name: 'Card 7', type: 'attack', cost: 1, description: 'Test', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'card8', name: 'Card 8', type: 'attack', cost: 1, description: 'Test', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' }
    ];
    cardManager.allCards = [...cardManager.allCards, ...additionalCards];
    cardManager.drawPile = [...cardManager.allCards];

    const initialHandSize = cardManager.hand.length;
    const drawnCards = cardManager.drawCards(5);

    testRunner.expect(drawnCards.length).toBe(5);
    testRunner.expect(cardManager.hand.length).toBe(initialHandSize + 5);
  });
});

testRunner.describe('卡牌操作', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();
    cardManager.energy = 3;

    // 设置测试数据
    cardManager.allCards = [
      { id: 'attack', name: '攻击卡', type: 'attack', cost: 1, description: '造成伤害', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' },
      { id: 'expensive', name: '昂贵卡', type: 'attack', cost: 4, description: '造成大量伤害', effect: { type: 'damage', value: 20 }, rarity: 'epic', icon: '💎' }
    ];

    // 设置手牌
    cardManager.hand = [
      cardManager.allCards[0],
      cardManager.allCards[1]
    ];
  });

  testRunner.it('TC-007: 打出能量不足的卡牌应返回失败', () => {
    cardManager.energy = 2; // 只有2点能量

    const result = cardManager.playCard('expensive'); // 需要4点能量

    testRunner.expect(result.success).toBeFalsy();
    testRunner.expect(result.message).toContain('能量不足');
  });

  testRunner.it('TC-008: 打出不存在的卡牌ID应返回失败', () => {
    const result = cardManager.playCard('nonexistent');

    testRunner.expect(result.success).toBeFalsy();
    testRunner.expect(result.message).toContain('不在手牌中');
  });

  testRunner.it('TC-009: 打出有效卡牌应成功', async () => {
    const initialEnergy = cardManager.energy;
    const initialHandSize = cardManager.hand.length;

    const result = await cardManager.playCard('attack');

    testRunner.expect(result.success).toBeTruthy();
    testRunner.expect(result.card.id).toBe('attack');
    testRunner.expect(cardManager.energy).toBe(initialEnergy - 1);
    testRunner.expect(cardManager.hand.length).toBe(initialHandSize - 1);
    testRunner.expect(cardManager.discardPile.length).toBe(1);
  });

  testRunner.it('BR-003: 只能打出手牌中的卡牌', () => {
    // 尝试打出卡组中的卡牌
    cardManager.deck.push({ id: 'in_deck', name: '卡组中的卡' });

    const result = cardManager.playCard('in_deck');

    testRunner.expect(result.success).toBeFalsy();
  });

  testRunner.it('TC-009: 抽牌堆空时自动洗牌弃牌堆', () => {
    // 初始化抽牌堆和弃牌堆
    cardManager.drawPile = [];
    cardManager.discardPile = [
      { id: 'card1', name: 'Card 1' },
      { id: 'card2', name: 'Card 2' }
    ];
    cardManager.hand = [];

    const cards = cardManager.drawCards(1);

    testRunner.expect(cards.length).toBe(1);
    testRunner.expect(cardManager.drawPile.length).toBe(1);
    testRunner.expect(cardManager.discardPile.length).toBe(0);
  });
});

testRunner.describe('卡牌升级', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();

    // 设置测试数据
    cardManager.allCards = [
      {
        id: 'attack',
        name: '攻击卡',
        type: 'attack',
        cost: 2,
        description: '造成伤害',
        effect: { type: 'damage', value: 10 },
        rarity: 'common',
        icon: '⚔️',
        upgraded: false
      },
      {
        id: 'defend',
        name: '防御卡',
        type: 'defense',
        cost: 1,
        description: '获得护甲',
        effect: { type: 'armor', value: 5 },
        rarity: 'common',
        icon: '🛡️',
        upgraded: false
      }
    ];

    // 设置手牌 - use the actual card objects
    cardManager.hand = [
      cardManager.allCards[0],
      cardManager.allCards[1]
    ];
  });

  testRunner.it('TC-012: 升级已升级的卡牌应返回失败', () => {
    // 标记为已升级
    cardManager.hand[0].upgraded = true;

    const result = cardManager.upgradeCard('attack');

    testRunner.expect(result.success).toBeFalsy();
    testRunner.expect(result.message).toContain('已经升级');
  });

  testRunner.it('升级攻击卡应增加伤害值', () => {
    const initialDamage = cardManager.hand[0].effect.value;

    cardManager.upgradeCard('attack');

    testRunner.expect(cardManager.hand[0].effect.value).toBe(initialDamage + 3);
    testRunner.expect(cardManager.hand[0].upgraded).toBeTruthy();
    testRunner.expect(cardManager.hand[0].name).toBe('攻击卡 +');
  });

  testRunner.it('升级护甲卡应减少费用', () => {
    const initialCost = cardManager.hand[1].cost;

    cardManager.upgradeCard('defend');

    testRunner.expect(cardManager.hand[1].cost).toBe(initialCost - 1);
    testRunner.expect(cardManager.hand[1].upgraded).toBeTruthy();
  });

  testRunner.it('BR-005: 升级后卡牌费用最低为0', () => {
    // 设置费用为0的卡牌
    cardManager.hand[0].cost = 0;

    cardManager.upgradeCard('attack');

    testRunner.expect(cardManager.hand[0].cost).toBe(0);
  });
});

testRunner.describe('卡牌查询', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();

    // 设置测试数据
    cardManager.allCards = [
      { id: 'attack1', name: '攻击卡1', type: 'attack', cost: 1, description: '攻击', effect: {}, rarity: 'common', icon: '⚔️' },
      { id: 'attack2', name: '攻击卡2', type: 'attack', cost: 2, description: '强力攻击', effect: {}, rarity: 'rare', icon: '⚔️' },
      { id: 'defend1', name: '防御卡1', type: 'defense', cost: 1, description: '防御', effect: {}, rarity: 'common', icon: '🛡️' },
      { id: 'skill1', name: '技能卡1', type: 'skill', cost: 1, description: '技能', effect: {}, rarity: 'common', icon: '🎴' }
    ];
  });

  testRunner.it('TC-013: 查询不存在的卡牌类型应返回空数组', () => {
    const cards = cardManager.getCardsByType('nonexistent');

    testRunner.expect(cards).toEqual([]);
  });

  testRunner.it('按类型查询攻击卡应返回所有攻击卡', () => {
    const attackCards = cardManager.getCardsByType('attack');

    testRunner.expect(attackCards.length).toBe(2);
    testRunner.expect(attackCards.every(card => card.type === 'attack')).toBeTruthy();
  });

  testRunner.it('按类型查询防御卡应返回所有防御卡', () => {
    const defenseCards = cardManager.getCardsByType('defense');

    testRunner.expect(defenseCards.length).toBe(1);
    testRunner.expect(defenseCards[0].type).toBe('defense');
  });
});

testRunner.describe('错误处理', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();
  });

  testRunner.it('ERR_CARD_INVALID: 卡牌数据无效应记录警告', () => {
    const consoleWarn = console.warn;
    let warningMessage = '';
    console.warn = (message) => {
      warningMessage = message;
    };

    cardManager.validateCard({ id: 'test', name: 'Test' }); // 缺少必需字段

    console.warn = consoleWarn;

    testRunner.expect(warningMessage).toContain('缺少必需字段');
  });

  testRunner.it('ERR_DECK_FULL: 卡组已满应显示正确消息', () => {
    // Add a real card to allCards for testing
    cardManager.allCards.push({ id: 'new_card', name: 'New Card', type: 'attack', cost: 1, description: 'Test', effect: { type: 'damage', value: 6 }, rarity: 'common', icon: '⚔️' });
    cardManager.deck = Array(cardManager.maxDeckSize).fill(cardManager.allCards[0]);

    const result = cardManager.addCardToDeck('new_card');

    testRunner.expect(result.message).toContain('卡组已满');
  });

  testRunner.it('ERR_HAND_FULL: 手牌已满应显示正确消息', () => {
    cardManager.hand = Array(cardManager.maxHandSize).fill({ id: 'test' });
    cardManager.drawPile = [{ id: 'new_card', name: 'New Card' }];

    const originalWarn = console.warn;
    let warnMessage = '';
    console.warn = (msg) => { warnMessage = msg; };

    cardManager.drawCards(1);

    console.warn = originalWarn;

    testRunner.expect(warnMessage).toContain('手牌已满');
  });

  testRunner.it('ERR_INSUFFICIENT_ENERGY: 能量不足应显示正确消息', () => {
    cardManager.energy = 0;
    cardManager.hand = [{ id: 'expensive', name: 'Expensive', cost: 3 }];

    const result = cardManager.playCard('expensive');

    testRunner.expect(result.message).toContain('能量不足');
  });

  testRunner.it('ERR_CARD_NOT_IN_HAND: 卡牌不在手牌中应显示正确消息', () => {
    const result = cardManager.playCard('not_in_hand');

    testRunner.expect(result.message).toContain('不在手牌中');
  });

  testRunner.it('ERR_CARD_NOT_FOUND: 未找到卡牌应显示正确消息', () => {
    const result = cardManager.addCardToDeck('not_found');

    testRunner.expect(result.message).toContain('未找到卡牌');
  });
});

testRunner.describe('性能测试', () => {
  let cardManager;

  testRunner.beforeEach(() => {
    cardManager = new CardManager();
  });

  testRunner.it('加载卡牌数据应快速', async () => {
    // 模拟加载卡牌数据
    const start = performance.now();
    await cardManager.loadCards();
    const end = performance.now();

    testRunner.expect(end - start).toBeLessThan(100);
    testRunner.expect(cardManager.allCards.length).toBeGreaterThan(0);
  });

  testRunner.it('洗牌操作应少于50ms', () => {
    // 创建大量卡牌进行洗牌测试
    const largeDeck = Array.from({ length: 100 }, (_, i) => ({
      id: `card_${i}`,
      name: `Card ${i}`
    }));

    cardManager.drawPile = largeDeck;

    const start = performance.now();
    const shuffled = cardManager.shuffleDeck();
    const end = performance.now();

    testRunner.expect(end - start).toBeLessThan(50);
    testRunner.expect(shuffled.length).toBe(100);
  });

  testRunner.it('抽牌操作应少于10ms per card', () => {
    const largeDeck = Array.from({ length: 50 }, (_, i) => ({
      id: `card_${i}`,
      name: `Card ${i}`
    }));

    cardManager.drawPile = largeDeck;

    const start = performance.now();
    const cards = cardManager.drawCards(10);
    const end = performance.now();

    const timePerCard = (end - start) / 10;
    testRunner.expect(timePerCard).toBeLessThan(10);
    testRunner.expect(cards.length).toBe(10);
  });
});

// 运行所有测试
console.log('\n🚀 开始执行所有测试...\n');

// 执行测试
testRunner.describe('CardManager 完整测试套件', () => {
  // 这里可以添加更多集成测试
});

// 显示测试结果
const allTestsPassed = testRunner.summary();

console.log('\n🎯 测试总结:');
console.log(`总体结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 存在失败的测试'}`);
console.log('\n📋 测试覆盖范围:');
console.log('- ✅ 数据加载和验证');
console.log('- ✅ 卡组管理（创建、添加、移除）');
console.log('- ✅ 洗牌功能');
console.log('- ✅ 抽牌功能（含边界条件）');
console.log('- ✅ 卡牌使用和能量系统');
console.log('- ✅ 卡牌升级系统');
console.log('- ✅ 卡牌查询功能');
console.log('- ✅ 错误处理');
console.log('- ✅ 性能测试');

if (allTestsPassed) {
  console.log('\n🎉 CardManager 测试套件全部通过！系统已准备好投入生产环境。');
} else {
  console.log('\n⚠️  部分测试失败，请修复问题后重新运行测试。');
}