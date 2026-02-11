/**
 * RelicManager - 遗物管理系统
 *
 * 负责遗物数据加载、遗物池管理、被动效果触发
 * 遗物是游戏中的永久性增强物品，提供各种被动效果
 *
 * 基于 .claude/specs/feature/roguelike-transformation-spec.md 规范文档
 *
 * @class
 */

// 遗物稀有度常量（根据规范文档）
const RELIC_RARITY = {
  COMMON: 'common',      // 普通遗物
  RARE: 'rare',          // 稀有遗物
  LEGENDARY: 'legendary' // 传说遗物（Boss遗物）
};

// 遗物池常量（根据规范文档）
const RELIC_POOL = {
  ALL: 'all',           // 通用池
  CHARACTER: 'character', // 角色专属池
  BOSS: 'boss',         // Boss池
  SHOP: 'shop'          // 商店池
};

// 遗物效果触发时机常量（根据规范文档）
const TRIGGER_TIMING = {
  ON_COMBAT_START: 'onCombatStart',   // 战斗开始时
  ON_TURN_START: 'onTurnStart',       // 回合开始时
  ON_TURN_END: 'onTurnEnd',           // 回合结束时
  ON_CARD_PLAY: 'onCardPlay',         // 打出卡牌时
  ON_ENEMY_DEATH: 'onEnemyDeath',     // 敌人死亡时
  ON_PLAYER_HURT: 'onPlayerHurt'      // 玩家受伤时
};

// 遗物效果类型常量
const EFFECT_TYPES = {
  // 战斗开始效果
  ENERGY_START: 'energy_start',           // 战斗开始获得能量
  DRAW_START: 'draw_start',               // 战斗开始抽牌
  ARMOR_START: 'armor_start',             // 战斗开始获得护甲

  // 回合效果
  HEAL_END_TURN: 'heal_end_turn',         // 回合结束时回复生命
  ARMOR_END_TURN: 'armor_end_turn',       // 回合结束时获得护甲
  ENERGY_TURN: 'energy_turn',             // 回合开始时获得能量
  DRAW_TURN: 'draw_turn',                 // 回合开始时抽牌

  // 卡牌效果
  DAMAGE_ON_ATTACK: 'damage_on_attack',   // 打出攻击牌时造成伤害
  ENERGY_ON_ATTACK: 'energy_on_attack',   // 打出攻击牌时获得能量
  DRAW_ON_SKILL: 'draw_on_skill',         // 打出技能牌时抽牌
  REDUCE_COST: 'reduce_cost',             // 每打出X张牌，下张牌费用为0

  // 敌人死亡效果
  HEAL_ON_KILL: 'heal_on_kill',           // 敌人死亡时回复生命
  ENERGY_ON_KILL: 'energy_on_kill',       // 敌人死亡时获得能量
  GOLD_ON_KILL: 'gold_on_kill'            // 敌人死亡时获得金币
};

// 错误代码常量
const ERRORS = {
  RELIC_NOT_FOUND: 'ERR_RELIC_NOT_FOUND',
  RELIC_ALREADY_OWNED: 'ERR_RELIC_ALREADY_OWNED',
  RELIC_DATA_INVALID: 'ERR_RELIC_DATA_INVALID',
  RELIC_POOL_EMPTY: 'ERR_RELIC_POOL_EMPTY',
  INVALID_TRIGGER_TIMING: 'ERR_INVALID_TRIGGER_TIMING',
  INVALID_EFFECT_TYPE: 'ERR_INVALID_EFFECT_TYPE'
};

/**
 * 遗物管理器类
 */
export class RelicManager {
  /**
   * 构造函数
   * @param {Object} gameState - 游戏状态管理器
   */
  constructor(gameState = null) {
    this.gameState = gameState;

    // 遗物数据存储
    this.allRelics = [];

    // 玩家拥有的遗物
    this.ownedRelics = [];

    // 遗物池（按池分类）
    this.relicPools = {
      [RELIC_POOL.ALL]: [],
      [RELIC_POOL.CHARACTER]: [],
      [RELIC_POOL.BOSS]: [],
      [RELIC_POOL.SHOP]: []
    };

    // 加载状态
    this.isLoaded = false;

    // 效果触发器映射
    this.effectTriggers = new Map();

    // 战斗计数器（用于计数器类效果）
    this.combatCounters = {};
  }

