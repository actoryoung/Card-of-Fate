/**
 * 状态效果系统模块
 * 管理游戏中所有状态效果的施加、移除、更新和计算
 */

// 状态效果类型常量
export const STATUS_TYPES = {
  STRENGTH: 'strength',      // 力量 - 增加攻击伤害
  WEAK: 'weak',              // 虚弱 - 减少25%攻击伤害
  VULNERABLE: 'vulnerable',  // 易伤 - 增加50%受到的伤害
  POISON: 'poison',          // 中毒 - 每回合扣血
  REGEN: 'regen',            // 再生 - 每回合回血
  DEXTERITY: 'dexterity',    // 敏捷 - 增加护甲获取
  FOCUS: 'focus'             // 集中力 - 充能球相关（预留）
};

// 状态效果配置
const STATUS_CONFIG = {
  [STATUS_TYPES.STRENGTH]: {
    name: '力量',
    description: '增加攻击伤害',
    duration: 1,
    stackable: true,
    maxStack: 999
  },
  [STATUS_TYPES.WEAK]: {
    name: '虚弱',
    description: '减少25%攻击伤害',
    duration: 1,
    stackable: true,
    maxStack: 999
  },
  [STATUS_TYPES.VULNERABLE]: {
    name: '易伤',
    description: '增加50%受到的伤害',
    duration: 1,
    stackable: true,
    maxStack: 999
  },
  [STATUS_TYPES.POISON]: {
    name: '中毒',
    description: '每回合扣血',
    duration: 3,
    stackable: true,
    maxStack: 999
  },
  [STATUS_TYPES.REGEN]: {
    name: '再生',
    description: '每回合回血',
    duration: 3,
    stackable: true,
    maxStack: 999
  },
  [STATUS_TYPES.DEXTERITY]: {
    name: '敏捷',
    description: '增加护甲获取',
    duration: 1,
    stackable: true,
    maxStack: 999
  },
  [STATUS_TYPES.FOCUS]: {
    name: '集中力',
    description: '充能球相关（预留）',
    duration: 1,
    stackable: true,
    maxStack: 999
  }
};

// 错误代码
export const ERROR_CODES = {
  INVALID_STATUS_TYPE: 'ERR_INVALID_STATUS_TYPE',
  TARGET_NOT_FOUND: 'ERR_TARGET_NOT_FOUND',
  INVALID_VALUE: 'ERR_INVALID_VALUE',
  INVALID_DURATION: 'ERR_INVALID_DURATION'
};

class StatusEffects {
  /**
   * 构造函数
   */
  constructor() {
    // 存储所有目标的状态效果
    this.targets = new Map();

    // 配置
    this.config = STATUS_CONFIG;
  }

  /**
   * 应用状态效果
   * @param {string|number} targetId - 目标ID
   * @param {string} statusType - 状态效果类型
   * @param {number} value - 效果值
   * @param {number} duration - 持续回合数
   * @param {Object} options - 额外选项
   * @returns {boolean} 是否成功应用
   */
  applyStatus(targetId, statusType, value = 1, duration = 1, options = {}) {
    // 参数验证
    if (!this.config[statusType]) {
      console.error(`[StatusEffects] 无效的状态效果类型: ${statusType}`, ERROR_CODES.INVALID_STATUS_TYPE);
      return false;
    }

    if (typeof value !== 'number' || value < 0) {
      console.error(`[StatusEffects] 无效的效果值: ${value}`, ERROR_CODES.INVALID_VALUE);
      return false;
    }

    if (typeof duration !== 'number' || duration <= 0) {
      console.error(`[StatusEffects] 无效的持续时间: ${duration}`, ERROR_CODES.INVALID_DURATION);
      return false;
    }

    // 初始化目标的状态效果数组
    if (!this.targets.has(targetId)) {
      this.targets.set(targetId, []);
    }

    const targetEffects = this.targets.get(targetId);
    const config = this.config[statusType];

    // 检查是否已存在相同状态
    const existingEffect = targetEffects.find(effect => effect.type === statusType);

    if (existingEffect) {
      // 如果是可堆叠的效果
      if (config.stackable) {
        const currentStacks = existingEffect.value || 1;
        const maxStacks = config.maxStack;

        if (currentStacks < maxStacks) {
          existingEffect.value += value;
          existingEffect.duration = duration; // 刷新持续时间
          existingEffect.source = options.source || 'unknown';
          existingEffect.id = options.id || Date.now();
        } else {
          console.log(`[StatusEffects] 状态效果 ${statusType} 已达到最大层数 ${maxStacks}`);
        }
      } else {
        // 不可堆叠，替换效果
        existingEffect.value = value;
        existingEffect.duration = duration;
        existingEffect.source = options.source || 'unknown';
        existingEffect.id = options.id || Date.now();
      }
    } else {
      // 添加新状态
      targetEffects.push({
        type: statusType,
        value,
        duration,
        source: options.source || 'unknown',
        id: options.id || Date.now(),
        created: Date.now()
      });
    }

    console.log(`[StatusEffects] 应用状态效果: ${config.name} (值: ${value}, 持续: ${duration}) 到目标 ${targetId}`);
    return true;
  }

