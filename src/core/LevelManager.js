/**
 * 关卡管理系统
 * 负责关卡数据加载、初始化、进度管理和奖励发放
 * 基于 .claude/specs/feature/level-manager-spec.md 规范文档
 */

import GameState from './GameState.js';
import { CombatSystem } from './CombatSystem.js';

// 关卡类型常量
const LEVEL_TYPES = {
  NORMAL: 'normal',
  ELITE: 'elite',
  BOSS: 'boss',
  REST: 'rest',
  SHOP: 'shop',
  EVENT: 'event'
};

// 错误代码常量
const ERRORS = {
  LEVEL_NOT_FOUND: 'ERR_LEVEL_NOT_FOUND',
  LEVEL_DATA_INVALID: 'ERR_LEVEL_DATA_INVALID',
  ENEMY_CONFIG_INVALID: 'ERR_ENEMY_CONFIG_INVALID',
  LEVEL_LOCKED: 'ERR_LEVEL_LOCKED',
  REWARD_FAILED: 'ERR_REWARD_FAILED',
  INSUFFICIENT_GOLD: 'ERR_INSUFFICIENT_GOLD',
  REST_SITE_FAILED: 'ERR_REST_SITE_FAILED',
  INVALID_LEVEL_TYPE: 'ERR_INVALID_LEVEL_TYPE'
};

// 奖励规则常量
const REWARD_RULES = {
  NORMAL: {
    goldMin: 20,
    goldMax: 30,
    cardPool: 'basic',
    cardChoices: 3
  },
  ELITE: {
    goldMin: 40,
    goldMax: 60,
    cardPool: 'rare',
    cardChoices: 3
  },
  BOSS: {
    goldMin: 100,
    goldMax: 150,
    cardPool: 'epic',
    cardChoices: 3
  }
};

/**
 * 关卡管理器类
 */
export class LevelManager {
  /**
   * 构造函数
   * @param {GameState} gameState - 游戏状态管理器
   * @param {CombatSystem} combatSystem - 战斗系统
   */
  constructor(gameState = null, combatSystem = null) {
    // 依赖注入
    this.gameState = gameState || new GameState();
    this.combatSystem = combatSystem || new CombatSystem(this.gameState);

    // 关卡数据存储
    this.levels = [];
    this.areas = [];
    this.events = [];

    // 配置选项
    this.dynamicDifficultyEnabled = true;
    this.dataLoaded = false;
    this.loadLevelDataPromise = null;

    // 商店配置
    this.shopCards = [];
    this.shopPrices = [];

    // 缓存
    this.levelCache = new Map();
  }

  /**
   * 加载关卡数据
   * 从 JSON 文件加载关卡配置
   * @returns {Promise<void>}
   */
  async loadLevelData(data = null) {
    if (this.dataLoaded) {
      return Promise.resolve();
    }

    if (this.loadLevelDataPromise) {
      return this.loadLevelDataPromise;
    }

    this.loadLevelDataPromise = new Promise(async (resolve, reject) => {
      try {
        // 如果提供了数据，直接使用
        if (data) {
          this.convertLevelData(data);
        } else {
          // 从 levels.json 加载关卡数据
          const response = await fetch('/data/levels.json');
          if (!response.ok) {
            throw new Error('无法加载关卡数据文件');
          }

          const data = await response.json();
          // 转换为适合游戏的关卡格式
          this.convertLevelData(data);
        }

        // 验证数据完整性
        this.validateAllLevels();

        // 初始化第一关
        if (this.levels.length > 0) {
          this.levels[0].unlocked = true;
        }

        this.dataLoaded = true;
        resolve();

      } catch (error) {
        console.error('加载关卡数据失败:', error);
        // 使用默认关卡作为降级方案
        this.loadDefaultLevels();
        this.dataLoaded = true;
        resolve();
      }
    });

    return this.loadLevelDataPromise;
  }

