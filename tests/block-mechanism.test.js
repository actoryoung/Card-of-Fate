/**
 * 格挡机制测试
 * 基于杀戮尖塔的格挡机制：
 * 1. 格挡是临时防御，回合结束清零
 * 2. 伤害计算时先消耗格挡，再消耗护甲
 * 3. 敏捷状态增加获得的格挡值
 */

// 简单的测试框架
function createMockTestFramework() {
  const tests = [];
  let passed = 0;
  let failed = 0;

  return {
    _beforeEach: null,
    describe: (name, fn) => {
      console.log(`\n=== ${name} ===`);
      // 保存当前的 beforeEach
      const currentBeforeEach = framework._beforeEach;
      // 执行测试组
      fn();
      // 恢复 beforeEach
      framework._beforeEach = currentBeforeEach;
    },
    it: (name, fn) => {
      tests.push({ name, fn });
      try {
        // 先执行 beforeEach 回调
        if (framework._beforeEach) {
          framework._beforeEach();
        }
        fn();
        passed++;
        console.log(`  [PASS] ${name}`);
      } catch (error) {
        failed++;
        console.log(`  [FAIL] ${name}`);
        console.log(`    ${error.message}`);
      }
    },
    beforeEach: (fn) => {
      // 存储beforeEach回调
      framework._beforeEach = fn;
    },
    expect: (actual) => ({
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      }
    }),
    summary: () => {
      console.log(`\n=== 测试结果 ===`);
      console.log(`通过: ${passed}`);
      console.log(`失败: ${failed}`);
      console.log(`总计: ${tests.length}`);
      return { passed, failed, total: tests.length };
    }
  };
}

// 简单的 CombatSystem 模拟（包含格挡机制）
class MockCombatSystem {
  constructor() {
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
        block: 0,
        statusEffects: [],
        bonusDamage: 0
      },
      enemy: {
        id: 'test_enemy',
        name: '测试敌人',
        hp: 100,
        maxHp: 100,
        attack: 10,
        armor: 0,
        block: 0,
        intent: null,
        statusEffects: []
      }
    };
  }

  /**
   * 计算伤害（先消耗格挡，再消耗护甲）
   */
  calculateDamage(baseDamage, attacker, defender) {
    let damage = baseDamage;

    // 处理状态效果
    if (defender.statusEffects && defender.statusEffects.length > 0) {
      const weakEffect = defender.statusEffects.find(s => s.type === 'weak');
      if (weakEffect) {
        damage = Math.floor(damage * 0.75);
      }

      const vulnerableEffect = defender.statusEffects.find(s => s.type === 'vulnerable');
      if (vulnerableEffect) {
        damage = Math.floor(damage * 1.5);
      }
    }

    // 先消耗格挡，再消耗护甲
    let blockConsumed = 0;
    let armorConsumed = 0;
    let hpDamage = damage;
    let remainingDamage = damage;

    if (defender.block > 0) {
      if (remainingDamage <= defender.block) {
        blockConsumed = remainingDamage;
        hpDamage = 0;
        remainingDamage = 0;
      } else {
        blockConsumed = defender.block;
        remainingDamage -= defender.block;
      }
      defender.block -= blockConsumed;
    }

    if (remainingDamage > 0 && defender.armor > 0) {
      hpDamage = remainingDamage;
      if (remainingDamage <= defender.armor) {
        armorConsumed = remainingDamage;
        hpDamage = 0;
      } else {
        armorConsumed = defender.armor;
        hpDamage = remainingDamage - defender.armor;
      }
      defender.armor -= armorConsumed;
    } else if (remainingDamage > 0) {
      hpDamage = remainingDamage;
    }

    return { hpDamage, blockConsumed, armorConsumed, totalDamage: damage };
  }

  /**
   * 添加格挡（考虑敏捷加成）
   */
  addBlock(target, baseBlock) {
    let bonusBlock = 0;
    if (target.statusEffects && target.statusEffects.length > 0) {
      const dexterityEffect = target.statusEffects.find(s => s.type === 'dexterity');
      if (dexterityEffect) {
        bonusBlock = dexterityEffect.value;
      }
    }
    target.block += baseBlock + bonusBlock;
    return baseBlock + bonusBlock;
  }

  /**
   * 清零格挡
   */
  clearBlock(target) {
    target.block = 0;
  }

  /**
   * 应用状态效果
   */
  applyStatusEffect(target, type, duration, value) {
    const existingEffect = target.statusEffects.find(s => s.type === type);
    if (existingEffect) {
      existingEffect.duration = duration;
      existingEffect.value += value;
    } else {
      target.statusEffects.push({ type, duration, value });
    }
  }

  /**
   * 处理回合开始（减少状态效果持续时间）
   */
  processTurnStartEffects(target) {
    target.statusEffects = target.statusEffects.filter(effect => {
      effect.duration--;
      return effect.duration > 0;
    });
  }
}

