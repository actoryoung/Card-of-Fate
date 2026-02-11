/**
 * StatusEffects 系统完整测试套件
 * 覆盖状态效果施加、移除、回合处理、伤害计算等所有功能
 *
 * 测试文件位置: tests/StatusEffects.test.js
 * 源文件位置: src/core/StatusEffects.js
 * 编码: UTF-8
 */

import TestRunner from './framework.js';
import { StatusEffects, STATUS_TYPES, ERROR_CODES } from '../src/core/StatusEffects.js';

// 创建测试运行器
const testRunner = new TestRunner();

console.log('🧪 StatusEffects 测试开始...\n');

// ===== 状态效果施加测试 =====

testRunner.describe('状态效果施加 - applyStatus()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
  });

  testRunner.it('应成功施加力量状态', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 2);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH)).toBe(5);
  });

  testRunner.it('应成功施加虚弱状态', () => {
    const result = statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 2, 3);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('enemy1', STATUS_TYPES.WEAK)).toBe(2);
  });

  testRunner.it('应成功施加易伤状态', () => {
    const result = statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 2);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('enemy1', STATUS_TYPES.VULNERABLE)).toBe(1);
  });

  testRunner.it('应成功施加中毒状态', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.POISON)).toBe(5);
  });

  testRunner.it('应成功施加再生状态', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 2);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.REGEN)).toBe(3);
  });

  testRunner.it('应成功施加敏捷状态', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.DEXTERITY, 3, 1);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.DEXTERITY)).toBe(3);
  });

  testRunner.it('应正确设置持续时间', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3);
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses.length).toBe(1);
    testRunner.expect(allStatuses[0].duration).toBe(3);
  });

  testRunner.it('相同状态效果应正确堆叠数值', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 2);
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 3, 1);
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH)).toBe(8);
  });

  testRunner.it('中毒状态应正确堆叠（值增加+刷新持续时间）', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 3, 2);
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 2, 3);
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.POISON)).toBe(5);
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses[0].duration).toBe(3);
  });

  testRunner.it('再生状态应正确堆叠', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 2, 2);
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 1);
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.REGEN)).toBe(5);
  });

  testRunner.it('堆叠时应刷新持续时间', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 3, 2);
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 2, 3);
    const updatedStatus = statusEffects.getAllStatuses('player1')[0];
    testRunner.expect(updatedStatus.duration).toBe(3);
  });

  testRunner.it('无效的状态类型应返回false', () => {
    const result = statusEffects.applyStatus('player1', 'invalid_status', 1, 1);
    testRunner.expect(result).toBeFalsy();
  });

  testRunner.it('负数值应返回false', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, -1, 1);
    testRunner.expect(result).toBeFalsy();
  });

  testRunner.it('非正数持续时间应返回false', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 1, 0);
    testRunner.expect(result).toBeFalsy();
  });

  testRunner.it('负持续时间应返回false', () => {
    const result = statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 1, -1);
    testRunner.expect(result).toBeFalsy();
  });

  testRunner.it('应正确设置source选项', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3, { source: 'card_poison' });
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses[0].source).toBe('card_poison');
  });

  testRunner.it('应正确设置id选项', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3, { id: 'poison_123' });
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses[0].id).toBe('poison_123');
  });

  testRunner.it('未提供id时应生成时间戳', () => {
    const beforeTime = Date.now();
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3);
    const afterTime = Date.now();
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses[0].id).toBeGreaterThanOrEqual(beforeTime);
    testRunner.expect(allStatuses[0].id).toBeLessThanOrEqual(afterTime);
  });
});

// ===== 状态效果移除测试 =====

testRunner.describe('状态效果移除 - removeStatus()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 2);
  });

  testRunner.it('应成功移除指定状态效果', () => {
    const result = statusEffects.removeStatus('player1', STATUS_TYPES.POISON);
    testRunner.expect(result).toBeTruthy();
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.POISON)).toBe(0);
  });

  testRunner.it('移除后其他状态应保留', () => {
    statusEffects.removeStatus('player1', STATUS_TYPES.POISON);
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.REGEN)).toBe(3);
  });

  testRunner.it('移除不存在的状态应返回false', () => {
    const result = statusEffects.removeStatus('player1', STATUS_TYPES.STRENGTH);
    testRunner.expect(result).toBeFalsy();
  });

  testRunner.it('移除不存在目标的状态应返回false', () => {
    const result = statusEffects.removeStatus('nonexistent', STATUS_TYPES.POISON);
    testRunner.expect(result).toBeFalsy();
  });

  testRunner.it('移除最后一个状态应清理目标记录', () => {
    statusEffects.removeStatus('player1', STATUS_TYPES.POISON);
    statusEffects.removeStatus('player1', STATUS_TYPES.REGEN);
    testRunner.expect(statusEffects.getAllStatuses('player1')).toEqual([]);
  });
});