  /**
   * 转换关卡数据格式
   * @private
   * @param {Object} data - 原始数据
   */
  convertLevelData(data) {
    // 如果测试数据直接包含levels，直接使用
    if (data.levels) {
      this.levels = data.levels;
      return;
    }

    // 处理章节中的关卡
    data.chapters?.forEach(chapter => {
      chapter.levels?.forEach((levelData, index) => {
        const level = this.convertSingleLevel(levelData, chapter.id, index + 1);
        this.levels.push(level);
      });
    });
  }

  /**
   * 转换单个关卡数据
   * @private
   * @param {Object} levelData - 关卡原始数据
   * @param {string} chapterId - 章节ID
   * @param {number} index - 在章节中的索引
   * @returns {Object} 转换后的关卡对象
   */
  convertSingleLevel(levelData, chapterId, index) {
    const levelId = this.levels.length + 1;
    const areaId = parseInt(chapterId.split('_')[1]) || 1;

    const level = {
      id: levelId,
      name: levelData.name,
      type: levelData.type,
      area: areaId,
      difficulty: this.calculateDifficulty(levelData.type, index),
      unlocked: false,
      completed: false,

      // 根据类型配置
      ...(levelData.type === LEVEL_TYPES.REST && {
        options: levelData.options || ['heal', 'upgrade_card', 'remove_card']
      }),

      ...(levelData.type !== LEVEL_TYPES.REST && {
        enemies: this.resolveEnemies(levelData.enemies),
        rewards: this.resolveRewards(levelData.rewards, levelData.type)
      }),

      // 进度相关
      nextChapter: levelData.nextChapter,
      tutorial: levelData.tutorial
    };

    return level;
  }

  /**
   * 计算关卡难度
   * @private
   * @param {string} type - 关卡类型
   * @param {number} index - 在章节中的索引
   * @returns {number} 难度值
   */
  calculateDifficulty(type, index) {
    const base = index * 10;
    switch (type) {
      case LEVEL_TYPES.NORMAL: return Math.min(10, base);
      case LEVEL_TYPES.ELITE: return Math.min(10, base + 5);
      case LEVEL_TYPES.BOSS: return Math.min(10, base + 10);
      case LEVEL_TYPES.REST: return 0;
      case LEVEL_TYPES.SHOP: return Math.min(5, base);
      default: return base;
    }
  }

  /**
   * 解析敌人数据
   * @private
   * @param {Array|string} enemies - 敌人配置
   * @returns {Array} 敌人配置数组
   */
  resolveEnemies(enemies) {
    if (!enemies) return [];

    // 从 enemies.json 加载敌人详情
    return enemies.map(enemyId => {
      // 这里应该从 enemies.json 加载实际数据
      // 现在使用默认配置
      return {
        enemyId,
        hp: this.getEnemyHP(enemyId),
        attack: this.getEnemyAttack(enemyId),
        armor: this.getEnemyArmor(enemyId),
        skills: this.getEnemySkills(enemyId),
        aiType: this.getEnemyAIType(enemyId)
      };
    });
  }

  /**
   * 解析奖励数据
   * @private
   * @param {Object} rewards - 奖励配置
   * @param {string} levelType - 关卡类型
   * @returns {Object} 奖励配置
   */
  resolveRewards(rewards, levelType) {
    const baseRules = REWARD_RULES[levelType] || REWARD_RULES.NORMAL;

    return {
      goldMin: rewards?.gold || baseRules.goldMin,
      goldMax: rewards?.gold || baseRules.goldMax,
      cardPool: rewards?.cards ? this.getCardPool(levelType, rewards.cards) : this.getCardPool(levelType),
      cardChoices: rewards?.cards ? rewards.cards : baseRules.cardChoices,
      itemPool: rewards?.items || []
    };
  }