  /**
   * 从数据加载遗物
   * @async
   * @param {Array} relicData - 遗物数据数组
   * @returns {Promise<void>}
   * @throws {Error} 当遗物数据加载失败时抛出错误
   */
  async loadRelics(relicData = null) {
    try {
      // 默认遗物数据（如果未提供）
      if (!relicData) {
        relicData = this.getDefaultRelics();
      }

      // 验证并加载遗物
      const validRelics = [];
      for (const relic of relicData) {
        if (this.validateRelic(relic)) {
          validRelics.push(relic);
        }
      }

      // 移除重复ID
      this.allRelics = this.removeDuplicateRelics(validRelics);

      // 按池分类
      this.classifyRelicsByPool();

      // 初始化效果触发器
      this.initializeEffectTriggers();

      this.isLoaded = true;

    } catch (error) {
      console.error('Load relics error:', error);
      throw new Error(`${ERRORS.RELIC_DATA_INVALID}: 遗物数据加载失败: ${error.message}`);
    }
  }

  /**
   * 获取默认遗物数据
   * @returns {Array} 默认遗物数组
   * @private
   */
  getDefaultRelics() {
    return [
      // ===== 普通遗物 =====
      {
        id: 'burning_blood',
        name: '燃烧之血',
        description: '每回合结束时回复3点生命值',
        effect: {
          timing: TRIGGER_TIMING.ON_TURN_END,
          type: EFFECT_TYPES.HEAL_END_TURN,
          value: 3
        },
        rarity: RELIC_RARITY.COMMON,
        pool: RELIC_POOL.ALL,
        icon: '🔥',
        stackable: false
      },
      {
        id: 'bag_of_preparation',
        name: '准备袋',
        description: '每战开始时，抽1张额外的牌',
        effect: {
          timing: TRIGGER_TIMING.ON_COMBAT_START,
          type: EFFECT_TYPES.DRAW_START,
          value: 1
        },
        rarity: RELIC_RARITY.COMMON,
        pool: RELIC_POOL.ALL,
        icon: '🎒',
        stackable: false
      },
      {
        id: 'anchor',
        name: '锚',
        description: '每场战斗第一回合获得10点护甲',
        effect: {
          timing: TRIGGER_TIMING.ON_TURN_START,
          type: EFFECT_TYPES.ARMOR_START,
          value: 10,
          condition: { firstTurn: true }
        },
        rarity: RELIC_RARITY.COMMON,
        pool: RELIC_POOL.ALL,
        icon: '⚓',
        stackable: false
      },
      {
        id: 'brimstone',
        name: '硫磺',
        description: '每打出一张攻击牌，获得1点能量',
        effect: {
          timing: TRIGGER_TIMING.ON_CARD_PLAY,
          type: EFFECT_TYPES.ENERGY_ON_ATTACK,
          value: 1,
          condition: { cardType: 'attack' }
        },
        rarity: RELIC_RARITY.COMMON,
        pool: RELIC_POOL.ALL,
        icon: '💎',
        stackable: false
      },
      {
        id: 'lantern',
        name: '提灯',
        description: '每打出一张攻击牌，对随机敌人造成3点伤害',
        effect: {
          timing: TRIGGER_TIMING.ON_CARD_PLAY,
          type: EFFECT_TYPES.DAMAGE_ON_ATTACK,
          value: 3,
          condition: { cardType: 'attack' }
        },
        rarity: RELIC_RARITY.COMMON,
        pool: RELIC_POOL.ALL,
        icon: '🏮',
        stackable: false
      },

      // ===== 稀有遗物 =====
      {
        id: 'bag_of_prep',
        name: '行囊',
        description: '每战开始时，抽2张额外的牌',
        effect: {
          timing: TRIGGER_TIMING.ON_COMBAT_START,
          type: EFFECT_TYPES.DRAW_START,
          value: 2
        },
        rarity: RELIC_RARITY.RARE,
        pool: RELIC_POOL.ALL,
        icon: '🎒',
        stackable: false
      },
      {
        id: 'blood_vial',
        name: '血瓶',
        description: '每战结束后回复10点生命值',
        effect: {
          timing: TRIGGER_TIMING.ON_COMBAT_START,
          type: EFFECT_TYPES.HEAL_END_TURN,
          value: 10,
          condition: { onCombatEnd: true }
        },
        rarity: RELIC_RARITY.RARE,
        pool: RELIC_POOL.ALL,
        icon: '🧪',
        stackable: true
      },
      {
        id: 'ceramic_fish',
        name: '陶瓷鱼',
        description: '每回合的第一张牌费用为0',
        effect: {
          timing: TRIGGER_TIMING.ON_TURN_START,
          type: EFFECT_TYPES.REDUCE_COST,
          value: 1
        },
        rarity: RELIC_RARITY.RARE,
        pool: RELIC_POOL.ALL,
        icon: '🐟',
        stackable: false
      },
      {
        id: 'energy_bonus',
        name: '能量之石',
        description: '每战开始时，获得1点最大能量',
        effect: {
          timing: TRIGGER_TIMING.ON_COMBAT_START,
          type: EFFECT_TYPES.ENERGY_START,
          value: 1
        },
        rarity: RELIC_RARITY.RARE,
        pool: RELIC_POOL.ALL,
        icon: '⚡',
        stackable: true
      },
      {
        id: 'courier',
        name: '信使',
        description: '每打出3张牌，抽1张牌',
        effect: {
          timing: TRIGGER_TIMING.ON_CARD_PLAY,
          type: EFFECT_TYPES.DRAW_ON_SKILL,
          counter: 3,
          reward: 1
        },
        rarity: RELIC_RARITY.RARE,
        pool: RELIC_POOL.ALL,
        icon: '📜',
        stackable: false
      },

      // ===== 传说遗物（Boss遗物）=====
      {
        id: 'slavers_collar',
        name: '奴隶项圈',
        description: '每当造成12点或以上伤害，抽1张牌',
        effect: {
          timing: TRIGGER_TIMING.ON_CARD_PLAY,
          type: EFFECT_TYPES.DAMAGE_ON_ATTACK,
          value: 1,
          condition: { threshold: 12, trigger: 'draw' }
        },
        rarity: RELIC_RARITY.LEGENDARY,
        pool: RELIC_POOL.BOSS,
        icon: '⛓️',
        stackable: false
      },
      {
        id: 'empty_cage',
        name: '空笼',
        description: '每打出一张牌，对所有敌人造成2点伤害',
        effect: {
          timing: TRIGGER_TIMING.ON_CARD_PLAY,
          type: EFFECT_TYPES.DAMAGE_ON_ATTACK,
          value: 2,
          target: 'all_enemies'
        },
        rarity: RELIC_RARITY.LEGENDARY,
        pool: RELIC_POOL.BOSS,
        icon: '🪞',
        stackable: false
      },
      {
        id: 'anchoring_stone',
        name: '定海神针',
        description: '每场战斗前两个回合各获得15点护甲',
        effect: {
          timing: TRIGGER_TIMING.ON_TURN_START,
          type: EFFECT_TYPES.ARMOR_START,
          value: 15,
          condition: { turns: [1, 2] }
        },
        rarity: RELIC_RARITY.LEGENDARY,
        pool: RELIC_POOL.BOSS,
        icon: '🗿',
        stackable: false
      },

      // ===== 角色专属遗物 =====
      {
        id: 'burning_blood_ironclad',
        name: '战士之血',
        description: '每回合结束时回复5点生命值',
        effect: {
          timing: TRIGGER_TIMING.ON_TURN_END,
          type: EFFECT_TYPES.HEAL_END_TURN,
          value: 5
        },
        rarity: RELIC_RARITY.COMMON,
        pool: RELIC_POOL.CHARACTER,
        character: 'ironclad',
        icon: '🔥',
        stackable: false
      },
      {
        id: 'dead_branch_ironclad',
        name: '枯枝',
        description: '每打出3张攻击牌，对所有敌人造成5点伤害',
        effect: {
          timing: TRIGGER_TIMING.ON_CARD_PLAY,
          type: EFFECT_TYPES.DAMAGE_ON_ATTACK,
          value: 5,
          target: 'all_enemies',
          condition: { cardType: 'attack', counter: 3 }
        },
        rarity: RELIC_RARITY.RARE,
        pool: RELIC_POOL.CHARACTER,
        character: 'ironclad',
        icon: '🌿',
        stackable: false
      }
    ];
  }