// ===== 状态效果自动移除测试 =====

testRunner.describe('状态效果自动移除 - processTurnStart()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
  });

  testRunner.it('持续时间归零时应自动移除状态', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 1);
    statusEffects.processTurnStart('player1');
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH)).toBe(0);
  });

  testRunner.it('持续时间大于1时应保留状态并减少持续时间', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.processTurnStart('player1');
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses.length).toBe(1);
    testRunner.expect(allStatuses[0].duration).toBe(2);
  });

  testRunner.it('处理不存在的目标应返回空结果', () => {
    const result = statusEffects.processTurnStart('nonexistent');
    testRunner.expect(result.statuses).toEqual([]);
    testRunner.expect(result.effects).toEqual([]);
  });

  testRunner.it('多个状态不同持续时间应正确处理', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 1);
    statusEffects.applyStatus('player1', STATUS_TYPES.WEAK, 2, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 2);
    statusEffects.processTurnStart('player1');
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses.length).toBe(2);
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH)).toBe(0);
  });
});

// ===== 回合处理测试 =====

testRunner.describe('回合开始处理 - processTurnStart()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
  });

  testRunner.it('中毒状态到期时应触发伤害效果', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 1);
    const result = statusEffects.processTurnStart('player1');
    testRunner.expect(result.effects.length).toBe(1);
    testRunner.expect(result.effects[0].type).toBe('damage');
    testRunner.expect(result.effects[0].value).toBe(5);
  });

  testRunner.it('再生状态到期时应触发治疗效果', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 1);
    const result = statusEffects.processTurnStart('player1');
    testRunner.expect(result.effects.length).toBe(1);
    testRunner.expect(result.effects[0].type).toBe('heal');
    testRunner.expect(result.effects[0].value).toBe(3);
  });

  testRunner.it('应返回所有状态的当前信息', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.WEAK, 2, 2);
    const result = statusEffects.processTurnStart('player1');
    testRunner.expect(result.statuses.length).toBe(2);
    testRunner.expect(result.statuses[0].type).toBe(STATUS_TYPES.STRENGTH);
    testRunner.expect(result.statuses[0].remaining).toBe(2);
  });

  testRunner.it('非持续效果状态不应产生效果', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 1);
    statusEffects.applyStatus('player1', STATUS_TYPES.WEAK, 2, 1);
    const result = statusEffects.processTurnStart('player1');
    testRunner.expect(result.effects.length).toBe(0);
  });

  testRunner.it('多个持续效果应全部触发', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 1);
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 1);
    const result = statusEffects.processTurnStart('player1');
    testRunner.expect(result.effects.length).toBe(2);
    testRunner.expect(result.effects.some(e => e.type === 'damage')).toBeTruthy();
    testRunner.expect(result.effects.some(e => e.type === 'heal')).toBeTruthy();
  });
});

// ===== 回合结束处理测试 =====

testRunner.describe('回合结束处理 - processTurnEnd()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
  });

  testRunner.it('应返回力量状态信息', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    const result = statusEffects.processTurnEnd('player1');
    testRunner.expect(result.statuses.length).toBe(1);
    testRunner.expect(result.statuses[0].type).toBe(STATUS_TYPES.STRENGTH);
  });

  testRunner.it('处理不存在目标应返回空结果', () => {
    const result = statusEffects.processTurnEnd('nonexistent');
    testRunner.expect(result.statuses).toEqual([]);
    testRunner.expect(result.effects).toEqual([]);
  });

  testRunner.it('回合结束不应改变状态持续时间', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    const beforeDuration = statusEffects.getAllStatuses('player1')[0].duration;
    statusEffects.processTurnEnd('player1');
    const afterDuration = statusEffects.getAllStatuses('player1')[0].duration;
    testRunner.expect(afterDuration).toBe(beforeDuration);
  });
});

