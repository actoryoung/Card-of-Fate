/**
 * IntentSystem - 敌人意图系统
 *
 * 负责敌人意图的生成、存储、显示和验证
 * 确保敌人预告的意图与实际行为保持一致
 *
 * @class
 */

// 意图类型常量
const INTENT_TYPES = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  HEAL: 'heal',
  SPECIAL: 'special',
  UNKNOWN: 'unknown',
  // 扩展类型
  ATTACK_MULTI: 'attack_multi',
  ATTACK_ALL: 'attack_all',
  DEFEND_BREAK: 'defend_break'
};

// 默认意图图标映射
const DEFAULT_INTENT_ICONS = {
  attack: '⚔️',
  defend: '🛡️',
  buff: '💪',
  debuff: '💀',
  heal: '💚',
  special: '⭐',
  unknown: '❓',
  attack_multi: '⚔️⚔️',
  attack_all: '💥',
  defend_break: '💔'
};

// 意图颜色映射
const INTENT_COLORS = {
  attack: '#e74c3c',
  defend: '#3498db',
  buff: '#27ae60',
  debuff: '#9b59b6',
  heal: '#2ecc71',
  special: '#f39c12',
  unknown: '#95a5a6',
  attack_multi: '#e74c3c',
  attack_all: '#e74c3c',
  defend_break: '#e67e22'
};

// 状态效果名称映射
const EFFECT_NAMES = {
  weak: '虚弱',
  vulnerable: '易伤',
  strength: '力量',
  poison: '中毒',
  burn: '燃烧',
  regen: '再生',
  fractal: '分裂',
  confusion: '混乱'
};

// 错误代码常量
const ERROR_CODES = {
  INVALID_ENEMY: 'ERR_INTENT_INVALID_ENEMY',
  NO_ATTACKS: 'ERR_INTENT_NO_ATTACKS',
  TYPE_MISMATCH: 'ERR_INTENT_TYPE_MISMATCH',
  ICON_NOT_FOUND: 'ERR_INTENT_ICON_NOT_FOUND'
};

/**
 * IntentSystem 类
 */
export class IntentSystem {
  /**
   * 构造函数
   */
  constructor() {
    // 私有属性
    this._currentIntents = new Map();    // 当前所有敌人的意图
    this._intentHistory = new Map();     // 意图历史记录
    this._iconRegistry = new Map(Object.entries(DEFAULT_INTENT_ICONS));
    this._bossStages = new Map();        // 多阶段Boss配置
    this._lastKnownPhase = new Map();    // 上一次已知的Boss阶段

    console.log('[IntentSystem] 意图系统初始化完成');
  }

  /**
   * 生成敌人意图
   * @param {Object} enemy - 敌人对象
   * @param {Object} context - 游戏上下文
   * @returns {Object} 生成的意图对象
   */
  generateIntent(enemy, context = {}) {
    // 验证敌人对象
    if (!enemy || !enemy.id) {
      console.error('[IntentSystem]', ERROR_CODES.INVALID_ENEMY, '无效的敌人对象');
      return { type: INTENT_TYPES.UNKNOWN, value: 0 };
    }

    if (!Array.isArray(enemy.attacks) || enemy.attacks.length === 0) {
      console.warn(`[IntentSystem] 敌人 ${enemy.id} 无可用攻击模式`);
      return { type: INTENT_TYPES.UNKNOWN, value: 0 };
    }

    let intent;

    // 检查Boss特殊阶段
    if (enemy.isBoss && enemy.phases && enemy.phases.length > 0) {
      intent = this._generateBossIntent(enemy, context);
    } else {
      // 普通敌人意图生成
      intent = this._generateNormalIntent(enemy, context);
    }

    // 存储意图
    this._currentIntents.set(enemy.id, intent);

    // 记录意图历史
    this._addToHistory(enemy.id, intent);

    console.log(`[IntentSystem] 敌人 ${enemy.id} 生成意图:`, intent.type, intent.value);

    return intent;
  }

  /**
   * 生成普通敌人意图
   * @private
   * @param {Object} enemy - 敌人对象
   * @param {Object} context - 游戏上下文
   * @returns {Object} 意图对象
   */
  _generateNormalIntent(enemy, context) {
    // 检查条件性攻击（如低血量）
    const conditionalAttacks = enemy.attacks.filter(attack => {
      if (typeof attack.condition === 'function') {
        return attack.condition(enemy, context);
      }
      return false;
    });

    let availableAttacks;
    if (conditionalAttacks.length > 0) {
      availableAttacks = conditionalAttacks;
    } else {
      availableAttacks = enemy.attacks;
    }

    // 根据权重随机选择攻击模式
    const selectedAttack = this._selectByWeight(availableAttacks);

    return {
      type: selectedAttack.type,
      value: selectedAttack.value,
      count: selectedAttack.count,
      displayText: selectedAttack.intent,
      priority: selectedAttack.priority || 0
    };
  }