  /**
   * 根据关卡类型获取卡牌池
   * @private
   * @param {string} levelType - 关卡类型
   * @param {number} count - 卡牌数量
   * @returns {Array} 卡牌ID数组
   */
  getCardPool(levelType, count = null) {
    // 这里应该从 cards.json 加载实际数据
    const pools = {
      [LEVEL_TYPES.NORMAL]: ['basic_attack', 'basic_defense', 'basic_skill'],
      [LEVEL_TYPES.ELITE]: ['rare_attack', 'rare_defense', 'rare_skill'],
      [LEVEL_TYPES.BOSS]: ['epic_attack', 'epic_defense', 'legendary_skill']
    };

    return pools[levelType] || pools[LEVEL_TYPES.NORMAL];
  }

  /**
   * 获取敌人HP
   * @private
   * @param {string} enemyId - 敌人ID
   * @returns {number} HP值
   */
  getEnemyHP(enemyId) {
    const hpMap = {
      'goblin_minion': 30,
      'goblin_warrior': 50,
      'forest_guardian': 80,
      'dark_mage': 60,
      'boss_forest_king': 150
    };
    return hpMap[enemyId] || 30;
  }

  /**
   * 获取敌人攻击力
   * @private
   * @param {string} enemyId - 敌人ID
   * @returns {number} 攻击力
   */
  getEnemyAttack(enemyId) {
    const attackMap = {
      'goblin_minion': 10,
      'goblin_warrior': 15,
      'forest_guardian': 20,
      'dark_mage': 25,
      'boss_forest_king': 30
    };
    return attackMap[enemyId] || 10;
  }

  /**
   * 获取敌人护甲
   * @private
   * @param {string} enemyId - 敌人ID
   * @returns {number} 护甲值
   */
  getEnemyArmor(enemyId) {
    const armorMap = {
      'goblin_minion': 5,
      'goblin_warrior': 10,
      'forest_guardian': 15,
      'dark_mage': 5,
      'boss_forest_king': 20
    };
    return armorMap[enemyId] || 5;
  }

  /**
   * 获取敌人技能
   * @private
   * @param {string} enemyId - 敌人ID
   * @returns {Array} 技能数组
   */
  getEnemySkills(enemyId) {
    const skillsMap = {
      'goblin_minion': ['attack'],
      'goblin_warrior': ['attack', 'defend'],
      'forest_guardian': ['attack', 'defend', 'skill'],
      'dark_mage': ['skill', 'curse'],
      'boss_forest_king': ['rage', 'summon', 'meteor']
    };
    return skillsMap[enemyId] || ['attack'];
  }

  /**
   * 获取敌人AI类型
   * @private
   * @param {string} enemyId - 敌人ID
   * @returns {string} AI类型
   */
  getEnemyAIType(enemyId) {
    if (enemyId.includes('boss')) return 'special';
    if (enemyId.includes('guardian') || enemyId.includes('mage')) return 'defensive';
    return 'aggressive';
  }

  /**
   * 加载默认关卡（降级方案）
   * @private
   */
  loadDefaultLevels() {
    this.levels = [
      {
        id: 1,
        name: "初次战斗",
        type: LEVEL_TYPES.NORMAL,
        area: 1,
        difficulty: 1,
        unlocked: true,
        completed: false,
        enemies: [{
          enemyId: 'goblin_minion',
          hp: 30,
          attack: 10,
          armor: 5,
          skills: ['attack'],
          aiType: 'aggressive'
        }],
        rewards: {
          goldMin: 20,
          goldMax: 30,
          cardPool: ['basic_attack', 'basic_defense', 'basic_skill'],
          cardChoices: 3,
          itemPool: []
        }
      },
      {
        id: 2,
        name: "精英守卫",
        type: LEVEL_TYPES.ELITE,
        area: 1,
        difficulty: 2,
        unlocked: false,
        completed: false,
        enemies: [{
          enemyId: 'forest_guardian',
          hp: 80,
          attack: 20,
          armor: 15,
          skills: ['attack', 'defend', 'skill'],
          aiType: 'defensive'
        }],
        rewards: {
          goldMin: 40,
          goldMax: 60,
          cardPool: ['rare_attack', 'rare_defense', 'rare_skill'],
          cardChoices: 3,
          itemPool: []
        }
      },
      {
        id: 3,
        name: "森林之王",
        type: LEVEL_TYPES.BOSS,
        area: 1,
        difficulty: 3,
        unlocked: false,
        completed: false,
        enemies: [{
          enemyId: 'boss_forest_king',
          hp: 150,
          attack: 30,
          armor: 20,
          skills: ['rage', 'summon', 'meteor'],
          aiType: 'special'
        }],
        rewards: {
          goldMin: 100,
          goldMax: 150,
          cardPool: ['epic_attack', 'epic_defense', 'legendary_skill'],
          cardChoices: 3,
          itemPool: ['relic']
        }
      },
      {
        id: 4,
        name: "森林休息点",
        type: LEVEL_TYPES.REST,
        area: 1,
        difficulty: 0,
        unlocked: true,
        completed: false,
        options: ['heal', 'upgrade_card', 'remove_card']
      },
      {
        id: 5,
        name: "神秘商人",
        type: LEVEL_TYPES.SHOP,
        area: 1,
        difficulty: 1,
        unlocked: true,
        completed: false,
        rewards: {
          goldMin: 0,
          goldMax: 0,
          cardPool: ['basic_card', 'basic_card', 'basic_card'],
          cardChoices: 0,
          itemPool: []
        }
      }
    ];
  }

