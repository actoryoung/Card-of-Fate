/**
 * EventSystem - 随机事件系统
 *
 * 负责游戏中的随机事件管理，包括事件定义、概率累积算法、选项后果处理
 * 事件是游戏探索过程中的随机遭遇，玩家需要做出选择来获得奖励或承受惩罚
 *
 * @class
 * @author Claude Code
 * @version 1.0.0
 */

// 事件类型常量
const EVENT_TYPES = {
  COMBAT: 'combat',        // 战斗事件
  SHOP: 'shop',            // 商店事件
  TREASURE: 'treasure',    // 宝箱事件
  SHRINE: 'shrine',        // 祭坛事件
  ENEMY: 'enemy',          // 敌人事件
  UNKNOWN: 'unknown'       // 未知事件
};

// 事件稀有度常量
const EVENT_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  LEGENDARY: 'legendary'
};

// 后果类型常量
const CONSEQUENCE_TYPES = {
  GOLD: 'gold',                // 金币奖励
  HP: 'hp',                    // 生命值变化
  MAX_HP: 'max_hp',            // 最大生命值变化
  CARD: 'card',                // 获得卡牌
  RELIC: 'relic',              // 获得遗物
  STATUS: 'status',            // 状态效果
  REMOVE_STATUS: 'remove_status', // 移除状态效果
  HEAL: 'heal',                // 治疗
  DAMAGE: 'damage',            // 受到伤害
  FIGHT: 'fight',              // 进入战斗
  SHOP: 'shop',                // 进入商店
  NOTHING: 'nothing'           // 无效果
};

// 错误代码常量
const ERROR_CODES = {
  EVENT_NOT_FOUND: 'ERR_EVENT_NOT_FOUND',
  INVALID_OPTION: 'ERR_INVALID_OPTION',
  INVALID_CONSEQUENCE: 'ERR_INVALID_CONSEQUENCE',
  PROBABILITY_ERROR: 'ERR_PROBABILITY_ERROR',
  SYSTEM_NOT_INITIALIZED: 'ERR_SYSTEM_NOT_INITIALIZED'
};

/**
 * 事件管理器类
 */
class EventSystem {
  /**
   * 构造函数
   * @param {Object} gameState - 游戏状态管理器
   * @param {Object} cardManager - 卡牌管理器
   * @param {Object} relicManager - 遗物管理器
   */
  constructor(gameState = null, cardManager = null, relicManager = null) {
    this.gameState = gameState;
    this.cardManager = cardManager;
    this.relicManager = relicManager;

    // 事件池存储
    this.eventPools = {
      [EVENT_TYPES.COMBAT]: [],
      [EVENT_TYPES.SHOP]: [],
      [EVENT_TYPES.TREASURE]: [],
      [EVENT_TYPES.SHRINE]: [],
      [EVENT_TYPES.ENEMY]: [],
      [EVENT_TYPES.UNKNOWN]: []
    };

    // 概率累积计数器
    this.probabilityCounters = {
      [EVENT_TYPES.ENEMY]: 0,      // 连续未遇到敌人的次数
      [EVENT_TYPES.SHOP]: 0        // 连续未遇到商店的次数
    };

    // 概率累积配置
    this.probabilityConfig = {
      baseProbability: {
        [EVENT_TYPES.ENEMY]: 0.3,   // 敌人基础概率
        [EVENT_TYPES.SHOP]: 0.2     // 商店基础概率
      },
      incrementPerStep: 0.05,        // 每次未遇到增加的概率
      maxProbability: 0.8           // 最大概率
    };

    // 已触发的事件历史（避免短时间内重复触发）
    this.eventHistory = [];

    // 最大历史记录数量
    this.maxHistorySize = 10;

    // 加载状态
    this.isLoaded = false;

    // 当前活动事件
    this.activeEvent = null;
  }

  /**
   * 初始化事件系统
   * @async
   * @param {Array} eventData - 自定义事件数据（可选）
   * @returns {Promise<void>}
   */
  async initialize(eventData = null) {
    try {
      // 加载默认事件或自定义事件
      const events = eventData || this.getDefaultEvents();

      // 验证并分类事件
      for (const event of events) {
        if (this.validateEvent(event)) {
          this.addToEventPool(event);
        } else {
          console.warn(`[EventSystem] 事件验证失败: ${event.id}`);
        }
      }

      this.isLoaded = true;
      console.log('[EventSystem] 初始化完成，加载事件数量:', this.getTotalEventCount());

    } catch (error) {
      console.error('[EventSystem] 初始化失败:', error);
      throw new Error(`${ERROR_CODES.SYSTEM_NOT_INITIALIZED}: ${error.message}`);
    }
  }