  /**
   * 验证遗物数据
   * @param {Object} relic - 要验证的遗物对象
   * @returns {boolean} - 是否有效
   */
  validateRelic(relic) {
    const requiredFields = ['id', 'name', 'description', 'effect', 'rarity', 'pool', 'icon'];

    // 检查必需字段
    for (const field of requiredFields) {
      if (relic[field] === undefined || relic[field] === null) {
        console.warn(`遗物 ${relic.id || 'unknown'} 缺少必需字段: ${field}`);
        return false;
      }
    }

    // 验证稀有度
    const validRarities = Object.values(RELIC_RARITY);
    if (!validRarities.includes(relic.rarity)) {
      console.warn(`遗物 ${relic.id} 有无效稀有度: ${relic.rarity}`);
      return false;
    }

    // 验证池
    const validPools = Object.values(RELIC_POOL);
    if (!validPools.includes(relic.pool)) {
      console.warn(`遗物 ${relic.id} 有无效池: ${relic.pool}`);
      return false;
    }

    // 验证效果结构
    if (!relic.effect || typeof relic.effect !== 'object') {
      console.warn(`遗物 ${relic.id} 效果结构无效`);
      return false;
    }

    // 验证触发时机
    if (relic.effect.timing && !Object.values(TRIGGER_TIMING).includes(relic.effect.timing)) {
      console.warn(`遗物 ${relic.id} 有无效触发时机: ${relic.effect.timing}`);
      return false;
    }

    return true;
  }