  /**
   * 移除状态效果
   * @param {string|number} targetId - 目标ID
   * @param {string} statusType - 状态效果类型
   * @returns {boolean} 是否成功移除
   */
  removeStatus(targetId, statusType) {
    if (!this.targets.has(targetId)) {
      console.warn(`[StatusEffects] 目标 ${targetId} 不存在`);
      return false;
    }

    const targetEffects = this.targets.get(targetId);
    const initialLength = targetEffects.length;

    // 过滤掉指定状态
    targetEffects.splice(0, targetEffects.length, ...targetEffects.filter(effect => effect.type !== statusType));

    const wasRemoved = targetEffects.length < initialLength;

    if (wasRemoved) {
      console.log(`[StatusEffects] 移除目标 ${targetId} 的状态效果: ${this.config[statusType]?.name || statusType}`);

      // 如果目标没有状态效果了，清理目标记录
      if (targetEffects.length === 0) {
        this.targets.delete(targetId);
      }
    }

    return wasRemoved;
  }

  /**
   * 获取指定状态效果的数量
   * @param {string|number} targetId - 目标ID
   * @param {string} statusType - 状态效果类型
   * @returns {number} 状态效果数量
   */
  getStatusValue(targetId, statusType) {
    if (!this.targets.has(targetId)) {
      return 0;
    }

    const targetEffects = this.targets.get(targetId);
    const effects = targetEffects.filter(effect => effect.type === statusType);

    if (effects.length === 0) {
      return 0;
    }

    // 返回堆叠的总值
    return effects.reduce((total, effect) => total + effect.value, 0);
  }

  /**
   * 获取目标的所有状态效果
   * @param {string|number} targetId - 目标ID
   * @returns {Array} 状态效果数组
   */
  getAllStatuses(targetId) {
    if (!this.targets.has(targetId)) {
      return [];
    }

    return [...this.targets.get(targetId)];
  }

  /**
   * 回合开始处理
   * @param {string|number} targetId - 目标ID
   * @returns {Object} 处理结果
   */
  processTurnStart(targetId) {
    const result = {
      statuses: [],
      effects: []
    };

    if (!this.targets.has(targetId)) {
      return result;
    }

    const targetEffects = this.targets.get(targetId);
    const effectsToProcess = [...targetEffects];
    const effectsToRemove = [];

    for (const effect of effectsToProcess) {
      const config = this.config[effect.type];

      // 减少持续时间
      effect.duration--;

      // 处理持续效果
      if (effect.duration === 0) {
        // 到达持续时间，移除效果
        effectsToRemove.push(effect);
      }

      // 记录效果信息
      result.statuses.push({
        type: effect.type,
        value: effect.value,
        remaining: effect.duration,
        config: config
      });
    }

    // 移除过期的效果
    for (const effect of effectsToRemove) {
      const index = targetEffects.indexOf(effect);
      if (index > -1) {
        targetEffects.splice(index, 1);

        // 处理特殊效果
        if (effect.type === STATUS_TYPES.POISON) {
          result.effects.push({
            type: 'damage',
            value: effect.value,
            message: `受到中毒伤害 ${effect.value}`
          });
        } else if (effect.type === STATUS_TYPES.REGEN) {
          result.effects.push({
            type: 'heal',
            value: effect.value,
            message: `恢复生命 ${effect.value}`
          });
        }
      }
    }

    // 如果没有效果了，清理目标记录
    if (targetEffects.length === 0) {
      this.targets.delete(targetId);
    }

    return result;
  }