// 运行测试
const framework = createMockTestFramework();
let combatSystem;

framework.describe('格挡机制基础测试', () => {
  framework.beforeEach(() => {
    combatSystem = new MockCombatSystem();
  });

  framework.it('应该正确添加格挡', () => {
    const player = combatSystem.combatState.player;
    const addedBlock = combatSystem.addBlock(player, 8);
    framework.expect(addedBlock).toBe(8);
    framework.expect(player.block).toBe(8);
  });

  framework.it('应该正确清零格挡', () => {
    const player = combatSystem.combatState.player;
    player.block = 15;
    combatSystem.clearBlock(player);
    framework.expect(player.block).toBe(0);
  });

  framework.it('应该先消耗格挡再消耗护甲', () => {
    const defender = combatSystem.combatState.player;
    defender.block = 5;
    defender.armor = 10;

    const result = combatSystem.calculateDamage(12, combatSystem.combatState.enemy, defender);

    framework.expect(result.blockConsumed).toBe(5);  // 先消耗5点格挡
    framework.expect(result.armorConsumed).toBe(7);  // 再消耗7点护甲
    framework.expect(result.hpDamage).toBe(0);       // HP不受伤害
  });

  framework.it('格挡完全吸收伤害时HP不应受伤害', () => {
    const defender = combatSystem.combatState.player;
    defender.block = 15;

    const result = combatSystem.calculateDamage(10, combatSystem.combatState.enemy, defender);

    framework.expect(result.blockConsumed).toBe(10);
    framework.expect(result.armorConsumed).toBe(0);
    framework.expect(result.hpDamage).toBe(0);
    framework.expect(defender.block).toBe(5);
  });

  framework.it('没有格挡时应该消耗护甲', () => {
    const defender = combatSystem.combatState.player;
    defender.armor = 8;

    const result = combatSystem.calculateDamage(5, combatSystem.combatState.enemy, defender);

    framework.expect(result.blockConsumed).toBe(0);
    framework.expect(result.armorConsumed).toBe(5);
    framework.expect(result.hpDamage).toBe(0);
  });
});

framework.describe('敏捷与格挡交互测试', () => {
  framework.beforeEach(() => {
    combatSystem = new MockCombatSystem();
  });

  framework.it('敏捷应该增加获得的格挡值', () => {
    const player = combatSystem.combatState.player;
    combatSystem.applyStatusEffect(player, 'dexterity', 2, 3); // 3点敏捷，持续2回合

    const addedBlock = combatSystem.addBlock(player, 5); // 基础5点格挡
    framework.expect(addedBlock).toBe(8); // 5 + 3 = 8
    framework.expect(player.block).toBe(8);
  });

  framework.it('敏捷为0时不应该增加格挡', () => {
    const player = combatSystem.combatState.player;
    combatSystem.applyStatusEffect(player, 'dexterity', 2, 0); // 0点敏捷

    const addedBlock = combatSystem.addBlock(player, 5);
    framework.expect(addedBlock).toBe(5);
    framework.expect(player.block).toBe(5);
  });
});

framework.describe('状态效果对格挡的影响测试', () => {
  framework.beforeEach(() => {
    combatSystem = new MockCombatSystem();
  });

  framework.it('虚弱效果应该减少对敌人的伤害', () => {
    const enemy = combatSystem.combatState.enemy;
    combatSystem.applyStatusEffect(enemy, 'weak', 2, 0); // 虚弱2回合

    const result = combatSystem.calculateDamage(10, combatSystem.combatState.player, enemy);

    framework.expect(result.totalDamage).toBe(7); // 10 * 0.75 = 7.5 -> 7
  });

  framework.it('易伤效果应该增加对敌人的伤害', () => {
    const enemy = combatSystem.combatState.enemy;
    combatSystem.applyStatusEffect(enemy, 'vulnerable', 2, 0); // 易伤2回合

    const result = combatSystem.calculateDamage(10, combatSystem.combatState.player, enemy);

    framework.expect(result.totalDamage).toBe(15); // 10 * 1.5 = 15
  });
});