  /**
   * 移除重复遗物，保留第一个出现的
   * 遗物ID应该是唯一的，如果有重复则跳过后续的重复项
   * @param {Array} relics - 要去重的遗物数组
   * @returns {Array} - 去重后的遗物数组
   */
  removeDuplicateRelics(relics) {
    const seenIds = new Set();
    return relics.filter(relic => {
      if (seenIds.has(relic.id)) {
        console.warn(`发现重复遗物ID: ${relic.id}，跳过重复项`);
        return false;
      }
      seenIds.add(relic.id);
      return true;
    });
  }

  /**
   * 按池分类遗物
   * 将所有遗物按照其 pool 属性分类到对应的遗物池中
   * @private
   */
  classifyRelicsByPool() {
    this.allRelics.forEach(relic => {
      if (this.relicPools[relic.pool]) {
        this.relicPools[relic.pool].push(relic);
      }
    });
  }

  /**
   * 初始化效果触发器映射
   * 为所有触发时机创建空的触发器数组，并将已拥有遗物按时机分类
   * @private
   */
  initializeEffectTriggers() {
    // 清空现有触发器
    this.effectTriggers.clear();

    // 按触发时机分类所有遗物
    Object.values(TRIGGER_TIMING).forEach(timing => {
      this.effectTriggers.set(timing, []);
    });

    // 将已拥有的遗物添加到对应的触发时机
    this.ownedRelics.forEach(relic => {
      if (relic.effect && relic.effect.timing) {
        const triggers = this.effectTriggers.get(relic.effect.timing) || [];
        triggers.push(relic);
        this.effectTriggers.set(relic.effect.timing, triggers);
      }
    });
  }

  /**
   * 授予遗物
   * @param {string} relicId - 遗物ID
   * @returns {boolean} - 是否成功授予
   */
  grantRelic(relicId) {
    // 检查是否已拥有
    if (this.ownedRelics.some(r => r.id === relicId)) {
      console.warn(`${ERRORS.RELIC_ALREADY_OWNED}: 已拥有该遗物 ${relicId}`);
      return false;
    }

    // 查找遗物
    const relic = this.allRelics.find(r => r.id === relicId);
    if (!relic) {
      console.warn(`${ERRORS.RELIC_NOT_FOUND}: 未找到遗物 ${relicId}`);
      return false;
    }

    // 添加到拥有列表
    this.ownedRelics.push({...relic});

    // 更新触发器
    if (relic.effect && relic.effect.timing) {
      const triggers = this.effectTriggers.get(relic.effect.timing) || [];
      triggers.push(relic);
      this.effectTriggers.set(relic.effect.timing, triggers);
    }

    // 同步到游戏状态
    if (this.gameState && this.gameState.playerState) {
      if (!this.gameState.playerState.relics) {
        this.gameState.playerState.relics = [];
      }
      this.gameState.playerState.relics.push(relicId);
    }

    console.log(`[RelicManager] 获得遗物: ${relic.name}`);
    return true;
  }

  /**
   * 移除遗物
   * @param {string} relicId - 遗物ID
   * @returns {boolean} - 是否成功移除
   */
  removeRelic(relicId) {
    const index = this.ownedRelics.findIndex(r => r.id === relicId);
    if (index === -1) {
      console.warn(`${ERRORS.RELIC_NOT_FOUND}: 未拥有遗物 ${relicId}`);
      return false;
    }

    const relic = this.ownedRelics[index];

    // 从拥有列表移除
    this.ownedRelics.splice(index, 1);

    // 更新触发器
    if (relic.effect && relic.effect.timing) {
      const triggers = this.effectTriggers.get(relic.effect.timing) || [];
      const triggerIndex = triggers.findIndex(r => r.id === relicId);
      if (triggerIndex !== -1) {
        triggers.splice(triggerIndex, 1);
        this.effectTriggers.set(relic.effect.timing, triggers);
      }
    }

    // 从游戏状态移除
    if (this.gameState && this.gameState.playerState && this.gameState.playerState.relics) {
      const stateIndex = this.gameState.playerState.relics.indexOf(relicId);
      if (stateIndex !== -1) {
        this.gameState.playerState.relics.splice(stateIndex, 1);
      }
    }

    console.log(`[RelicManager] 移除遗物: ${relic.name}`);
    return true;
  }