  /**
   * 验证所有关卡数据
   * @private
   */
  validateAllLevels() {
    const invalidLevels = this.levels.filter(level => !this.validateLevelData(level));
    if (invalidLevels.length > 0) {
      console.warn('发现无效关卡数据:', invalidLevels);
    }
  }

  /**
   * 获取关卡数据
   * @param {number} levelId - 关卡ID
   * @returns {Object} 关卡数据
   * @throws {Error} 如果关卡不存在
   */
  getLevel(levelId) {
    const level = this.levels.find(l => l.id === levelId);
    if (!level) {
      throw new Error(`${ERRORS.LEVEL_NOT_FOUND}: ${levelId}`);
    }
    return level;
  }

  /**
   * 加载关卡
   * @param {number} levelId - 关卡ID
   * @returns {Promise<Object>} 关卡数据
   */
  async loadLevel(levelId) {
    const level = this.getLevel(levelId);

    if (!level.unlocked) {
      throw new Error(ERRORS.LEVEL_LOCKED);
    }

    // 更新游戏状态
    this.gameState.progressState.currentLevel = levelId;
    this.gameState.progressState.currentArea = level.area;

    // 根据关卡类型初始化
    switch (level.type) {
      case LEVEL_TYPES.NORMAL:
      case LEVEL_TYPES.ELITE:
      case LEVEL_TYPES.BOSS:
        await this.initCombatLevel(levelId);
        break;
      case LEVEL_TYPES.REST:
        await this.initRestSite(levelId);
        break;
      case LEVEL_TYPES.SHOP:
        await this.initShop(levelId);
        break;
      case LEVEL_TYPES.EVENT:
        await this.initEvent(levelId);
        break;
      default:
        throw new Error(`${ERRORS.INVALID_LEVEL_TYPE}: ${level.type}`);
    }

    return level;
  }

  /**
   * 初始化战斗关卡
   * @param {number} levelId - 关卡ID
   * @returns {Promise<void>}
   */
  async initCombatLevel(levelId) {
    const level = this.getLevel(levelId);

    // 验证敌人配置
    if (!level.enemies || level.enemies.length === 0) {
      throw new Error(ERRORS.ENEMY_CONFIG_INVALID);
    }

    // 应用动态难度调整
    if (this.dynamicDifficultyEnabled) {
      const difficulty = this.adjustDifficulty(
        level.difficulty,
        this.getPlayerPerformance()
      );
      this.applyDifficultyAdjustment(level.enemies, difficulty);
    }

    // 初始化战斗
    this.combatSystem.startCombat(level.enemies[0]);

    return Promise.resolve();
  }