  /**
   * 生成Boss意图
   * @private
   * @param {Object} enemy - Boss对象
   * @param {Object} context - 游戏上下文
   * @returns {Object} 意图对象
   */
  _generateBossIntent(enemy, context) {
    const currentPhase = this._getCurrentPhase(enemy);
    const lastPhase = this._lastKnownPhase.get(enemy.id) || 1;

    // 检查阶段是否切换
    if (currentPhase !== lastPhase) {
      this._lastKnownPhase.set(enemy.id, currentPhase);

      // 检查是否需要显示未知意图
      const phaseData = enemy.phases[currentPhase - 1];
      if (phaseData && phaseData.showUnknown) {
        console.log(`[IntentSystem] Boss ${enemy.id} 切换到阶段 ${currentPhase}，显示未知意图`);
        return { type: INTENT_TYPES.UNKNOWN, value: 0 };
      }
    }

    // 获取当前阶段的攻击模式
    const phaseData = enemy.phases[currentPhase - 1];
    if (!phaseData || !phaseData.attacks || phaseData.attacks.length === 0) {
      console.warn(`[IntentSystem] Boss ${enemy.id} 阶段 ${currentPhase} 无攻击模式`);
      return { type: INTENT_TYPES.UNKNOWN, value: 0 };
    }

    // 从当前阶段的攻击中选择
    const selectedAttack = this._selectByWeight(phaseData.attacks);

    return {
      type: selectedAttack.type,
      value: selectedAttack.value,
      count: selectedAttack.count,
      displayText: selectedAttack.intent,
      priority: selectedAttack.priority || 0
    };
  }

  /**
   * 获取Boss当前阶段
   * @private
   * @param {Object} enemy - Boss对象
   * @returns {number} 当前阶段编号
   */
  _getCurrentPhase(enemy) {
    if (!enemy.phases || enemy.phases.length === 0) {
      return 1;
    }

    const hpPercent = enemy.hp / enemy.maxHp;

    // 从高到低检查阶段阈值
    for (let i = enemy.phases.length - 1; i >= 0; i--) {
      if (hpPercent <= enemy.phases[i].hpThreshold) {
        return enemy.phases[i].stage;
      }
    }

    return 1;
  }

  /**
   * 根据权重随机选择攻击
   * @private
   * @param {Array} attacks - 攻击模式数组
   * @returns {Object} 选中的攻击对象
   */
  _selectByWeight(attacks) {
    if (!attacks || attacks.length === 0) {
      return null;
    }

    const totalWeight = attacks.reduce((sum, attack) => {
      return sum + (attack.weight || 100);
    }, 0);

    let random = Math.random() * totalWeight;

    for (const attack of attacks) {
      random -= (attack.weight || 100);
      if (random <= 0) {
        return attack;
      }
    }

    // 保底返回第一个
    return attacks[0];
  }

  /**
   * 获取敌人当前意图
   * @param {string} enemyId - 敌人ID
   * @returns {Object|null} 意图对象，不存在返回null
   */
  getIntent(enemyId) {
    return this._currentIntents.get(enemyId) || null;
  }

  /**
   * 设置敌人意图
   * @param {string} enemyId - 敌人ID
   * @param {Object} intent - 意图对象
   */
  setIntent(enemyId, intent) {
    if (!enemyId || !intent) {
      console.warn('[IntentSystem] setIntent: 无效的参数');
      return;
    }

    this._currentIntents.set(enemyId, intent);
    this._addToHistory(enemyId, intent);

    console.log(`[IntentSystem] 设置敌人 ${enemyId} 意图:`, intent.type);
  }

  /**
   * 清除敌人意图
   * @param {string} enemyId - 敌人ID
   */
  clearIntent(enemyId) {
    const existed = this._currentIntents.has(enemyId);
    this._currentIntents.delete(enemyId);

    if (existed) {
      console.log(`[IntentSystem] 清除敌人 ${enemyId} 的意图`);
    }
  }

  /**
   * 清除所有意图
   */
  clearAllIntents() {
    const count = this._currentIntents.size;
    this._currentIntents.clear();
    console.log(`[IntentSystem] 清除了所有意图（${count}个）`);
  }

