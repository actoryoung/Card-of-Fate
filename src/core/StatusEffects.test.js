/**
 * StatusEffects 系统测试文件
 */

import statusEffects, { STATUS_TYPES } from './StatusEffects.js';

// 测试工具函数
function test(description, testFn) {
  try {
    testFn();
    console.log(`✓ ${description}`);
  } catch (error) {
    console.error(`✗ ${description}: ${error.message}`);
  }
}

// 测试集
console.log('=== StatusEffects 系统测试 ===\n');

// 测试1: 应用状态效果
test('应用力量状态', () => {
  statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 2);
  const strength = statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH);
  if (strength !== 5) {
    throw new Error(`预期力量值为5，实际为${strength}`);
  }
});

// 测试2: 应用堆叠效果
test('力量状态堆叠', () => {
  statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 3, 1);
  const strength = statusEffects.getStatusValue('player1', STATUS_TYPES.STRENGTH);
  if (strength !== 8) {
    throw new Error(`预期力量值为8（5+3），实际为${strength}`);
  }
});

// 测试3: 应用虚弱状态
test('应用虚弱状态', () => {
  statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
  const weak = statusEffects.getStatusValue('enemy1', STATUS_TYPES.WEAK);
  if (weak !== 1) {
    throw new Error(`预期虚弱值为1，实际为${weak}`);
  }
});

// 测试4: 应用易伤状态
test('应用易伤状态', () => {
  statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 2);
  const vulnerable = statusEffects.getStatusValue('enemy1', STATUS_TYPES.VULNERABLE);
  if (vulnerable !== 1) {
    throw new Error(`预期易伤值为1，实际为${vulnerable}`);
  }
});

// 测试5: 应用中毒状态
test('应用中毒状态', () => {
  statusEffects.applyStatus('player1', STATUS_TYPES.POISON, 5, 3);
  const poison = statusEffects.getStatusValue('player1', STATUS_TYPES.POISON);
  if (poison !== 5) {
    throw new Error(`预期中毒值为5，实际为${poison}`);
  }
});

// 测试6: 应用再生状态
test('应用再生状态', () => {
  statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 2);
  const regen = statusEffects.getStatusValue('player1', STATUS_TYPES.REGEN);
  if (regen !== 3) {
    throw new Error(`预期再生值为3，实际为${regen}`);
  }
});

// 测试7: 回合开始处理
test('回合开始处理状态效果', () => {
  const result = statusEffects.processTurnStart('player1');
  if (!result.statuses || result.statuses.length === 0) {
    throw new Error('回合开始处理未返回状态信息');
  }
  console.log('  回合开始处理结果:', result.statuses.map(s => ({
    type: s.type,
    value: s.value,
    remaining: s.remaining
  })));
});

// 测试8: 伤害计算
test('计算伤害（考虑状态效果）', () => {
  // 重置并重新应用状态，避免回合开始的影响
  statusEffects.clearAll();

  // 给玩家施加力量，给敌人施加虚弱和易伤
  statusEffects.applyStatus('player1', STATUS_TYPES.STRENGTH, 5, 3);
  statusEffects.applyStatus('enemy1', STATUS_TYPES.WEAK, 1, 3);
  statusEffects.applyStatus('enemy1', STATUS_TYPES.VULNERABLE, 1, 3);

  const damage1 = statusEffects.calculateDamage(10, 'player1', 'enemy1');
  console.log('  伤害计算结果:', damage1);

  // 验证基础计算：10 + 5 (力量) = 15
  // 虚弱减少25%: 15 * 0.75 = 11.25 -> 11
  // 易伤增加50%: 11 * 1.5 = 16.5 -> 16
  if (damage1.finalDamage !== 16) {
    throw new Error(`预期伤害值为16，实际为${damage1.finalDamage}`);
  }
});

// 测试9: 移除状态效果
test('移除状态效果', () => {
  statusEffects.removeStatus('player1', STATUS_TYPES.REGEN);
  const regen = statusEffects.getStatusValue('player1', STATUS_TYPES.REGEN);
  if (regen !== 0) {
    throw new Error(`移除再生状态后值应为0，实际为${regen}`);
  }
});

// 测试10: 获取所有状态
test('获取目标的所有状态效果', () => {
  const allStatuses = statusEffects.getAllStatuses('player1');
  if (allStatuses.length === 0) {
    throw new Error('玩家应该还有状态效果');
  }
  console.log('  玩家所有状态:', allStatuses.map(s => ({
    type: s.type,
    value: s.value,
    duration: s.duration
  })));
});

// 测试11: 护甲计算
test('计算护甲获取（考虑敏捷）', () => {
  statusEffects.applyStatus('player1', STATUS_TYPES.DEXTERITY, 5, 1);
  const armor = statusEffects.calculateArmor('player1', 10);
  if (armor.finalArmor !== 15) {
    throw new Error(`预期护甲值为15（10+5），实际为${armor.finalArmor}`);
  }
  console.log('  护甲计算结果:', armor);
});

// 测试12: 错误处理
test('处理无效的状态类型', () => {
  const result = statusEffects.applyStatus('player1', 'invalid_status', 1, 1);
  if (result) {
    throw new Error('应该返回false表示应用失败');
  }
});

// 测试13: 统计信息
test('获取状态效果统计', () => {
  const stats = statusEffects.getStats();
  console.log('  状态效果统计:', stats);

  if (typeof stats.totalTargets !== 'number' || stats.totalEffects < 0) {
    throw new Error('统计信息格式错误');
  }
});

// 测试14: 再次测试移除状态效果（确保修复）
test('移除状态效果（再次测试）', () => {
  statusEffects.clearAll();

  // 重新应用测试数据
  statusEffects.applyStatus('player1', STATUS_TYPES.REGEN, 3, 2);

  // 移除再生状态
  statusEffects.removeStatus('player1', STATUS_TYPES.REGEN);
  const regen = statusEffects.getStatusValue('player1', STATUS_TYPES.REGEN);

  if (regen !== 0) {
    throw new Error(`移除再生状态后值应为0，实际为${regen}`);
  }
});

// 测试14: 清除所有状态
test('清除所有状态效果', () => {
  statusEffects.clearAll();
  const stats = statusEffects.getStats();
  if (stats.totalEffects > 0) {
    throw new Error(`清除后应该没有状态效果，实际还有${stats.totalEffects}个`);
  }
});

// 测试15: 移除最后一个测试
test('清除所有状态效果（最终清理）', () => {
  statusEffects.clearAll();
  const stats = statusEffects.getStats();
  if (stats.totalEffects > 0) {
    throw new Error(`清除后应该没有状态效果，实际还有${stats.totalEffects}个`);
  }
});

console.log('\n=== 所有测试完成 ===');