  /**
   * 初始化休息点
   * @param {number} levelId - 关卡ID
   * @returns {Promise<void>}
   */
  async initRestSite(levelId) {
    const level = this.getLevel(levelId);

    // 验证休息点配置
    if (!level.options) {
      level.options = ['heal', 'upgrade_card', 'remove_card'];
    }

    // 自动回复30%生命值
    const healAmount = Math.floor(this.gameState.playerState.maxHp * 0.3);
    this.gameState.playerState.hp = Math.min(
      this.gameState.playerState.maxHp,
      this.gameState.playerState.hp + healAmount
    );

    return Promise.resolve();
  }

  /**
   * 初始化商店
   * @param {number} levelId - 关卡ID
   * @returns {Promise<void>}
   */
  async initShop(levelId) {
    const level = this.getLevel(levelId);

    // 生成随机商店商品
    this.shopCards = this.generateShopCards(level.difficulty);
    this.shopPrices = this.calculateShopPrices(level.difficulty);

    return Promise.resolve();
  }

  /**
   * 初始化随机事件
   * @param {number} levelId - 关卡ID
   * @returns {Promise<void>}
   */
  async initEvent(levelId) {
    // 这里可以实现随机事件逻辑
    // 暂时返回空实现
    return Promise.resolve();
  }

  /**
   * 完成关卡
   * @param {number} levelId - 关卡ID
   * @returns {Promise<Object>} 下一关数据或null
   */
  async completeLevel(levelId) {
    const level = this.getLevel(levelId);
    level.completed = true;

    // 添加到已完成关卡列表
    if (!this.gameState.progressState.completedLevels.includes(levelId)) {
      this.gameState.progressState.completedLevels.push(levelId);
    }

    // 更新最大关卡记录
    if (levelId > this.gameState.progressState.maxLevel) {
      this.gameState.progressState.maxLevel = levelId;
    }

    // 解锁下一关
    const nextLevel = this.getNextLevel(levelId);
    if (nextLevel) {
      nextLevel.unlocked = true;
    }

    // 检查是否解锁新区域
    this.checkAreaUnlock(level);

    // 自动保存（如果支持）
    if (this.gameState.autoSave) {
      await this.gameState.autoSave();
    }

    return Promise.resolve(nextLevel);
  }

  /**
   * 生成关卡奖励
   * @param {number} levelId - 关卡ID
   * @returns {Array} 奖励数组
   */
  generateRewards(levelId) {
    const level = this.getLevel(levelId);
    const rewards = [];

    // 普通战：金币 + 卡牌选择
    if (level.type === LEVEL_TYPES.NORMAL) {
      rewards.push({
        type: 'gold',
        amount: Math.floor(Math.random() * (level.rewards.goldMax - level.rewards.goldMin + 1)) + level.rewards.goldMin
      });
      // 添加卡牌选择奖励
      rewards.push({
        type: 'card_choice',
        cards: this.generateRandomCards(3, ['common', 'rare'])
      });
      return rewards;
    }

    // 精英战：更多金币 + 更好的卡牌选择
    if (level.type === LEVEL_TYPES.ELITE) {
      rewards.push({
        type: 'gold',
        amount: Math.floor(Math.random() * (level.rewards.goldMax - level.rewards.goldMin + 1)) + level.rewards.goldMin
      });
      // 添加卡牌选择奖励（可能包含稀有卡）
      rewards.push({
        type: 'card_choice',
        cards: this.generateRandomCards(3, ['common', 'rare'], true)
      });
      return rewards;
    }

    // BOSS战：金币 + 稀有卡牌选择
    if (level.type === LEVEL_TYPES.BOSS) {
      rewards.push({
        type: 'gold',
        amount: Math.floor(Math.random() * (level.rewards.goldMax - level.rewards.goldMin + 1)) + level.rewards.goldMin
      });
      // 添加卡牌选择奖励（包含史诗卡）
      rewards.push({
        type: 'card_choice',
        cards: this.generateRandomCards(3, ['rare', 'epic'], true)
      });
      return rewards;
    }

    // 休息点和商店不生成奖励
    return rewards;
  }