  /**
   * 按池获取遗物
   * @param {string} pool - 遗物池
   * @returns {Array} - 遗物数组
   */
  getRelicsByPool(pool) {
    return this.relicPools[pool] || [];
  }

  /**
   * 生成遗物奖励选项
   * @param {string} poolType - 遗物池类型 (all/character/boss/shop)
   * @param {number} count - 生成数量
   * @param {Array} deck - 卡组（用于流派引导）
   * @returns {Array} - 遗物选项数组
   */
  generateRelicReward(poolType, count = 3, deck = null) {
    // 获取指定池的遗物
    let poolRelics = this.getRelicsByPool(poolType);

    // 过滤已拥有的遗物
    poolRelics = poolRelics.filter(relic => !this.hasRelic(relic.id));

    // 如果提供了卡组，应用流派引导算法
    if (deck && deck.length > 0) {
      const weights = this._getRelicWeights(deck);
      // 根据权重进行加权随机选择
      return this._weightedRandomSelect(poolRelics, weights, count);
    }

    // 普通随机选择
    const options = [];
    const availableRelics = [...poolRelics];
    for (let i = 0; i < Math.min(count, availableRelics.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableRelics.length);
      options.push(availableRelics.splice(randomIndex, 1)[0]);
    }

    return options;
  }

  /**
   * 获取遗物权重（流派引导算法）
   * @param {Array} deck - 卡组
   * @returns {Map<string, number>} - 遗物ID到权重的映射
   * @private
   */
  _getRelicWeights(deck) {
    const weights = new Map();

    // 初始化所有遗物权重为1
    this.allRelics.forEach(relic => {
      weights.set(relic.id, 1);
    });

    if (!Array.isArray(deck) || deck.length === 0) {
      return weights;
    }

    // 统计卡牌类型分布
    const typeCounts = { attack: 0, defense: 0, skill: 0 };
    deck.forEach(card => {
      if (card.type && typeCounts[card.type] !== undefined) {
        typeCounts[card.type]++;
      }
    });

    const total = deck.length;
    const attackRatio = typeCounts.attack / total;
    const defenseRatio = typeCounts.defense / total;
    const skillRatio = typeCounts.skill / total;

    // 攻击流派：增加攻击相关遗物权重
    if (attackRatio > 0.4) {
      this.allRelics.forEach(relic => {
        if (this._isAttackRelic(relic)) {
          weights.set(relic.id, (weights.get(relic.id) || 1) * 1.5);
        }
      });
    }

    // 防御流派：增加防御相关遗物权重
    if (defenseRatio > 0.3) {
      this.allRelics.forEach(relic => {
        if (this._isDefenseRelic(relic)) {
          weights.set(relic.id, (weights.get(relic.id) || 1) * 1.3);
        }
      });
    }

    // 技能流派：增加技能相关遗物权重
    if (skillRatio > 0.4) {
      this.allRelics.forEach(relic => {
        if (this._isSkillRelic(relic)) {
          weights.set(relic.id, (weights.get(relic.id) || 1) * 1.4);
        }
      });
    }

    console.log('[RelicManager] 流派引导权重:', Object.fromEntries(weights));
    return weights;
  }

  /**
   * 判断是否为攻击型遗物
   * @param {Object} relic - 遗物对象
   * @returns {boolean}
   * @private
   */
  _isAttackRelic(relic) {
    const attackEffectTypes = [
      EFFECT_TYPES.DAMAGE_ON_ATTACK,
      EFFECT_TYPES.ENERGY_ON_ATTACK
    ];
    return attackEffectTypes.includes(relic.effect?.type);
  }

  /**
   * 判断是否为防御型遗物
   * @param {Object} relic - 遗物对象
   * @returns {boolean}
   * @private
   */
  _isDefenseRelic(relic) {
    const defenseEffectTypes = [
      EFFECT_TYPES.ARMOR_START,
      EFFECT_TYPES.ARMOR_END_TURN,
      EFFECT_TYPES.HEAL_END_TURN
    ];
    return defenseEffectTypes.includes(relic.effect?.type);
  }