framework.describe('回合结束清零格挡测试', () => {
  framework.beforeEach(() => {
    combatSystem = new MockCombatSystem();
  });

  framework.it('玩家回合结束应该清零格挡', () => {
    const player = combatSystem.combatState.player;
    player.block = 20;

    combatSystem.clearBlock(player);

    framework.expect(player.block).toBe(0);
  });

  framework.it('敌人回合结束应该清零格挡', () => {
    const enemy = combatSystem.combatState.enemy;
    enemy.block = 10;

    combatSystem.clearBlock(enemy);

    framework.expect(enemy.block).toBe(0);
  });

  framework.it('回合开始应该减少状态效果持续时间', () => {
    const player = combatSystem.combatState.player;
    combatSystem.applyStatusEffect(player, 'dexterity', 3, 2); // 3回合
    framework.expect(player.statusEffects[0].duration).toBe(3);

    combatSystem.processTurnStartEffects(player);
    framework.expect(player.statusEffects[0].duration).toBe(2);

    combatSystem.processTurnStartEffects(player);
    framework.expect(player.statusEffects[0].duration).toBe(1);

    combatSystem.processTurnStartEffects(player);
    framework.expect(player.statusEffects.length).toBe(0); // 状态效果移除
  });
});

framework.describe('复杂战斗场景测试', () => {
  framework.beforeEach(() => {
    combatSystem = new MockCombatSystem();
  });

  framework.it('场景1：玩家获得格挡后受到攻击', () => {
    const player = combatSystem.combatState.player;
    const enemy = combatSystem.combatState.enemy;

    // 玩家获得12点格挡
    combatSystem.addBlock(player, 12);
    framework.expect(player.block).toBe(12);
    framework.expect(player.hp).toBe(100);

    // 敌人攻击造成10点伤害
    const result = combatSystem.calculateDamage(10, enemy, player);
    framework.expect(result.hpDamage).toBe(0);
    framework.expect(result.blockConsumed).toBe(10);
    framework.expect(player.block).toBe(2);
    framework.expect(player.hp).toBe(100);
  });

  framework.it('场景2：格挡不足时消耗护甲', () => {
    const player = combatSystem.combatState.player;
    const enemy = combatSystem.combatState.enemy;

    player.block = 5;
    player.armor = 10;

    const result = combatSystem.calculateDamage(15, enemy, player);

    framework.expect(result.blockConsumed).toBe(5);   // 格挡全部消耗
    framework.expect(result.armorConsumed).toBe(10);  // 护甲全部消耗
    framework.expect(result.hpDamage).toBe(0);        // HP不受伤害
  });

  framework.it('场景3：敏捷加成后的格挡防御', () => {
    const player = combatSystem.combatState.player;
    const enemy = combatSystem.combatState.enemy;

    // 获得敏捷状态
    combatSystem.applyStatusEffect(player, 'dexterity', 2, 4); // 4点敏捷

    // 添加格挡（基础8点 + 4点敏捷 = 12点）
    combatSystem.addBlock(player, 8);
    framework.expect(player.block).toBe(12);

    // 敌人攻击10点伤害
    const result = combatSystem.calculateDamage(10, enemy, player);
    framework.expect(result.hpDamage).toBe(0);
    framework.expect(player.block).toBe(2);
  });

  framework.it('场景4：回合结束后格挡清零，护甲保留', () => {
    const player = combatSystem.combatState.player;
    player.block = 15;
    player.armor = 5;

    // 回合结束
    combatSystem.clearBlock(player);

    framework.expect(player.block).toBe(0);
    framework.expect(player.armor).toBe(5); // 护甲保留
  });
});

// 运行所有测试
const summary = framework.summary();
process.exit(summary.failed > 0 ? 1 : 0);