  /**
   * 生成随机卡牌供玩家选择
   * @param {number} count - 生成的卡牌数量
   * @param {Array<string>} rarities - 允许的稀有度
   * @param {boolean} guaranteeHigher - 是否保证至少一张更高稀有度的卡
   * @returns {Array} 随机卡牌数组
   */
  generateRandomCards(count = 3, rarities = ['common', 'rare'], guaranteeHigher = false) {
    const cards = [];

    // 获取所有可用卡牌（从 CardManager）
    const availableCards = this.cardManager && this.cardManager.allCards
      ? [...this.cardManager.allCards]
      : [];

    if (availableCards.length === 0) {
      console.warn('[LevelManager] 没有可用的卡牌数据');
      return cards;
    }

    // 按稀有度分类
    const cardsByRarity = {
      common: availableCards.filter(c => c.rarity === 'common'),
      rare: availableCards.filter(c => c.rarity === 'rare'),
      epic: availableCards.filter(c => c.rarity === 'epic')
    };

    for (let i = 0; i < count; i++) {
      let selectedCard = null;

      // 如果需要保证更高稀有度，且是第一张卡
      if (guaranteeHigher && i === 0 && cardsByRarity.rare.length > 0) {
        selectedCard = cardsByRarity.rare[Math.floor(Math.random() * cardsByRarity.rare.length)];
      } else {
        // 根据稀有度权重随机选择
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const pool = cardsByRarity[rarity] || cardsByRarity.common;

        if (pool && pool.length > 0) {
          selectedCard = pool[Math.floor(Math.random() * pool.length)];
        }
      }

      if (selectedCard) {
        cards.push({ ...selectedCard }); // 创建副本避免修改原数据
      }
    }

    return cards;
  }

  /**
   * 发放奖励
   * @param {Object} reward - 奖励对象
   * @param {Object} gameState - 游戏状态（可选，默认使用this.gameState）
   * @returns {Promise<void>}
   */
  async giveReward(reward, gameState = this.gameState) {
    if (!gameState) {
      throw new Error(ERRORS.REWARD_FAILED);
    }

    switch (reward.type) {
      case 'gold':
        if (gameState.playerState) {
          gameState.playerState.gold += reward.amount;
        } else {
          gameState.gold += reward.amount;
        }
        break;

      case 'card_choice':
        // 玩家选择卡牌的逻辑将在UI层处理
        // 这里只是提供选择
        break;

      case 'item':
        // 处理道具
        if (!gameState.playerState.unlockedItems) {
          gameState.playerState.unlockedItems = [];
        }
        gameState.playerState.unlockedItems.push(reward.itemId);
        break;

      default:
        throw new Error(`未知的奖励类型: ${reward.type}`);
    }

    // 触发奖励发放事件
    this.onRewardGiven(reward);
  }

  /**
   * 解锁关卡
   * @param {number} levelId - 关卡ID
   * @returns {Object} 解锁的关卡数据
   */
  unlockLevel(levelId) {
    const level = this.getLevel(levelId);
    level.unlocked = true;
    return level;
  }

  /**
   * 获取区域的所有关卡
   * @param {number} areaId - 区域ID
   * @returns {Array} 关卡数组
   */
  getLevelsByArea(areaId) {
    return this.levels.filter(level => level.area === areaId);
  }

  /**
   * 获取下一关
   * @param {number} levelId - 当前关卡ID
   * @returns {Object|null} 下一关数据或null
   */
  getNextLevel(levelId) {
    const currentLevel = this.getLevel(levelId);
    const areaLevels = this.getLevelsByArea(currentLevel.area);
    const currentIndex = areaLevels.findIndex(l => l.id === levelId);

    if (currentIndex >= 0 && currentIndex < areaLevels.length - 1) {
      return areaLevels[currentIndex + 1];
    }

    // 检查下一区域
    const nextArea = this.areas.find(a => a.id > currentLevel.area);
    if (nextArea) {
      return this.levels.find(l => l.area === nextArea.id);
    }

    return null;
  }