// ===== 伤害计算测试 =====

testRunner.describe('伤害计算 - calculateDamage()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
  });

  testRunner.it('无状态效果时应返回基础伤害', () => {
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(10);
    testRunner.expect(result.baseDamage).toBe(10);
    testRunner.expect(result.damageCalculation).toBe('无状态效果');
  });

  testRunner.it('攻击者有力量时应增加伤害', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(15);
    testRunner.expect(result.strength).toBe(5);
  });

  testRunner.it('多层力量应正确累加', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 3, 2);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(18);
    testRunner.expect(result.strength).toBe(8);
  });

  testRunner.it('力量为0时应不影响伤害', () => {
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.strength).toBe(0);
    testRunner.expect(result.finalDamage).toBe(10);
  });

  testRunner.it('防御者有虚弱时应减少25%伤害', () => {
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(7);
    testRunner.expect(result.weak).toBe(1);
  });

  testRunner.it('虚弱与力量组合应先加成后减少', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(11);
  });

  testRunner.it('多层虚弱应正确累加', () => {
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 2, 3);
    const result = statusEffects.calculateDamage(20, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(15);
    testRunner.expect(result.weak).toBe(2);
  });

  testRunner.it('防御者有易伤时应增加50%伤害', () => {
    statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(15);
    testRunner.expect(result.vulnerable).toBe(1);
  });

  testRunner.it('易伤与力量组合应先加成后增加', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(22);
  });

  testRunner.it('力量+虚弱+易伤应正确计算', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(16);
  });

  testRunner.it('虚弱和易伤同时存在应先虚弱后易伤', () => {
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    // 10 * 0.75 = 7.5 -> 7; 7 * 1.5 = 10.5 -> 10
    testRunner.expect(result.finalDamage).toBe(10);
  });

  testRunner.it('大量力量加成应正确计算', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 20, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(45);
  });

  testRunner.it('伤害为0时应保持0', () => {
    const result = statusEffects.calculateDamage(0, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBe(0);
  });

  testRunner.it('虚弱不应让伤害变成负数', () => {
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
    const result = statusEffects.calculateDamage(1, 'player1', 'enemy1');
    testRunner.expect(result.finalDamage).toBeGreaterThanOrEqual(0);
  });

  testRunner.it('应返回完整的状态信息', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);
    const result = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(result.baseDamage).toBe(10);
    testRunner.expect(result.finalDamage).toBeDefined();
    testRunner.expect(result.damageCalculation).toBeDefined();
    testRunner.expect(result.strength).toBe(5);
    testRunner.expect(result.weak).toBe(1);
    testRunner.expect(result.vulnerable).toBe(1);
  });
});

// ===== 护甲计算测试 =====

testRunner.describe('护甲计算 - calculateArmor()', () => {
  let statusEffects;

  testRunner.beforeEach(() => {
    statusEffects = new StatusEffects();
  });

  testRunner.it('无敏捷状态应返回基础护甲', () => {
    const result = statusEffects.calculateArmor('player1', 10);
    testRunner.expect(result.finalArmor).toBe(10);
    testRunner.expect(result.baseArmor).toBe(10);
    testRunner.expect(result.bonus).toBe(0);
  });

  testRunner.it('有敏捷状态应增加护甲', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.DEXTERITY, 5, 3);
    const result = statusEffects.calculateArmor('player1', 10);
    testRunner.expect(result.finalArmor).toBe(15);
    testRunner.expect(result.bonus).toBe(5);
  });

  testRunner.it('多层敏捷应正确累加', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.DEXTERITY, 3, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.DEXTERITY, 2, 2);
    const result = statusEffects.calculateArmor('player1', 10);
    testRunner.expect(result.finalArmor).toBe(15);
    testRunner.expect(result.bonus).toBe(5);
  });

  testRunner.it('基础护甲为0时应只加敏捷加成', () => {
    statusEffects.applyStatus('player1', STATUS_TYPES.DEXTERITY, 5, 3);
    const result = statusEffects.calculateArmor('player1', 0);
    testRunner.expect(result.finalArmor).toBe(5);
  });
});

// ===== 辅助方法测试 =====

