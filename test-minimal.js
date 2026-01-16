import TestRunner from './tests/framework.js';

const testRunner = new TestRunner();

// 最小的测试
testRunner.describe('最小测试', () => {
  testRunner.it('应该工作', () => {
    // 创建一个简单的战斗系统
    class SimpleCombat {
      constructor() {
        this.player = { hp: 100, maxHp: 100, energy: 3, armor: 0 };
        this.enemy = { hp: 100, maxHp: 100 };
      }
    }

    const combat = new SimpleCombat();
    testRunner.expect(combat.player.hp).toBe(100);
  });
});

const success = testRunner.summary();