  /**
   * 检查关卡是否解锁
   * @param {number} levelId - 关卡ID
   * @returns {boolean} 是否已解锁
   */
  isLevelUnlocked(levelId) {
    const level = this.getLevel(levelId);
    return level.unlocked;
  }

  /**
   * 动态难度调整
   * @param {number} baseDifficulty - 基础难度
   * @param {number} playerPerformance - 玩家表现（0-1）
   * @returns {number} 调整后的难度
   */
  adjustDifficulty(baseDifficulty, playerPerformance = 0.5) {
    if (!this.dynamicDifficultyEnabled) {
      return baseDifficulty;
    }

    // 根据玩家表现调整难度
    let adjustment = 0;
    if (playerPerformance > 0.7) {
      // 表现好，增加难度
      adjustment = Math.min(baseDifficulty * 0.2, 2);
    } else if (playerPerformance < 0.3) {
      // 表现差，降低难度
      adjustment = Math.max(-baseDifficulty * 0.2, -2);
    }

    const adjusted = Math.max(1, baseDifficulty + adjustment);
    // 确保不超过最大难度（根据测试要求是10）
    return Math.min(10, adjusted);
  }

  /**
   * 应用难度调整到敌人
   * @private
   * @param {Array} enemies - 敌人数组
   * @param {number} difficulty - 难度系数
   */
  applyDifficultyAdjustment(enemies, difficulty) {
    enemies.forEach(enemy => {
      // 调整HP、攻击力和护甲
      const multiplier = 1 + (difficulty - 5) * 0.1; // ±10%调整
      enemy.hp = Math.floor(enemy.hp * multiplier);
      enemy.attack = Math.floor(enemy.attack * multiplier);
      enemy.armor = Math.floor(enemy.armor * multiplier);
    });
  }

  /**
   * 获取玩家表现
   * @private
   * @returns {number} 表现分数（0-1）
   */
  getPlayerPerformance() {
    const completed = this.gameState.progressState.completedLevels.length;
    const total = this.levels.length;

    // 简单的表现计算：完成关卡数 / 总关卡数
    // 实际游戏中应该基于胜率、用时等更复杂的指标
    return Math.min(1, completed / total);
  }

  /**
   * 检查区域解锁
   * @private
   * @param {Object} level - 当前关卡
   */
  checkAreaUnlock(level) {
    // 如果是BOSS关卡且有关卡指定下一章节，解锁新区域
    if (level.type === LEVEL_TYPES.BOSS && level.nextChapter) {
      const newAreaId = parseInt(level.nextChapter.split('_')[1]);
      if (newAreaId) {
        // 解锁新区域的所有关卡
        this.getLevelsByArea(newAreaId).forEach(l => {
          l.unlocked = true;
        });
      }
    }
  }