  /**
   * 判断是否为技能型遗物
   * @param {Object} relic - 遗物对象
   * @returns {boolean}
   * @private
   */
  _isSkillRelic(relic) {
    const skillEffectTypes = [
      EFFECT_TYPES.DRAW_START,
      EFFECT_TYPES.DRAW_TURN,
      EFFECT_TYPES.DRAW_ON_SKILL,
      EFFECT_TYPES.REDUCE_COST
    ];
    return skillEffectTypes.includes(relic.effect?.type);
  }

  /**
   * 加权随机选择
   * @param {Array} relics - 遗物数组
   * @param {Map} weights - 权重映射
   * @param {number} count - 选择数量
   * @returns {Array} - 选中的遗物数组
   * @private
   */
  _weightedRandomSelect(relics, weights, count) {
    const options = [];
    const availableRelics = [...relics];

    for (let i = 0; i < Math.min(count, availableRelics.length); i++) {
      // 计算总权重
      let totalWeight = 0;
      availableRelics.forEach(relic => {
        totalWeight += weights.get(relic.id) || 1;
      });

      // 随机选择
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let j = 0; j < availableRelics.length; j++) {
        random -= weights.get(availableRelics[j].id) || 1;
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      options.push(availableRelics.splice(selectedIndex, 1)[0]);
    }

    return options;
  }

  /**
   * 根据卡组流派调整遗物池权重（流派引导算法）
   * 分析卡组构成并返回遗物ID到权重的映射，用于遗物奖励生成时的加权随机选择
   * @param {Array} deck - 卡组数组
   * @returns {Map<string, number>} - 遗物ID到权重的映射 (Map<relicId, weight>)
   */
  adjustPoolByArchetype(deck) {
    // 如果没有有效卡组，返回所有遗物的基础权重1
    if (!Array.isArray(deck) || deck.length === 0) {
      const defaultWeights = new Map();
      this.allRelics.forEach(relic => {
        defaultWeights.set(relic.id, 1);
      });
      return defaultWeights;
    }

    // 统计卡牌类型分布
    const typeCounts = { attack: 0, defense: 0, skill: 0 };
    deck.forEach(card => {
      if (card.type && typeCounts[card.type] !== undefined) {
        typeCounts[card.type]++;
      }
    });

    const total = deck.length;
    const attackRatio = typeCounts.attack / total;
    const defenseRatio = typeCounts.defense / total;
    const skillRatio = typeCounts.skill / total;

    // 初始化所有遗物权重为1
    const weights = new Map();
    this.allRelics.forEach(relic => {
      weights.set(relic.id, 1);
    });

    // 攻击流派：增加攻击相关遗物权重
    if (attackRatio > 0.4) {
      this.allRelics.forEach(relic => {
        if (this._isAttackRelic(relic)) {
          weights.set(relic.id, weights.get(relic.id) * 1.5);
        }
      });
    }

    // 防御流派：增加防御相关遗物权重
    if (defenseRatio > 0.3) {
      this.allRelics.forEach(relic => {
        if (this._isDefenseRelic(relic)) {
          weights.set(relic.id, weights.get(relic.id) * 1.3);
        }
      });
    }

    // 技能流派：增加技能相关遗物权重
    if (skillRatio > 0.4) {
      this.allRelics.forEach(relic => {
        if (this._isSkillRelic(relic)) {
          weights.set(relic.id, weights.get(relic.id) * 1.4);
        }
      });
    }

    console.log('[RelicManager] 流派引导权重:', Object.fromEntries(weights));
    return weights;
  }

  /**
   * 触发指定时机的效果
   * @param {string} timing - 触发时机
   * @param {Object} context - 触发上下文 {combatState, card, damage, etc.}
   * @returns {Array} - 触发效果结果数组
   */
  triggerEffects(timing, context = {}) {
    const triggers = this.effectTriggers.get(timing) || [];
    const results = [];

    triggers.forEach(relic => {
      const result = this.executeRelicEffect(relic, context);
      if (result) {
        results.push({
          relicId: relic.id,
          relicName: relic.name,
          effect: result
        });
      }
    });

    return results;
  }