testRunner.describe('getStatusValue()', () => {
  testRunner.it('应返回指定状态的值', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    const value = statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH);
    testRunner.expect(value).toBe(5);
  });

  testRunner.it('目标不存在应返回0', () => {
    const statusEffects = new StatusEffects();
    const value = statusEffects.getStatusValue('nonexistent', STATUS_TYPES.STRENGTH);
    testRunner.expect(value).toBe(0);
  });

  testRunner.it('状态不存在应返回0', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    const value = statusEffects.getStatusValue('player1', STATUS_TYPES.WEAK);
    testRunner.expect(value).toBe(0);
  });

  testRunner.it('堆叠状态应返回总值', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 3, 2);
    const value = statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH);
    testRunner.expect(value).toBe(8);
  });
});

testRunner.describe('getAllStatuses()', () => {
  testRunner.it('应返回目标的所有状态效果', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.WEAK, 2, 2);
    const allStatuses = statusEffects.getAllStatuses('player1');
    testRunner.expect(allStatuses.length).toBe(2);
  });

  testRunner.it('目标不存在应返回空数组', () => {
    const statusEffects = new StatusEffects();
    const allStatuses = statusEffects.getAllStatuses('nonexistent');
    testRunner.expect(allStatuses).toEqual([]);
  });

  testRunner.it('应返回状态效果的副本（修改数组不影响原数据）', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    const allStatuses = statusEffects.getAllStatuses('player1');
    // 验证返回的是一个新数组
    const originalLength = statusEffects.getAllStatuses('player1').length;
    allStatuses.push({ type: 'fake', value: 999 });
    // 修改返回的数组不应影响原始数据
    testRunner.expect(statusEffects.getAllStatuses('player1').length).toBe(originalLength);
  });
});

testRunner.describe('getStats()', () => {
  testRunner.it('应返回正确的统计信息', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.WEAK, 2, 2);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.POISON, 3, 3);
    const stats = statusEffects.getStats();
    testRunner.expect(stats.totalTargets).toBe(2);
    testRunner.expect(stats.totalEffects).toBe(3);
    testRunner.expect(stats.targetsById['player1']).toBe(2);
    testRunner.expect(stats.targetsById['enemy1']).toBe(1);
  });

  testRunner.it('空状态应返回零统计', () => {
    const statusEffects = new StatusEffects();
    const stats = statusEffects.getStats();
    testRunner.expect(stats.totalTargets).toBe(0);
    testRunner.expect(stats.totalEffects).toBe(0);
  });

  testRunner.it('应正确统计各类型效果数量', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.WEAK, 2, 2);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 2);
    const stats = statusEffects.getStats();
    testRunner.expect(stats.effectsByType[STATUS_TYPES.STRENGTH]).toBe(1);
    testRunner.expect(stats.effectsByType[STATUS_TYPES.WEAK]).toBe(2);
  });
});

testRunner.describe('clearAll()', () => {
  testRunner.it('应清除所有状态效果', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.POISON, 3, 3);
    statusEffects.clearAll();
    testRunner.expect(statusEffects.getStats().totalEffects).toBe(0);
  });
});

// ===== 集成测试 =====