  /**
   * 验证意图与行为一致性
   * @param {Object} enemy - 执行行动的敌人
   * @param {Object} action - 实际执行的行动
   * @returns {boolean} true=一致, false=不一致
   */
  validateIntentExecution(enemy, action) {
    if (!enemy || !enemy.id) {
      console.warn('[IntentSystem]', ERROR_CODES.INVALID_ENEMY, '无效的敌人对象');
      return false;
    }

    const intent = this.getIntent(enemy.id);
    if (!intent) {
      console.warn(`[IntentSystem] 敌人 ${enemy.id} 没有意图记录`);
      return false;
    }

    // 类型匹配
    if (intent.type !== action.type) {
      console.warn(`[IntentSystem]`, ERROR_CODES.TYPE_MISMATCH,
        `意图类型 ${intent.type} 与执行类型 ${action.type} 不匹配`);
      return false;
    }

    // 数值匹配（允许小范围误差）
    if (typeof intent.value === 'number' && typeof action.value === 'number') {
      const diff = Math.abs(intent.value - action.value);
      if (diff > 1) {
        console.warn(`[IntentSystem] 意图数值 ${intent.value} 与执行数值 ${action.value} 差异过大`);
        return false;
      }
    }

    console.log(`[IntentSystem] 敌人 ${enemy.id} 意图验证通过`);
    return true;
  }

  /**
   * 获取意图图标
   * @param {string} intentType - 意图类型
   * @returns {string} 意图对应的图标
   */
  getIntentIcon(intentType) {
    const icon = this._iconRegistry.get(intentType);

    if (!icon) {
      console.warn(`[IntentSystem]`, ERROR_CODES.ICON_NOT_FOUND, `意图图标未找到: ${intentType}`);
      return DEFAULT_INTENT_ICONS.unknown;
    }

    return icon;
  }

  /**
   * 获取意图颜色
   * @param {string} intentType - 意图类型
   * @returns {string} 十六进制颜色值
   */
  getIntentColor(intentType) {
    return INTENT_COLORS[intentType] || INTENT_COLORS.unknown;
  }

  /**
   * 获取意图显示信息
   * @param {Object} intent - 意图对象
   * @returns {Object} 包含 icon、color、text 的显示信息
   */
  getIntentDisplay(intent) {
    if (!intent) {
      return {
        icon: DEFAULT_INTENT_ICONS.unknown,
        color: INTENT_COLORS.unknown,
        text: DEFAULT_INTENT_ICONS.unknown
      };
    }

    const icon = this.getIntentIcon(intent.type);
    const color = this.getIntentColor(intent.type);
    const text = this.getIntentDisplayText(intent);

    return { icon, color, text };
  }

  /**
   * 获取意图显示文本
   * @param {Object} intent - 意图对象
   * @returns {string} 格式化的显示文本
   */
  getIntentDisplayText(intent) {
    const icon = this.getIntentIcon(intent.type);

    // 自定义显示文本优先
    if (intent.displayText) {
      return `${icon} ${intent.displayText}`;
    }

    // 根据类型格式化
    switch (intent.type) {
      case INTENT_TYPES.ATTACK:
        return typeof intent.value === 'number' ? `${icon} ${intent.value}` : icon;

      case INTENT_TYPES.ATTACK_MULTI:
        return typeof intent.value === 'number' && typeof intent.count === 'number'
          ? `${icon} ${intent.value}×${intent.count}`
          : icon;

      case INTENT_TYPES.ATTACK_ALL:
        return typeof intent.value === 'number' ? `${icon} ${intent.value}` : icon;

      case INTENT_TYPES.DEFEND:
      case INTENT_TYPES.DEFEND_BREAK:
        return typeof intent.value === 'number' ? `${icon} ${intent.value}` : icon;

      case INTENT_TYPES.HEAL:
        return typeof intent.value === 'number' ? `${icon} +${intent.value}` : icon;

      case INTENT_TYPES.BUFF:
      case INTENT_TYPES.DEBUFF:
        if (intent.value && typeof intent.value === 'object') {
          const effectName = this._getEffectName(intent.value.effect);
          return effectName ? `${icon} ${effectName}` : icon;
        }
        return icon;

      case INTENT_TYPES.SPECIAL:
      case INTENT_TYPES.UNKNOWN:
      default:
        return icon;
    }
  }

  /**
   * 获取状态效果中文名称
   * @private
   * @param {string} effect - 效果类型
   * @returns {string} 中文名称
   */
  _getEffectName(effect) {
    return EFFECT_NAMES[effect] || effect || '';
  }