  /**
   * 获取默认事件数据
   * @returns {Array} 默认事件数组
   * @private
   */
  getDefaultEvents() {
    return [
      // ===== 祭坛事件 =====
      {
        id: 'shrine_of_blood',
        type: EVENT_TYPES.SHRINE,
        title: '血之祭坛',
        description: '一座散发着红色光芒的祭坛，上面刻着古老的符文。你感觉到它渴望着鲜血。',
        rarity: EVENT_RARITY.COMMON,
        icon: '🔥',
        options: [
          {
            text: '献祭生命，获得力量',
            consequences: [
              { type: CONSEQUENCE_TYPES.HP, value: -10, description: '失去10点生命值' },
              { type: CONSEQUENCE_TYPES.STATUS, statusType: 'strength', value: 2, duration: 999, description: '获得2层力量' }
            ]
          },
          {
            text: '献祭生命，治疗伤势',
            consequences: [
              { type: CONSEQUENCE_TYPES.HP, value: -5, description: '失去5点生命值' },
              { type: CONSEQUENCE_TYPES.HEAL, value: 15, description: '回复15点生命值' }
            ]
          },
          {
            text: '离开',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 10
      },
      {
        id: 'shrine_of_upgrade',
        type: EVENT_TYPES.SHRINE,
        title: '强化祭坛',
        description: '一座散发着金色光芒的祭坛，上面摆放着各种武器。你可以选择强化一件装备。',
        rarity: EVENT_RARITY.RARE,
        icon: '⚡',
        options: [
          {
            text: '升级卡牌（消耗金币）',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: -50, description: '消耗50金币' },
              { type: CONSEQUENCE_TYPES.CARD, action: 'upgrade', count: 1, description: '选择1张牌升级' }
            ]
          },
          {
            text: '移除卡牌（消耗金币）',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: -30, description: '消耗30金币' },
              { type: CONSEQUENCE_TYPES.CARD, action: 'remove', count: 1, description: '从卡组中移除1张牌' }
            ]
          },
          {
            text: '离开',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 7
      },

      // ===== 敌人事件 =====
      {
        id: 'wandering_ghost',
        type: EVENT_TYPES.ENEMY,
        title: '游荡的幽灵',
        description: '一个透明的幽灵挡住了你的去路，它的眼神中似乎有某种请求。',
        rarity: EVENT_RARITY.COMMON,
        icon: '👻',
        options: [
          {
            text: '与幽灵战斗',
            consequences: [
              { type: CONSEQUENCE_TYPES.FIGHT, enemyId: 'ghost', description: '进入与幽灵的战斗' },
              { type: CONSEQUENCE_TYPES.GOLD, value: 30, description: '胜利后获得30金币' }
            ]
          },
          {
            text: '给予金币（安抚幽灵）',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: -20, description: '给予20金币' },
              { type: CONSEQUENCE_TYPES.RELIC, rarity: 'common', description: '幽灵赠送你一个普通遗物' }
            ]
          },
          {
            text: '尝试绕过',
            consequences: [
              { type: CONSEQUENCE_TYPES.STATUS, statusType: 'weak', value: 1, duration: 2, description: '获得1层虚弱（持续2回合）' }
            ]
          }
        ],
        weight: 12
      },
      {
        id: 'ambushed',
        type: EVENT_TYPES.ENEMY,
        title: '伏击',
        description: '你突然感到一股寒意，一群敌人从阴影中扑了出来！',
        rarity: EVENT_RARITY.COMMON,
        icon: '⚔️',
        options: [
          {
            text: '战斗！',
            consequences: [
              { type: CONSEQUENCE_TYPES.FIGHT, enemyId: 'ambushers', description: '进入战斗' },
              { type: CONSEQUENCE_TYPES.GOLD, value: 40, description: '胜利后获得40金币' },
              { type: CONSEQUENCE_TYPES.STATUS, statusType: 'vulnerable', value: 1, duration: 1, description: '开始时获得1层易伤' }
            ]
          }
        ],
        weight: 8
      },