  /**
   * 生成商店卡牌
   * @private
   * @param {number} difficulty - 难度等级
   * @returns {Array} 卡牌数组
   */
  generateShopCards(difficulty) {
    const cardRarity = ['basic', 'rare', 'epic'];
    const selectedRarity = cardRarity[Math.min(Math.floor(difficulty / 3), 2)];

    // 从卡池中选择随机卡牌
    const availableCards = this.getCardPool(selectedRarity);
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, 3); // 提供3张卡牌选择
  }

  /**
   * 计算商店价格
   * @private
   * @param {number} difficulty - 难度等级
   * @returns {Array} 价格数组
   */
  calculateShopPrices(difficulty) {
    const basePrice = difficulty * 20;
    const variation = Math.floor(basePrice * 0.2); // ±20%变化

    return this.shopCards.map(() => {
      return basePrice + Math.floor(Math.random() * variation * 2) - variation;
    });
  }

  /**
   * 购买商店商品
   * @param {number} cardIndex - 卡牌索引
   * @returns {Promise<boolean>} 购买是否成功
   */
  async buyShopCard(cardIndex) {
    if (cardIndex < 0 || cardIndex >= this.shopCards.length) {
      throw new Error('无效的卡牌索引');
    }

    const price = this.shopPrices[cardIndex];
    if (this.gameState.playerState.gold < price) {
      throw new Error(ERRORS.INSUFFICIENT_GOLD);
    }

    // 扣除金币
    this.gameState.playerState.gold -= price;

    // 添加卡牌到卡组
    const cardId = this.shopCards[cardIndex];
    if (!this.gameState.playerState.deck.includes(cardId)) {
      this.gameState.playerState.deck.push(cardId);
    }

    // 移除已购买的卡牌
    this.shopCards.splice(cardIndex, 1);
    this.shopPrices.splice(cardIndex, 1);

    // 自动保存（如果支持）
    if (this.gameState.autoSave) {
      await this.gameState.autoSave();
    }

    return true;
  }

  /**
   * 验证关卡数据完整性
   * @param {Object} level - 关卡数据
   * @returns {boolean} 是否有效
   */
  validateLevelData(level) {
    if (!level || typeof level !== 'object') {
      return false;
    }

    if (!level.id || typeof level.id !== 'number') {
      return false;
    }

    if (!level.name || typeof level.name !== 'string') {
      return false;
    }

    const validTypes = Object.values(LEVEL_TYPES);
    if (!validTypes.includes(level.type)) {
      return false;
    }

    if (level.area === undefined || typeof level.area !== 'number') {
      return false;
    }

    if (level.difficulty === undefined || typeof level.difficulty !== 'number') {
      return false;
    }

    // 验证战斗关卡
    if ([LEVEL_TYPES.NORMAL, LEVEL_TYPES.ELITE, LEVEL_TYPES.BOSS].includes(level.type)) {
      if (!level.enemies || !Array.isArray(level.enemies)) {
        return false;
      }

      if (level.enemies.length === 0) {
        return false;
      }

      // 验证敌人配置
      for (const enemy of level.enemies) {
        if (!enemy.enemyId || !enemy.hp || !enemy.attack) {
          return false;
        }
      }
    }

    // 验证奖励配置
    if (level.rewards) {
      if (level.rewards.goldMin !== undefined && typeof level.rewards.goldMin !== 'number') {
        return false;
      }
      if (level.rewards.goldMax !== undefined && typeof level.rewards.goldMax !== 'number') {
        return false;
      }
    }

    if (level.completed === undefined || typeof level.completed !== 'boolean') {
      return false;
    }

    if (level.unlocked === undefined || typeof level.unlocked !== 'boolean') {
      return false;
    }

    return true;
  }

  /**
   * 获取当前战斗状态
   * @returns {Object|null} 战斗状态
   */
  getCombatState() {
    return this.combatSystem.getCombatState();
  }

  /**
   * 获取战斗日志
   * @returns {Array} 战斗日志
   */
  getCombatLog() {
    return this.combatSystem.getCombatLog();
  }

  /**
   * 奖励发放回调
   * @private
   * @param {Object} reward - 奖励对象
   */
  onRewardGiven(reward) {
    // 可以在这里添加奖励发放后的逻辑
    // 例如：触发音效、显示动画等
    console.log('奖励已发放:', reward);
  }

  /**
   * 重置关卡进度
   * @returns {Promise<void>}
   */
  async resetProgress() {
    this.levels.forEach(level => {
      level.unlocked = level.id === 1; // 只解锁第一关
      level.completed = false;
    });

    // 重置游戏状态
    await this.gameState.initNewGame();
  }

  /**
   * 获取游戏统计信息
   * @returns {Object} 统计信息
   */
  getGameStats() {
    return {
      totalLevels: this.levels.length,
      completedLevels: this.gameState.progressState.completedLevels.length,
      currentLevel: this.gameState.progressState.currentLevel,
      currentArea: this.gameState.progressState.currentArea,
      maxLevel: this.gameState.progressState.maxLevel,
      completionRate: this.gameState.progressState.completedLevels.length / this.levels.length
    };
  }
}