  /**
   * 执行单个遗物的效果
   * 根据遗物效果类型执行相应的效果，包括治疗、护甲、能量、抽牌、伤害等
   * @param {Object} relic - 遗物对象
   * @param {Object} context - 触发上下文 {player, enemy, target, cardManager, gameState等}
   * @returns {Object|null} - 效果执行结果，包含type, timing, value及具体应用值
   * @private
   */
  executeRelicEffect(relic, context) {
    const effect = relic.effect;

    // 检查条件
    if (effect.condition && !this.checkCondition(effect.condition, context)) {
      return null;
    }

    let result = {
      type: effect.type,
      timing: effect.timing,
      value: effect.value || 0
    };

    // 根据效果类型执行
    switch (effect.type) {
      case EFFECT_TYPES.HEAL_END_TURN:
        // 回合结束时回复生命
        if (context.player && context.combatState) {
          const healAmount = Math.min(effect.value, context.player.maxHp - context.player.hp);
          context.player.hp += healAmount;
          result.applied = healAmount;
          console.log(`[Relic] ${relic.name}: 回复 ${healAmount} 点生命`);
        }
        break;

      case EFFECT_TYPES.ARMOR_END_TURN:
      case EFFECT_TYPES.ARMOR_START:
        // 获得护甲
        if (context.player) {
          context.player.armor = (context.player.armor || 0) + effect.value;
          result.applied = effect.value;
          console.log(`[Relic] ${relic.name}: 获得 ${effect.value} 点护甲`);
        }
        break;

      case EFFECT_TYPES.ENERGY_START:
      case EFFECT_TYPES.ENERGY_TURN:
        // 获得能量/最大能量
        if (context.player) {
          if (effect.type === EFFECT_TYPES.ENERGY_START) {
            context.player.maxEnergy = (context.player.maxEnergy || 3) + effect.value;
            result.maxEnergy = context.player.maxEnergy;
          } else {
            context.player.energy = Math.min(
              context.player.maxEnergy || 3,
              (context.player.energy || 0) + effect.value
            );
            result.applied = effect.value;
          }
          console.log(`[Relic] ${relic.name}: 能量变化 ${effect.value}`);
        }
        break;

      case EFFECT_TYPES.DRAW_START:
      case EFFECT_TYPES.DRAW_TURN:
      case EFFECT_TYPES.DRAW_ON_SKILL:
        // 抽牌
        if (context.cardManager && context.cardManager.drawCards) {
          const drawnCards = context.cardManager.drawCards(effect.value || effect.reward);
          result.cardsDrawn = drawnCards.length;
          console.log(`[Relic] ${relic.name}: 抽了 ${drawnCards.length} 张牌`);
        }
        break;

      case EFFECT_TYPES.DAMAGE_ON_ATTACK:
        // 造成伤害
        if (context.target) {
          const damage = effect.value;
          context.target.hp = Math.max(0, context.target.hp - damage);
          result.damage = damage;
          console.log(`[Relic] ${relic.name}: 造成 ${damage} 点伤害`);
        }
        break;

      case EFFECT_TYPES.ENERGY_ON_ATTACK:
        // 打出攻击牌获得能量
        if (context.player) {
          context.player.energy = Math.min(
            context.player.maxEnergy || 3,
            (context.player.energy || 0) + effect.value
          );
          result.applied = effect.value;
          console.log(`[Relic] ${relic.name}: 获得 ${effect.value} 点能量`);
        }
        break;

      case EFFECT_TYPES.REDUCE_COST:
        // 设置费用减免标记
        if (!this._combatFlags) this._combatFlags = {};
        this._combatFlags['firstCardZeroCost'] = true;
        result.triggered = true;
        console.log(`[Relic] ${relic.name}: 本回合第一张牌费用为0`);
        break;

      case EFFECT_TYPES.HEAL_ON_KILL:
        // 敌人死亡时回复生命
        if (context.player && context.enemy && context.enemy.hp <= 0) {
          const healAmount = Math.min(effect.value, context.player.maxHp - context.player.hp);
          context.player.hp += healAmount;
          result.applied = healAmount;
          console.log(`[Relic] ${relic.name}: 敌人死亡回复 ${healAmount} 点生命`);
        }
        break;

      case EFFECT_TYPES.ENERGY_ON_KILL:
        // 敌人死亡时获得能量
        if (context.player && context.enemy && context.enemy.hp <= 0) {
          context.player.energy = Math.min(
            context.player.maxEnergy || 3,
            (context.player.energy || 0) + effect.value
          );
          result.applied = effect.value;
          console.log(`[Relic] ${relic.name}: 敌人死亡获得 ${effect.value} 点能量`);
        }
        break;

      case EFFECT_TYPES.GOLD_ON_KILL:
        // 敌人死亡时获得金币
        if (context.gameState && context.enemy && context.enemy.hp <= 0) {
          context.gameState.playerState.gold =
            (context.gameState.playerState.gold || 0) + effect.value;
          result.applied = effect.value;
          console.log(`[Relic] ${relic.name}: 敌人死亡获得 ${effect.value} 金币`);
        }
        break;

      default:
        console.warn(`[Relic] 未知的遗物效果类型: ${effect.type}`);
        return null;
    }

    return result;
  }