      // ===== 宝箱事件 =====
      {
        id: 'mysterious_chest',
        type: EVENT_TYPES.TREASURE,
        title: '神秘宝箱',
        description: '一个精美的宝箱摆放在路中央，但你觉得可能有陷阱。',
        rarity: EVENT_RARITY.COMMON,
        icon: '📦',
        options: [
          {
            text: '打开宝箱',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: 50, description: '获得50金币' },
              { type: CONSEQUENCE_TYPES.CARD, action: 'add', count: 1, description: '获得1张随机卡牌' }
            ]
          },
          {
            text: '小心检查（需要时间）',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: 80, description: '获得80金币（无陷阱）' },
              { type: CONSEQUENCE_TYPES.RELIC, rarity: 'common', description: '发现隐藏的遗物' }
            ]
          },
          {
            text: '无视宝箱',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 10
      },
      {
        id: 'trapped_chest',
        type: EVENT_TYPES.TREASURE,
        title: '陷阱宝箱',
        description: '这个宝箱看起来很诱人，但周围有一些奇怪的痕迹...',
        rarity: EVENT_RARITY.COMMON,
        icon: '🎁',
        options: [
          {
            text: '冒险打开',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: 100, description: '获得100金币' },
              { type: CONSEQUENCE_TYPES.DAMAGE, value: 15, description: '受到15点伤害（陷阱触发）' }
            ]
          },
          {
            text: '拆除陷阱（需要金币）',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: -25, description: '支付25金币拆除陷阱' },
              { type: CONSEQUENCE_TYPES.GOLD, value: 100, description: '获得100金币' },
              { type: CONSEQUENCE_TYPES.RELIC, rarity: 'rare', description: '获得稀有遗物' }
            ]
          },
          {
            text: '离开',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 8
      },

      // ===== 未知事件 =====
      {
        id: 'big_fish',
        type: EVENT_TYPES.UNKNOWN,
        title: '大鱼',
        description: '你在路边发现了一个被遗弃的包裹，里面有一条看起来很新鲜的大鱼。',
        rarity: EVENT_RARITY.COMMON,
        icon: '🐟',
        options: [
          {
            text: '吃掉大鱼',
            consequences: [
              { type: CONSEQUENCE_TYPES.HEAL, value: 0, maxPercent: 0.3, description: '回复30%最大生命值' },
              { type: CONSEQUENCE_TYPES.MAX_HP, value: 5, description: '最大生命值+5' }
            ]
          },
          {
            text: '不吃',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 15
      },
      {
        id: 'the_house',
        type: EVENT_TYPES.UNKNOWN,
        title: '小屋',
        description: '你发现了一间废弃的小屋，里面似乎有一些有用的东西。',
        rarity: EVENT_RARITY.RARE,
        icon: '🏠',
        options: [
          {
            text: '搜查小屋',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: 40, description: '获得40金币' },
              { type: CONSEQUENCE_TYPES.CARD, action: 'add', count: 2, description: '获得2张随机卡牌' }
            ]
          },
          {
            text: '在小屋休息',
            consequences: [
              { type: CONSEQUENCE_TYPES.HEAL, value: 0, maxPercent: 0.2, description: '回复20%最大生命值' },
              { type: CONSEQUENCE_TYPES.STATUS, statusType: 'strength', value: -1, duration: 999, description: '失去1层力量' }
            ]
          },
          {
            text: '离开',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 10
      },
      {
        id: 'the_clerk',
        type: EVENT_TYPES.UNKNOWN,
        title: '神秘的商人',
        description: '一个穿着长袍的商人向你走来，他似乎有一些特殊的商品。',
        rarity: EVENT_RARITY.RARE,
        icon: '🎭',
        options: [
          {
            text: '查看商品',
            consequences: [
              { type: CONSEQUENCE_TYPES.SHOP, description: '进入特殊商店' }
            ]
          },
          {
            text: '拒绝',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 5
      },
      {
        id: 'note',
        type: EVENT_TYPES.UNKNOWN,
        title: '神秘纸条',
        description: '你发现了一张纸条，上面写着："前面有宝藏"。但你感觉这可能有诈。',
        rarity: EVENT_RARITY.COMMON,
        icon: '📜',
        options: [
          {
            text: '相信纸条',
            consequences: [
              { type: CONSEQUENCE_TYPES.GOLD, value: 75, chance: 0.5, description: '50%几率获得75金币' },
              { type: CONSEQUENCE_TYPES.DAMAGE, value: 10, chance: 0.5, description: '50%几率受到10点伤害（陷阱）' }
            ]
          },
          {
            text: '无视纸条',
            consequences: [
              { type: CONSEQUENCE_TYPES.NOTHING, description: '无事发生' }
            ]
          }
        ],
        weight: 12
      }
    ];
  }

  /**
   * 验证事件数据
   * @param {Object} event - 要验证的事件对象
   * @returns {boolean} - 是否有效
   * @private
   */
  validateEvent(event) {
    const requiredFields = ['id', 'type', 'title', 'description', 'options', 'weight'];

    // 检查必需字段
    for (const field of requiredFields) {
      if (event[field] === undefined || event[field] === null) {
        console.warn(`[EventSystem] 事件缺少必需字段: ${field}`);
        return false;
      }
    }

    // 验证事件类型
    const validTypes = Object.values(EVENT_TYPES);
    if (!validTypes.includes(event.type)) {
      console.warn(`[EventSystem] 无效的事件类型: ${event.type}`);
      return false;
    }

    // 验证稀有度
    const validRarities = Object.values(EVENT_RARITY);
    if (event.rarity && !validRarities.includes(event.rarity)) {
      console.warn(`[EventSystem] 无效的稀有度: ${event.rarity}`);
      return false;
    }

    // 验证选项数组
    if (!Array.isArray(event.options) || event.options.length === 0) {
      console.warn(`[EventSystem] 事件 ${event.id} 必须有至少一个选项`);
      return false;
    }

    // 验证每个选项
    for (let i = 0; i < event.options.length; i++) {
      const option = event.options[i];
      if (!option.text || !option.consequences) {
        console.warn(`[EventSystem] 事件 ${event.id} 选项 ${i} 缺少 text 或 consequences`);
        return false;
      }
      if (!Array.isArray(option.consequences)) {
        console.warn(`[EventSystem] 事件 ${event.id} 选项 ${i} 的 consequences 必须是数组`);
        return false;
      }
    }

    // 验证权重
    if (typeof event.weight !== 'number' || event.weight <= 0) {
      console.warn(`[EventSystem] 事件 ${event.id} 的权重必须为正数`);
      return false;
    }

    return true;
  }

  /**
   * 添加事件到事件池
   * @param {Object} event - 事件对象
   * @private
   */
  addToEventPool(event) {
    if (this.eventPools[event.type]) {
      this.eventPools[event.type].push(event);
    } else {
      console.warn(`[EventSystem] 未知的事件类型: ${event.type}`);
    }
  }

  /**
   * 获取随机事件（使用概率累积算法）
   * @param {Object} options - 选项 {eventType, excludeHistory}
   * @returns {Object|null} - 随机事件对象或null
   */
  getRandomEvent(options = {}) {
    if (!this.isLoaded) {
      console.warn('[EventSystem] 系统未初始化');
      return null;
    }

    const { eventType = null, excludeHistory = true } = options;

    // 确定候选事件池
    let candidatePools = [];

    if (eventType) {
      // 指定事件类型
      if (this.eventPools[eventType]) {
        candidatePools = [{ type: eventType, events: this.eventPools[eventType] }];
      }
    } else {
      // 使用概率累积算法
      candidatePools = this._getWeightedPools();
    }

    if (candidatePools.length === 0) {
      return null;
    }

    // 收集所有候选事件
    let allEvents = [];
    for (const pool of candidatePools) {
      allEvents = allEvents.concat(pool.events);
    }

    // 过滤历史事件
    if (excludeHistory) {
      allEvents = allEvents.filter(event =>
        !this.eventHistory.includes(event.id)
      );
    }

    if (allEvents.length === 0) {
      // 如果没有可用事件，清除历史并重试
      if (excludeHistory && this.eventHistory.length > 0) {
        this.eventHistory = [];
        return this.getRandomEvent({ ...options, excludeHistory: false });
      }
      return null;
    }

    // 按权重选择事件
    const totalWeight = allEvents.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;

    for (const event of allEvents) {
      random -= event.weight;
      if (random <= 0) {
        // 添加到历史记录
        this.addToHistory(event.id);

        // 更新概率计数器
        this._updateProbabilityCounters(event.type);

        // 设置为活动事件
        this.activeEvent = event;

        console.log(`[EventSystem] 触发事件: ${event.title} (${event.type})`);
        return event;
      }
    }

    // 如果因为浮点数误差没有选中任何事件，返回最后一个
    const lastEvent = allEvents[allEvents.length - 1];
    this.addToHistory(lastEvent.id);
    this._updateProbabilityCounters(lastEvent.type);
    this.activeEvent = lastEvent;
    return lastEvent;
  }

  /**
   * 使用概率累积算法获取加权事件池
   * @returns {Array} - 加权后的候选事件池
   * @private
   */
  _getWeightedPools() {
    const pools = [];

    // 获取基础概率并应用累积加成
    for (const type of [EVENT_TYPES.ENEMY, EVENT_TYPES.SHOP]) {
      const baseProb = this.probabilityConfig.baseProbability[type];
      const counter = this.probabilityCounters[type];
      const increment = counter * this.probabilityConfig.incrementPerStep;
      const finalProb = Math.min(
        baseProb + increment,
        this.probabilityConfig.maxProbability
      );

      if (this.eventPools[type].length > 0) {
        pools.push({
          type,
          events: this.eventPools[type],
          probability: finalProb
        });
      }
    }

    // 添加其他类型事件（固定概率）
    const otherTypes = [EVENT_TYPES.SHRINE, EVENT_TYPES.TREASURE, EVENT_TYPES.UNKNOWN];
    for (const type of otherTypes) {
      if (this.eventPools[type].length > 0) {
        pools.push({
          type,
          events: this.eventPools[type],
          probability: 0.2 // 固定概率
        });
      }
    }

    // 归一化概率
    const totalProb = pools.reduce((sum, pool) => sum + pool.probability, 0);
    if (totalProb > 0) {
      // 按概率顺序排列，后续在 getRandomEvent 中实际选择
      pools.sort((a, b) => b.probability - a.probability);
    }

    return pools;
  }

  /**
   * 更新概率累积计数器
   * @param {string} eventType - 触发的事件类型
   * @private
   */
  _updateProbabilityCounters(eventType) {
    // 如果触发了敌人事件，重置敌人计数器
    if (eventType === EVENT_TYPES.ENEMY) {
      this.probabilityCounters[EVENT_TYPES.ENEMY] = 0;
      this.probabilityCounters[EVENT_TYPES.SHOP]++;
    }
    // 如果触发了商店事件，重置商店计数器
    else if (eventType === EVENT_TYPES.SHOP) {
      this.probabilityCounters[EVENT_TYPES.SHOP] = 0;
      this.probabilityCounters[EVENT_TYPES.ENEMY]++;
    }
    // 其他事件增加两个计数器
    else {
      this.probabilityCounters[EVENT_TYPES.ENEMY]++;
      this.probabilityCounters[EVENT_TYPES.SHOP]++;
    }

    console.log('[EventSystem] 概率计数器更新:', this.probabilityCounters);
  }

  /**
   * 添加事件到历史记录
   * @param {string} eventId - 事件ID
   * @private
   */
  addToHistory(eventId) {
    this.eventHistory.push(eventId);

    // 保持历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 选择事件选项
   * @param {string} eventId - 事件ID
   * @param {number} optionIndex - 选项索引
   * @returns {Object} - 选择结果 {success, consequences, effects}
   */
  selectOption(eventId, optionIndex) {
    if (!this.activeEvent || this.activeEvent.id !== eventId) {
      console.warn(`[EventSystem] 事件 ${eventId} 不是当前活动事件`);
      return {
        success: false,
        error: ERROR_CODES.EVENT_NOT_FOUND,
        message: '事件不是当前活动事件'
      };
    }

    if (optionIndex < 0 || optionIndex >= this.activeEvent.options.length) {
      console.warn(`[EventSystem] 无效的选项索引: ${optionIndex}`);
      return {
        success: false,
        error: ERROR_CODES.INVALID_OPTION,
        message: '无效的选项索引'
      };
    }

    const selectedOption = this.activeEvent.options[optionIndex];

    // 应用后果
    const appliedConsequences = this.applyConsequences(selectedOption.consequences);

    console.log(`[EventSystem] 选择选项 ${optionIndex}: ${selectedOption.text}`);

    // 清除活动事件
    this.activeEvent = null;

    return {
      success: true,
      optionText: selectedOption.text,
      consequences: selectedOption.consequences,
      appliedConsequences
    };
  }

  /**
   * 应用后果
   * @param {Array} consequences - 后果数组
   * @returns {Array} - 已应用的后果结果数组
   */
  applyConsequences(consequences) {
    const results = [];

    if (!Array.isArray(consequences)) {
      console.warn('[EventSystem] 后果必须是数组');
      return results;
    }

    for (const consequence of consequences) {
      // 检查几率（如果有）
      if (consequence.chance !== undefined) {
        if (Math.random() > consequence.chance) {
          console.log(`[EventSystem] 后果未触发（几率检查失败）: ${consequence.description || ''}`);
          continue;
        }
      }

      const result = this._applySingleConsequence(consequence);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 应用单个后果
   * @param {Object} consequence - 后果对象
   * @returns {Object|null} - 应用结果
   * @private
   */
  _applySingleConsequence(consequence) {
    const type = consequence.type;
    const value = consequence.value || 0;

    switch (type) {
      case CONSEQUENCE_TYPES.GOLD:
        return this._applyGoldConsequence(value);

      case CONSEQUENCE_TYPES.HP:
        return this._applyHpConsequence(value);

      case CONSEQUENCE_TYPES.MAX_HP:
        return this._applyMaxHpConsequence(value);

      case CONSEQUENCE_TYPES.HEAL:
        return this._applyHealConsequence(consequence);

      case CONSEQUENCE_TYPES.DAMAGE:
        return this._applyDamageConsequence(value);

      case CONSEQUENCE_TYPES.CARD:
        return this._applyCardConsequence(consequence);

      case CONSEQUENCE_TYPES.RELIC:
        return this._applyRelicConsequence(consequence);

      case CONSEQUENCE_TYPES.STATUS:
        return this._applyStatusConsequence(consequence);

      case CONSEQUENCE_TYPES.REMOVE_STATUS:
        return this._applyRemoveStatusConsequence(consequence);

      case CONSEQUENCE_TYPES.FIGHT:
        return { type, consequence, message: consequence.description || '进入战斗' };

      case CONSEQUENCE_TYPES.SHOP:
        return { type, consequence, message: consequence.description || '进入商店' };

      case CONSEQUENCE_TYPES.NOTHING:
        return { type, message: '无事发生' };

      default:
        console.warn(`[EventSystem] 未知的后果类型: ${type}`, ERROR_CODES.INVALID_CONSEQUENCE);
        return null;
    }
  }

  /**
   * 应用金币后果
   * @param {number} value - 金币变化值
   * @returns {Object} - 应用结果
   * @private
   */
  _applyGoldConsequence(value) {
    if (this.gameState && this.gameState.playerState) {
      const currentGold = this.gameState.playerState.gold || 0;
      const newGold = Math.max(0, currentGold + value);
      this.gameState.playerState.gold = newGold;

      console.log(`[EventSystem] 金币变化: ${value > 0 ? '+' : ''}${value}`);

      return {
        type: CONSEQUENCE_TYPES.GOLD,
        value,
        previousValue: currentGold,
        newValue: newGold,
        message: `${value > 0 ? '获得' : '失去'}${Math.abs(value)}金币`
      };
    }

    return {
      type: CONSEQUENCE_TYPES.GOLD,
      value,
      message: `金币变化 ${value}（游戏状态未更新）`
    };
  }

  /**
   * 应用生命值后果
   * @param {number} value - 生命值变化值（负数表示减少）
   * @returns {Object} - 应用结果
   * @private
   */
  _applyHpConsequence(value) {
    if (this.gameState && this.gameState.playerState) {
      const currentHp = this.gameState.playerState.hp || 0;
      const newHp = Math.max(0, Math.min(
        this.gameState.playerState.maxHp || 100,
        currentHp + value
      ));
      this.gameState.playerState.hp = newHp;

      console.log(`[EventSystem] 生命值变化: ${value > 0 ? '+' : ''}${value}`);

      return {
        type: CONSEQUENCE_TYPES.HP,
        value,
        previousValue: currentHp,
        newValue: newHp,
        message: `${value > 0 ? '回复' : '失去'}${Math.abs(value)}点生命值`
      };
    }

    return {
      type: CONSEQUENCE_TYPES.HP,
      value,
      message: `生命值变化 ${value}（游戏状态未更新）`
    };
  }

  /**
   * 应用最大生命值后果
   * @param {number} value - 最大生命值变化值
   * @returns {Object} - 应用结果
   * @private
   */
  _applyMaxHpConsequence(value) {
    if (this.gameState && this.gameState.playerState) {
      const currentMaxHp = this.gameState.playerState.maxHp || 100;
      const newMaxHp = Math.max(1, currentMaxHp + value);
      this.gameState.playerState.maxHp = newMaxHp;

      // 如果当前生命值超过新的最大值，进行调整
      if (this.gameState.playerState.hp > newMaxHp) {
        this.gameState.playerState.hp = newMaxHp;
      }

      console.log(`[EventSystem] 最大生命值变化: ${value > 0 ? '+' : ''}${value}`);

      return {
        type: CONSEQUENCE_TYPES.MAX_HP,
        value,
        previousValue: currentMaxHp,
        newValue: newMaxHp,
        message: `最大生命值${value > 0 ? '增加' : '减少'}${Math.abs(value)}`
      };
    }

    return {
      type: CONSEQUENCE_TYPES.MAX_HP,
      value,
      message: `最大生命值变化 ${value}（游戏状态未更新）`
    };
  }

  /**
   * 应用治疗后果
   * @param {Object} consequence - 后果对象 {value, maxPercent}
   * @returns {Object} - 应用结果
   * @private
   */
  _applyHealConsequence(consequence) {
    if (this.gameState && this.gameState.playerState) {
      const currentHp = this.gameState.playerState.hp || 0;
      const maxHp = this.gameState.playerState.maxHp || 100;

      let healAmount = consequence.value || 0;

      // 如果指定了百分比
      if (consequence.maxPercent) {
        healAmount = Math.floor(maxHp * consequence.maxPercent);
      }

      const newHp = Math.min(maxHp, currentHp + healAmount);
      const actualHeal = newHp - currentHp;

      this.gameState.playerState.hp = newHp;

      console.log(`[EventSystem] 治疗: ${actualHeal}`);

      return {
        type: CONSEQUENCE_TYPES.HEAL,
        healAmount: actualHeal,
        previousValue: currentHp,
        newValue: newHp,
        message: `回复${actualHeal}点生命值`
      };
    }

    return {
      type: CONSEQUENCE_TYPES.HEAL,
      message: `治疗（游戏状态未更新）`
    };
  }

  /**
   * 应用伤害后果
   * @param {number} value - 伤害值
   * @returns {Object} - 应用结果
   * @private
   */
  _applyDamageConsequence(value) {
    if (this.gameState && this.gameState.playerState) {
      const currentHp = this.gameState.playerState.hp || 0;
      const newHp = Math.max(0, currentHp - value);
      const actualDamage = currentHp - newHp;

      this.gameState.playerState.hp = newHp;

      console.log(`[EventSystem] 受到伤害: ${actualDamage}`);

      return {
        type: CONSEQUENCE_TYPES.DAMAGE,
        damage: actualDamage,
        previousValue: currentHp,
        newValue: newHp,
        message: `受到${actualDamage}点伤害`
      };
    }

    return {
      type: CONSEQUENCE_TYPES.DAMAGE,
      value,
      message: `受到${value}点伤害（游戏状态未更新）`
    };
  }

  /**
   * 应用卡牌后果
   * @param {Object} consequence - 后果对象 {action, count}
   * @returns {Object} - 应用结果
   * @private
   */
  _applyCardConsequence(consequence) {
    const action = consequence.action || 'add';
    const count = consequence.count || 1;

    // 这里需要与 CardManager 集成
    // 由于 CardManager 的接口可能不同，这里只返回后果信息
    console.log(`[EventSystem] 卡牌后果: ${action} ${count}张牌`);

    return {
      type: CONSEQUENCE_TYPES.CARD,
      action,
      count,
      message: `${action === 'add' ? '获得' : action === 'remove' ? '移除' : '升级'}${count}张卡牌`
    };
  }

  /**
   * 应用遗物后果
   * @param {Object} consequence - 后果对象 {rarity}
   * @returns {Object} - 应用结果
   * @private
   */
  _applyRelicConsequence(consequence) {
    const rarity = consequence.rarity || EVENT_RARITY.COMMON;

    // 如果有 RelicManager，生成遗物奖励
    if (this.relicManager) {
      const relics = this.relicManager.generateRelicReward(
        RELIC_POOL?.ALL || 'all',
        1
      );

      if (relics.length > 0) {
        const relic = relics[0];
        this.relicManager.grantRelic(relic.id);

        console.log(`[EventSystem] 获得遗物: ${relic.name}`);

        return {
          type: CONSEQUENCE_TYPES.RELIC,
          relic,
          message: `获得遗物: ${relic.name}`
        };
      }
    }

    return {
      type: CONSEQUENCE_TYPES.RELIC,
      rarity,
      message: `获得${rarity}遗物`
    };
  }

  /**
   * 应用状态效果后果
   * @param {Object} consequence - 后果对象 {statusType, value, duration}
   * @returns {Object} - 应用结果
   * @private
   */
  _applyStatusConsequence(consequence) {
    const statusType = consequence.statusType;
    const value = consequence.value !== undefined ? consequence.value : 1;
    const duration = consequence.duration || 1;

    console.log(`[EventSystem] 状态效果: ${statusType} +${value} (持续${duration}回合)`);

    return {
      type: CONSEQUENCE_TYPES.STATUS,
      statusType,
      value,
      duration,
      message: `获得${value}层${statusType}（持续${duration}回合）`
    };
  }

  /**
   * 应用移除状态效果后果
   * @param {Object} consequence - 后果对象 {statusType}
   * @returns {Object} - 应用结果
   * @private
   */
  _applyRemoveStatusConsequence(consequence) {
    const statusType = consequence.statusType;

    console.log(`[EventSystem] 移除状态效果: ${statusType}`);

    return {
      type: CONSEQUENCE_TYPES.REMOVE_STATUS,
      statusType,
      message: `移除${statusType}效果`
    };
  }

  /**
   * 获取事件总数
   * @returns {number} - 事件总数
   * @private
   */
  getTotalEventCount() {
    let total = 0;
    for (const type of Object.values(EVENT_TYPES)) {
      total += this.eventPools[type]?.length || 0;
    }
    return total;
  }

  /**
   * 获取指定类型的事件
   * @param {string} eventType - 事件类型
   * @returns {Array} - 事件数组
   */
  getEventsByType(eventType) {
    return this.eventPools[eventType] || [];
  }

  /**
   * 通过ID获取事件
   * @param {string} eventId - 事件ID
   * @returns {Object|null} - 事件对象或null
   */
  getEventById(eventId) {
    for (const type of Object.values(EVENT_TYPES)) {
      const event = this.eventPools[type]?.find(e => e.id === eventId);
      if (event) {
        return event;
      }
    }
    return null;
  }

  /**
   * 添加自定义事件
   * @param {Object} event - 事件对象
   * @returns {boolean} - 是否成功添加
   */
  addCustomEvent(event) {
    if (this.validateEvent(event)) {
      this.addToEventPool(event);
      console.log(`[EventSystem] 添加自定义事件: ${event.title}`);
      return true;
    }
    return false;
  }

  /**
   * 重置概率累积计数器
   */
  resetProbabilityCounters() {
    this.probabilityCounters = {
      [EVENT_TYPES.ENEMY]: 0,
      [EVENT_TYPES.SHOP]: 0
    };
    console.log('[EventSystem] 概率计数器已重置');
  }

  /**
   * 清除事件历史
   */
  clearHistory() {
    this.eventHistory = [];
    console.log('[EventSystem] 事件历史已清除');
  }

  /**
   * 获取当前活动事件
   * @returns {Object|null} - 当前活动事件或null
   */
  getActiveEvent() {
    return this.activeEvent;
  }

  /**
   * 获取系统状态
   * @returns {Object} - 系统状态对象
   */
  getState() {
    return {
      isLoaded: this.isLoaded,
      eventCounts: Object.fromEntries(
        Object.entries(this.eventPools).map(([type, events]) => [type, events.length])
      ),
      probabilityCounters: { ...this.probabilityCounters },
      eventHistory: [...this.eventHistory],
      activeEvent: this.activeEvent ? this.activeEvent.id : null
    };
  }

  /**
   * 重置系统状态
   */
  reset() {
    this.activeEvent = null;
    this.clearHistory();
    this.resetProbabilityCounters();
    console.log('[EventSystem] 系统已重置');
  }
}

// 导出常量和类
export {
  EVENT_TYPES,
  EVENT_RARITY,
  CONSEQUENCE_TYPES,
  ERROR_CODES
};

export default EventSystem;