  /**
   * 注册自定义意图图标
   * @param {string} intentType - 意图类型
   * @param {string} icon - 图标
   */
  registerIntentIcon(intentType, icon) {
    if (!intentType || !icon) {
      console.warn('[IntentSystem] registerIntentIcon: 无效的参数');
      return;
    }

    this._iconRegistry.set(intentType, icon);
    console.log(`[IntentSystem] 注册意图图标: ${intentType} -> ${icon}`);
  }

  /**
   * 设置多阶段Boss配置
   * @param {Object} enemy - Boss对象
   * @param {Array} stages - 阶段配置数组
   */
  setBossMultiStage(enemy, stages) {
    if (!enemy || !enemy.id) {
      console.warn('[IntentSystem] setBossMultiStage: 无效的敌人对象');
      return;
    }

    if (!Array.isArray(stages) || stages.length === 0) {
      console.warn('[IntentSystem] setBossMultiStage: 阶段配置必须是非空数组');
      return;
    }

    enemy.isBoss = true;
    enemy.phases = stages;
    this._bossStages.set(enemy.id, stages);
    this._lastKnownPhase.set(enemy.id, 1);

    console.log(`[IntentSystem] 设置Boss ${enemy.id} 多阶段配置，共 ${stages.length} 个阶段`);
  }

  /**
   * 获取Boss当前阶段
   * @param {Object} enemy - Boss对象
   * @returns {number} 当前阶段编号
   */
  getBossPhase(enemy) {
    if (!enemy || !enemy.isBoss) {
      return 1;
    }

    return this._getCurrentPhase(enemy);
  }

  /**
   * 检查Boss是否刚刚切换阶段
   * @param {Object} enemy - Boss对象
   * @returns {boolean} 是否刚切换阶段
   */
  isBossPhaseChanged(enemy) {
    if (!enemy || !enemy.isBoss) {
      return false;
    }

    const currentPhase = this._getCurrentPhase(enemy);
    const lastPhase = this._lastKnownPhase.get(enemy.id) || 1;

    return currentPhase !== lastPhase;
  }

  /**
   * 获取敌人意图历史
   * @param {string} enemyId - 敌人ID
   * @returns {Array} 意图历史数组
   */
  getIntentHistory(enemyId) {
    return this._intentHistory.get(enemyId) || [];
  }

  /**
   * 清空意图历史
   * @param {string} enemyId - 敌人ID，不传则清空所有
   */
  clearIntentHistory(enemyId = null) {
    if (enemyId) {
      this._intentHistory.delete(enemyId);
      console.log(`[IntentSystem] 清空敌人 ${enemyId} 的意图历史`);
    } else {
      this._intentHistory.clear();
      console.log('[IntentSystem] 清空所有意图历史');
    }
  }

  /**
   * 添加意图到历史记录
   * @private
   * @param {string} enemyId - 敌人ID
   * @param {Object} intent - 意图对象
   */
  _addToHistory(enemyId, intent) {
    if (!this._intentHistory.has(enemyId)) {
      this._intentHistory.set(enemyId, []);
    }

    const history = this._intentHistory.get(enemyId);
    history.push({
      ...intent,
      timestamp: Date.now()
    });

    // 限制历史记录长度（最多保留最近20条）
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * 获取所有当前意图
   * @returns {Map} 敌人ID到意图的映射
   */
  getAllIntents() {
    return new Map(this._currentIntents);
  }

  /**
   * 获取意图统计信息
   * @param {string} enemyId - 敌人ID
   * @returns {Object} 统计信息
   */
  getIntentStats(enemyId) {
    const history = this.getIntentHistory(enemyId);

    if (history.length === 0) {
      return {
        total: 0,
        byType: {}
      };
    }

    const byType = {};
    for (const intent of history) {
      byType[intent.type] = (byType[intent.type] || 0) + 1;
    }

    return {
      total: history.length,
      byType
    };
  }

  /**
   * 重置系统状态
   */
  reset() {
    this._currentIntents.clear();
    this._intentHistory.clear();
    this._lastKnownPhase.clear();
    console.log('[IntentSystem] 系统已重置');
  }

  /**
   * 获取系统状态
   * @returns {Object} 系统状态对象
   */
  getSystemState() {
    return {
      currentIntentsCount: this._currentIntents.size,
      historyEntriesCount: Array.from(this._intentHistory.values())
        .reduce((sum, history) => sum + history.length, 0),
      registeredIconsCount: this._iconRegistry.size,
      bossStagesCount: this._bossStages.size
    };
  }
}

// 导出常量和类
export {
  INTENT_TYPES,
  DEFAULT_INTENT_ICONS,
  INTENT_COLORS,
  EFFECT_NAMES,
  ERROR_CODES
};