  /**
   * 检查触发条件
   * 验证遗物效果是否满足触发条件（如卡牌类型、回合数、伤害阈值等）
   * @param {Object} condition - 条件对象 {cardType, firstTurn, turns, threshold, counter}
   * @param {Object} context - 触发上下文 {card, turn, damage等}
   * @returns {boolean} - 是否满足条件
   * @private
   */
  checkCondition(condition, context) {
    if (condition.cardType && context.card) {
      if (context.card.type !== condition.cardType) {
        return false;
      }
    }

    if (condition.firstTurn && context.turn) {
      if (context.turn !== 1) {
        return false;
      }
    }

    if (condition.turns && context.turn) {
      if (!condition.turns.includes(context.turn)) {
        return false;
      }
    }

    if (condition.threshold && context.damage) {
      if (context.damage < condition.threshold) {
        return false;
      }
    }

    if (condition.counter) {
      // 计数器条件在 executeRelicEffect 中处理
    }

    return true;
  }

  /**
   * 重置战斗相关状态
   */
  resetCombatState() {
    this._combatFlags = {};
    this.combatCounters = {};
  }

  /**
   * 检查费用减免标记
   * @returns {boolean} - 是否有费用减免
   */
  hasCostReduction() {
    return this._combatFlags && this._combatFlags['firstCardZeroCost'];
  }

  /**
   * 清除费用减免标记
   */
  clearCostReduction() {
    if (this._combatFlags) {
      this._combatFlags['firstCardZeroCost'] = false;
    }
  }

  /**
   * 根据ID获取遗物
   * @param {string} relicId - 遗物ID
   * @returns {Object|null} 遗物对象或null
   */
  getRelic(relicId) {
    return this.allRelics.find(relic => relic.id === relicId) || null;
  }

  /**
   * 检查是否拥有指定遗物
   * @param {string} relicId - 遗物ID
   * @returns {boolean} 是否拥有该遗物
   */
  hasRelic(relicId) {
    return this.ownedRelics.some(r => r.id === relicId);
  }

  /**
   * 按稀有度获取遗物
   * @param {string} rarity - 稀有度 (common/rare/legendary)
   * @returns {Array} 遗物数组
   */
  getRelicsByRarity(rarity) {
    return this.allRelics.filter(r => r.rarity === rarity);
  }

  /**
   * 获取玩家拥有的所有遗物
   * @returns {Array} 遗物数组
   */
  getOwnedRelics() {
    return [...this.ownedRelics];
  }

  /**
   * 获取遗物池信息
   * @returns {Object} 遗物池对象
   */
  getRelicPools() {
    return {
      all: [...this.relicPools[RELIC_POOL.ALL]],
      character: [...this.relicPools[RELIC_POOL.CHARACTER]],
      boss: [...this.relicPools[RELIC_POOL.BOSS]]
    };
  }

  /**
   * 获取当前游戏状态快照
   * @returns {Object} 游戏状态快照
   */
  getState() {
    return {
      ownedRelics: this.ownedRelics.map(r => r.id),
      relicPools: {
        all: this.relicPools[RELIC_POOL.ALL].length,
        character: this.relicPools[RELIC_POOL.CHARACTER].length,
        boss: this.relicPools[RELIC_POOL.BOSS].length
      },
      isLoaded: this.isLoaded,
      combatCounters: {...this.combatCounters},
      combatFlags: {...this._combatFlags}
    };
  }

  /**
   * 从存档加载遗物
   * @param {Array} relicIds - 遗物ID数组
   * @returns {boolean} - 加载是否成功
   */
  loadFromSave(relicIds) {
    if (!Array.isArray(relicIds)) {
      return false;
    }

    this.ownedRelics = [];
    this.effectTriggers.clear();

    // 重新初始化触发器
    Object.values(TRIGGER_TIMING).forEach(timing => {
      this.effectTriggers.set(timing, []);
    });

    // 加载遗物
    let success = true;
    relicIds.forEach(relicId => {
      const relic = this.allRelics.find(r => r.id === relicId);
      if (relic) {
        this.ownedRelics.push({...relic});
        if (relic.effect && relic.effect.timing) {
          const triggers = this.effectTriggers.get(relic.effect.timing) || [];
          triggers.push(relic);
          this.effectTriggers.set(relic.effect.timing, triggers);
        }
      } else {
        console.warn(`无法加载遗物: ${relicId}`);
        success = false;
      }
    });

    return success;
  }
}

// 导出常量和类
export {
  RELIC_RARITY,
  RELIC_POOL,
  TRIGGER_TIMING,
  EFFECT_TYPES,
  ERRORS
};