  /**
   * 回合结束处理
   * @param {string|number} targetId - 目标ID
   * @returns {Object} 处理结果
   */
  processTurnEnd(targetId) {
    const result = {
      statuses: [],
      effects: []
    };

    // 回合结束时处理特殊效果
    if (this.targets.has(targetId)) {
      const targetEffects = this.targets.get(targetId);

      for (const effect of targetEffects) {
        const config = this.config[effect.type];

        // 某些效果在回合结束时可能触发
        if (effect.type === STATUS_TYPES.STRENGTH) {
          // 力量效果在回合结束时保持不变
          result.statuses.push({
            type: effect.type,
            value: effect.value,
            message: '力量效果持续生效'
          });
        }
      }
    }

    return result;
  }

  /**
   * 计算伤害（考虑状态效果）
   * @param {number} baseDamage - 基础伤害
   * @param {string|number} attackerId - 攻击者ID
   * @param {string|number} defenderId - 防御者ID
   * @returns {Object} 伤害计算结果
   */
  calculateDamage(baseDamage, attackerId, defenderId) {
    let damage = baseDamage;
    let message = '';

    // 计算攻击者的力量加成
    const strengthValue = this.getStatusValue(attackerId, STATUS_TYPES.STRENGTH);
    if (strengthValue > 0) {
      damage += strengthValue;
      message += `力量加成 +${strengthValue}`;
    }

    // 计算防御者的状态减益
    const weakValue = this.getStatusValue(defenderId, STATUS_TYPES.WEAK);
    if (weakValue > 0) {
      const originalDamage = damage;
      damage = Math.floor(damage * 0.75);
      const reduction = originalDamage - damage;
      if (message) message += ', ';
      message += `虚弱减少 ${reduction} 点伤害`;
    }

    const vulnerableValue = this.getStatusValue(defenderId, STATUS_TYPES.VULNERABLE);
    if (vulnerableValue > 0) {
      const originalDamage = damage;
      damage = Math.floor(damage * 1.5);
      const increase = damage - originalDamage;
      if (message) message += ', ';
      message += `易伤增加 ${increase} 点伤害`;
    }

    // 确保伤害至少为1（除非是0伤害）
    damage = Math.max(0, damage);

    return {
      baseDamage,
      finalDamage: damage,
      damageCalculation: message || '无状态效果',
      strength: strengthValue,
      weak: weakValue,
      vulnerable: vulnerableValue
    };
  }

  /**
   * 计算护甲获取
   * @param {string|number} targetId - 目标ID
   * @param {number} baseArmor - 基础护甲
   * @returns {number} 最终护甲值
   */
  calculateArmor(targetId, baseArmor) {
    const dexterityValue = this.getStatusValue(targetId, STATUS_TYPES.DEXTERITY);
    let finalArmor = baseArmor;

    if (dexterityValue > 0) {
      finalArmor += dexterityValue;
    }

    return {
      baseArmor,
      finalArmor,
      bonus: dexterityValue
    };
  }

  /**
   * 清除所有状态效果
   */
  clearAll() {
    this.targets.clear();
    console.log('[StatusEffects] 已清除所有状态效果');
  }

  /**
   * 获取状态效果统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      totalTargets: this.targets.size,
      totalEffects: 0,
      effectsByType: {},
      targetsById: {}
    };

    // 统计各类型效果数量
    for (const effectType of Object.keys(this.config)) {
      stats.effectsByType[effectType] = 0;
    }

    // 遍历所有目标
    for (const [targetId, effects] of this.targets) {
      stats.targetsById[targetId] = effects.length;
      stats.totalEffects += effects.length;

      // 统计各类型效果
      for (const effect of effects) {
        stats.effectsByType[effect.type] = (stats.effectsByType[effect.type] || 0) + 1;
      }
    }

    return stats;
  }
}

// 创建单例实例
const statusEffects = new StatusEffects();

export default statusEffects;
export { StatusEffects };