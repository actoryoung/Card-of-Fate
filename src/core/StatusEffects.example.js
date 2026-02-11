/**
 * StatusEffects 系统使用示例
 * 展示如何在游戏中使用状态效果系统
 */

import statusEffects, { STATUS_TYPES } from './StatusEffects.js';

// 示例：在战斗中使用状态效果
function battleExample() {
  console.log('=== 战斗状态效果示例 ===\n');

  // 1. 初始化战斗参与者
  const player = 'player';
  const enemy = 'enemy';

  // 2. 玩家使用"力量打击"卡牌
  console.log('玩家使用"力量打击"！获得力量3点，持续2回合');
  statusEffects.applyStatus(player, STATUS_TYPES.STRENGTH, 3, 2, { source: 'card_strength_strike' });

  // 3. 玩家使用"毒刃"卡牌
  console.log('玩家使用"毒刃"！敌人获得中毒5点，持续3回合');
  statusEffects.applyStatus(enemy, STATUS_TYPES.POISON, 5, 3, { source: 'card_poison_dagger' });

  // 4. 玩家使用"守护祝福"卡牌
  console.log('玩家使用"守护祝福"！获得敏捷2点，持续1回合');
  statusEffects.applyStatus(player, STATUS_TYPES.DEXTERITY, 2, 1, { source: 'card_guardian_blessing' });

  // 5. 敌人使用虚弱攻击
  console.log('敌人使用虚弱攻击！玩家获得虚弱1点，持续2回合');
  statusEffects.applyStatus(player, STATUS_TYPES.WEAK, 1, 2, { source: 'enemy_weak_attack' });

  // 6. 显示当前状态
  console.log('\n=== 当前状态效果 ===');
  console.log(`玩家状态:`);
  console.log(`  - 力量: ${statusEffects.getStatusValue(player, STATUS_TYPES.STRENGTH)}`);
  console.log(`  - 敏捷: ${statusEffects.getStatusValue(player, STATUS_TYPES.DEXTERITY)}`);
  console.log(`  - 虚弱: ${statusEffects.getStatusValue(player, STATUS_TYPES.WEAK)}`);

  console.log(`\n敌人状态:`);
  console.log(`  - 中毒: ${statusEffects.getStatusValue(enemy, STATUS_TYPES.POISON)}`);

  // 7. 回合开始
  console.log('\n=== 回合开始 ===');
  const playerResult = statusEffects.processTurnStart(player);
  console.log(`玩家回合开始处理:`);
  playerResult.statuses.forEach(s => {
    console.log(`  - ${s.config.name}: ${s.value} (剩余 ${s.remaining} 回合)`);
  });

  const enemyResult = statusEffects.processTurnStart(enemy);
  console.log(`\n敌人回合开始处理:`);
  enemyResult.statuses.forEach(s => {
    console.log(`  - ${s.config.name}: ${s.value} (剩余 ${s.remaining} 回合)`);
  });

  // 8. 玩家攻击
  console.log('\n=== 玩家攻击 ===');
  const baseDamage = 10;
  const damageResult = statusEffects.calculateDamage(baseDamage, player, enemy);
  console.log(`基础伤害: ${baseDamage}`);
  console.log(`最终伤害: ${damageResult.finalDamage}`);
  console.log(`伤害计算: ${damageResult.damageCalculation}`);
  console.log(`力量加成: +${damageResult.strength}`);
  console.log(`敌人虚弱: -${damageResult.weak * 25}%伤害`);
  console.log(`敌人易伤: +${damageResult.vulnerable * 50}%伤害`);

  // 9. 玩家获得护甲
  console.log('\n=== 玩家获得护甲 ===');
  const armorResult = statusEffects.calculateArmor(player, 5);
  console.log(`基础护甲: ${armorResult.baseArmor}`);
  console.log(`最终护甲: ${armorResult.finalArmor}`);
  console.log(`敏捷加成: +${armorResult.bonus}`);

  // 10. 显示统计
  console.log('\n=== 状态效果统计 ===');
  const stats = statusEffects.getStats();
  console.log(`总目标数: ${stats.totalTargets}`);
  console.log(`总状态数: ${stats.totalEffects}`);
  console.log(`\n各类型状态数:`);
  for (const [type, count] of Object.entries(stats.effectsByType)) {
    if (count > 0) {
      console.log(`  - ${statusEffects.config[type].name}: ${count}`);
    }
  }

  // 11. 清理
  console.log('\n=== 战斗结束，清理状态 ===');
  statusEffects.clearAll();
  console.log('所有状态效果已清除');
}

// 示例2：状态效果优先级和叠加
function stackingExample() {
  console.log('\n=== 状态效果叠加示例 ===\n');

  const target = 'character';

  // 叠加多个力量效果
  console.log('连续使用多个力量卡牌...');
  statusEffects.applyStatus(target, STATUS_TYPES.STRENGTH, 2, 1);
  statusEffects.applyStatus(target, STATUS_TYPES.STRENGTH, 3, 2);
  statusEffects.applyStatus(target, STATUS_TYPES.STRENGTH, 1, 3);

  console.log(`当前力量值: ${statusEffects.getStatusValue(target, STATUS_TYPES.STRENGTH)}`);

  // 叠加多个中毒效果
  console.log('\n连续使用多个毒药...');
  statusEffects.applyStatus(target, STATUS_TYPES.POISON, 3, 2);
  statusEffects.applyStatus(target, STATUS_TYPES.POISON, 5, 1);

  console.log(`当前中毒值: ${statusEffects.getStatusValue(target, STATUS_TYPES.POISON)}`);

  // 显示所有状态
  console.log('\n所有当前状态:');
  const allStatuses = statusEffects.getAllStatuses(target);
  allStatuses.forEach(effect => {
    console.log(`  - ${statusEffects.config[effect.type].name}: ${effect.value} (持续 ${effect.duration} 回合)`);
  });

  // 清理
  statusEffects.clearAll();
}

// 示例3：错误处理
function errorHandlingExample() {
  console.log('\n=== 错误处理示例 ===\n');

  // 尝试应用无效的状态类型
  const result = statusEffects.applyStatus('test', 'invalid_type', 1, 1);
  console.log('尝试应用无效状态类型:', result ? '成功' : '失败');

  // 尝试获取不存在目标的值
  const value = statusEffects.getStatusValue('nonexistent', STATUS_TYPES.STRENGTH);
  console.log('不存在目标的值:', value);

  // 尝试移除不存在目标的
  const removed = statusEffects.removeStatus('nonexistent', STATUS_TYPES.STRENGTH);
  console.log('移除不存在目标的状态:', removed ? '成功' : '失败');

  // 清理
  statusEffects.clearAll();
}

// 运行所有示例
if (typeof window === 'undefined') { // Node.js 环境
  battleExample();
  stackingExample();
  errorHandlingExample();
} else { // 浏览器环境
  window.StatusEffectsExamples = {
    battleExample,
    stackingExample,
    errorHandlingExample
  };
  console.log('StatusEffects 示例已加载到 window.StatusEffectsExamples');
}