testRunner.describe('完整战斗流程集成测试', () => {
  testRunner.it('应完整处理多回合状态效果', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 3, 2);
    statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 2);

    // 回合1: 中毒从2变1（不触发伤害）
    const turn1Result = statusEffects.processTurnStart('player1');
    const damage1 = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(turn1Result.effects.length).toBe(0); // 中毒还没触发
    testRunner.expect(damage1.finalDamage).toBe(11); // (10+5) * 0.75 = 11

    // 回合2: 中毒从1变0（触发伤害）
    const turn2Result = statusEffects.processTurnStart('player1');
    const damage2 = statusEffects.calculateDamage(10, 'player1', 'enemy1');
    testRunner.expect(turn2Result.effects.length).toBeGreaterThan(0);
    const poisonEffect = turn2Result.effects.find(e => e.type === 'damage');
    testRunner.expect(poisonEffect.value).toBe(3);
    testRunner.expect(statusEffects.getStatusValue('player1', STATUS_TYPES.POISON)).toBe(0); // 中毒已移除

    // 回合3: 没有中毒了
    const turn3Result = statusEffects.processTurnStart('player1');
    testRunner.expect(turn3Result.effects.length).toBe(0);
  });

  testRunner.it('应正确处理中毒和再生同时存在', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 1);
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 1);
    const result = statusEffects.processTurnStart('player1');
    testRunner.expect(result.effects.length).toBe(2);
    const damageEffect = result.effects.find(e => e.type === 'damage');
    const healEffect = result.effects.find(e => e.type === 'heal');
    testRunner.expect(damageEffect.value).toBe(5);
    testRunner.expect(healEffect.value).toBe(3);
  });

  testRunner.it('长时间战斗应正确处理所有状态', () => {
    const statusEffects = new StatusEffects();
    // 使用更长的持续时间确保力量不会立即消失
    for (let i = 0; i < 5; i++) {
      statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 2, 10); // 持续10回合
    }
    statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 5, 3);

    for (let turn = 1; turn <= 5; turn++) {
      const result = statusEffects.processTurnStart('player1');
      // 前3回合应该有再生效果（duration 3->2->1->0）
      if (turn === 3) {
        // 第3回合再生触发（duration变为0）
        testRunner.expect(result.effects.some(e => e.type === 'heal')).toBeTruthy();
      }
      const damage = statusEffects.calculateDamage(10, 'player1', 'enemy1');
      // 验证力量加成存在（10 + 10 = 20）
      testRunner.expect(damage.finalDamage).toBeGreaterThan(10);
    }
  });
});

// ===== 性能测试 =====

testRunner.describe('性能测试', () => {
  testRunner.it('施加状态效果应快速执行', () => {
    const statusEffects = new StatusEffects();
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      statusEffects.applyStatus(`perf_player_${i}`, STATUS_TYPES.STRENGTH, 5, 3);
    }
    const end = performance.now();
    const avgTime = (end - start) / 1000;
    testRunner.expect(avgTime).toBeLessThan(5);
  });

  testRunner.it('伤害计算应快速执行', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('perf_attacker', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('perf_defender', STATUS_TYPES.WEAK, 1, 3);
    statusEffects.applyStatus('perf_defender', STATUS_TYPES.VULNERABLE, 1, 3);

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      statusEffects.calculateDamage(10, 'perf_attacker', 'perf_defender');
    }
    const end = performance.now();
    const avgTime = (end - start) / 10000;
    testRunner.expect(avgTime).toBeLessThan(1);
  });

  testRunner.it('回合处理应快速执行', () => {
    const statusEffects = new StatusEffects();
    statusEffects.applyStatus('perf_player', STATUS_TYPES.STRENGTH, 5, 3);
    statusEffects.applyStatus('perf_player', STATUS_TYPES.POISON, 3, 3);
    statusEffects.applyStatus('perf_player', STATUS_TYPES.REGEN, 2, 3);
    statusEffects.applyStatus('perf_player', STATUS_TYPES.WEAK, 1, 3);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      statusEffects.processTurnStart('perf_player');
    }
    const end = performance.now();
    const avgTime = (end - start) / 1000;
    testRunner.expect(avgTime).toBeLessThan(2);
  });
});

// ===== 运行测试总结 =====

console.log('\n🚀 开始执行所有测试...\n');

// 显示测试结果
const allTestsPassed = testRunner.summary();

console.log('\n🎯 测试总结:');
console.log(`总体结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 存在失败的测试'}`);
console.log('\n📋 测试覆盖范围:');
console.log('- ✅ 状态效果施加（所有状态类型）');
console.log('- ✅ 状态效果堆叠和持续时间设置');
console.log('- ✅ 参数验证（无效类型、负值等）');
console.log('- ✅ 状态效果移除（手动移除、自动移除）');
console.log('- ✅ 回合开始处理（中毒/再生伤害）');
console.log('- ✅ 回合结束处理');
console.log('- ✅ 伤害计算（力量/虚弱/易伤）');
console.log('- ✅ 状态组合计算');
console.log('- ✅ 护甲计算（敏捷加成）');
console.log('- ✅ 辅助方法（getStatusValue、getAllStatuses等）');
console.log('- ✅ 完整战斗流程集成测试');
console.log('- ✅ 性能测试');

if (allTestsPassed) {
  console.log('\n🎉 StatusEffects 测试套件全部通过！系统已准备好投入生产环境。');
} else {
  console.log('\n⚠️  部分测试失败，请修复问题后重新运行测试。');
}
