/**
 * MetaProgressionSystem - 元进度和成就系统
 *
 * 负责跨游戏的元进度管理，包括成就解锁、角色解锁、内容解锁等功能
 * 所有元进度使用 localStorage 持久化保存
 *
 * @class
 */

// ==================== 常量定义 ====================

// 成就类型常量
const ACHIEVEMENT_TYPES = {
  COMBAT: 'combat',           // 战斗相关成就
  EXPLORATION: 'exploration', // 探索相关成就
  COLLECTION: 'collection',   // 收集相关成就
  MILESTONE: 'milestone',     // 里程碑成就
  SECRET: 'secret'            // 隐藏成就
};

// 成就稀有度常量
const ACHIEVEMENT_RARITY = {
  COMMON: 'common',       // 普通成就
  RARE: 'rare',          // 稀有成就
  EPIC: 'epic',          // 史诗成就
  LEGENDARY: 'legendary' // 传说成就
};

// 解锁内容类型常量
const UNLOCK_TYPES = {
  CHARACTER: 'character',   // 角色解锁
  RELIC: 'relic',          // 起始遗物解锁
  CARD: 'card',            // 卡牌解锁
  ARTIFACT: 'artifact',    // 神器解锁
  STARTER_DECK: 'starter_deck' // 起始卡组解锁
};

// 本存储键名
const STORAGE_KEYS = {
  META_PROGRESS: 'game_flow_meta_progress',
  ACHIEVEMENTS: 'game_flow_achievements',
  UNLOCKED_CONTENT: 'game_flow_unlocked_content',
  STATS: 'game_flow_stats'
};

// 错误代码常量
const ERROR_CODES = {
  ACHIEVEMENT_NOT_FOUND: 'ERR_ACHIEVEMENT_NOT_FOUND',
  INVALID_CONDITION: 'ERR_INVALID_CONDITION',
  SAVE_FAILED: 'ERR_SAVE_FAILED',
  LOAD_FAILED: 'ERR_LOAD_FAILED',
  INVALID_UNLOCK_TYPE: 'ERR_INVALID_UNLOCK_TYPE'
};

// ==================== 成就数据定义 ====================

// 默认成就列表
const DEFAULT_ACHIEVEMENTS = [
  // ========== 战斗成就 ==========
  {
    id: 'first_boss_kill',
    name: '初露锋芒',
    description: '首次击败任意Boss',
    type: ACHIEVEMENT_TYPES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '⚔️',
    condition: {
      type: 'boss_defeated',
      count: 1,
      anyBoss: true
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'burning_blood',
      name: '燃烧之血（起始遗物）'
    },
    hidden: false
  },
  {
    id: 'boss_kill_no_damage',
    name: '完美胜利',
    description: '无伤击败任意Boss',
    type: ACHIEVEMENT_TYPES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '🛡️',
    condition: {
      type: 'boss_defeated',
      damageTaken: 0,
      anyBoss: true
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'energy_bonus',
      name: '能量之石（起始遗物）'
    },
    hidden: false
  },
  {
    id: 'kill_100_enemies',
    name: '猎人',
    description: '累计击败100个敌人',
    type: ACHIEVEMENT_TYPES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🎯',
    condition: {
      type: 'enemies_killed',
      count: 100
    },
    reward: {
      type: UNLOCK_TYPES.CARD,
      id: 'attack_powerful',
      name: '强力打击（解锁卡牌）'
    },
    hidden: false
  },
  {
    id: 'kill_500_enemies',
    name: '屠戮者',
    description: '累计击败500个敌人',
    type: ACHIEVEMENT_TYPES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    icon: '💀',
    condition: {
      type: 'enemies_killed',
      count: 500
    },
    reward: {
      type: UNLOCK_TYPES.CHARACTER,
      id: 'berserker',
      name: '狂战士（新角色）'
    },
    hidden: false
  },

  // ========== 探索成就 ==========
  {
    id: 'reach_floor_50',
    name: '登高者',
    description: '到达第50层',
    type: ACHIEVEMENT_TYPES.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '🏔️',
    condition: {
      type: 'max_floor',
      floor: 50
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'bag_of_preparation',
      name: '准备袋（起始遗物）'
    },
    hidden: false
  },
  {
    id: 'complete_game',
    name: '征服者',
    description: '通关游戏',
    type: ACHIEVEMENT_TYPES.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '👑',
    condition: {
      type: 'game_completed',
      wins: 1
    },
    reward: {
      type: UNLOCK_TYPES.CHARACTER,
      id: 'paladin',
      name: '圣骑士（新角色）'
    },
    hidden: false
  },
  {
    id: 'visit_all_events',
    name: '探险家',
    description: '触发所有类型的事件',
    type: ACHIEVEMENT_TYPES.EXPLORATION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🗺️',
    condition: {
      type: 'events_discovered',
      uniqueEvents: true,
      count: 'all'
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'courier',
      name: '信使（起始遗物）'
    },
    hidden: false
  },

  // ========== 收集成就 ==========
  {
    id: 'collect_10_relics',
    name: '收藏家',
    description: '单次游戏收集10个遗物',
    type: ACHIEVEMENT_TYPES.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '📿',
    condition: {
      type: 'relics_collected',
      count: 10,
      singleRun: true
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'lantern',
      name: '提灯（起始遗物）'
    },
    hidden: false
  },
  {
    id: 'collect_30_cards',
    name: '卡牌大师',
    description: '单次游戏收集30张卡牌',
    type: ACHIEVEMENT_TYPES.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🎴',
    condition: {
      type: 'cards_collected',
      count: 30,
      singleRun: true
    },
    reward: {
      type: UNLOCK_TYPES.CARD,
      id: 'skill_tempo',
      name: '战斗节奏（解锁卡牌）'
    },
    hidden: false
  },
  {
    id: 'collect_all_common_relics',
    name: '遗物收集者',
    description: '收集所有普通遗物',
    type: ACHIEVEMENT_TYPES.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '💎',
    condition: {
      type: 'relics_collected',
      rarity: 'common',
      count: 'all'
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'bag_of_prep',
      name: '行囊（起始遗物）'
    },
    hidden: false
  },

  // ========== 里程碑成就 ==========
  {
    id: 'play_10_games',
    name: '坚持不懈',
    description: '游玩10局游戏',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '🎮',
    condition: {
      type: 'games_played',
      count: 10
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'anchor',
      name: '锚（起始遗物）'
    },
    hidden: false
  },
  {
    id: 'win_5_games',
    name: '胜利者',
    description: '赢得5局游戏',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🏆',
    condition: {
      type: 'games_won',
      count: 5
    },
    reward: {
      type: UNLOCK_TYPES.STARTER_DECK,
      id: 'defense_starter',
      name: '防御起始卡组'
    },
    hidden: false
  },
  {
    id: 'earn_10000_gold',
    name: '大富翁',
    description: '累计获得10000金币',
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '💰',
    condition: {
      type: 'gold_earned',
      count: 10000
    },
    reward: {
      type: UNLOCK_TYPES.RELIC,
      id: 'brimstone',
      name: '硫磺（起始遗物）'
    },
    hidden: false
  },

  // ========== 隐藏成就 ==========
  {
    id: 'secret_combo',
    name: '流派大师',
    description: '使用攻击流派击败Boss',
    type: ACHIEVEMENT_TYPES.SECRET,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '🔮',
    condition: {
      type: 'boss_defeated_with_archetype',
      archetype: 'attack',
      ratio: 0.5
    },
    reward: {
      type: UNLOCK_TYPES.ARTIFACT,
      id: 'attack_artifact',
      name: '攻击之书'
    },
    hidden: true
  },
  {
    id: 'defense_master',
    name: '坚不可摧',
    description: '使用防御流派击败Boss',
    type: ACHIEVEMENT_TYPES.SECRET,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '🏰',
    condition: {
      type: 'boss_defeated_with_archetype',
      archetype: 'defense',
      ratio: 0.4
    },
    reward: {
      type: UNLOCK_TYPES.ARTIFACT,
      id: 'defense_artifact',
      name: '防御之书'
    },
    hidden: true
  },
  {
    id: 'speed_runner',
    name: '速通者',
    description: '在30分钟内通关游戏',
    type: ACHIEVEMENT_TYPES.SECRET,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    icon: '⏱️',
    condition: {
      type: 'speed_run',
      minutes: 30
    },
    reward: {
      type: UNLOCK_TYPES.CHARACTER,
      id: 'assassin',
      name: '刺客（新角色）'
    },
    hidden: true
  },
  {
    id: 'ascension_10',
    name: '挑战者',
    description: '在Ascension 10+难度下击败Boss',
    type: ACHIEVEMENT_TYPES.SECRET,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    icon: '🔥',
    condition: {
      type: 'boss_defeated',
      ascension: 10,
      anyBoss: true
    },
    reward: {
      type: UNLOCK_TYPES.ARTIFACT,
      id: 'ascension_crown',
      name: '挑战之冠'
    },
    hidden: true
  }
];

// 默认角色列表
const DEFAULT_CHARACTERS = [
  {
    id: 'ironclad',
    name: '铁血战士',
    description: '擅长攻击和力量积累',
    icon: '⚔️',
    startingRelic: 'burning_blood_ironclad',
    startingHp: 80,
    unlocked: true,
    unlockCondition: null // 默认解锁
  },
  {
    id: 'berserker',
    name: '狂战士',
    description: '以生命换取力量',
    icon: '😤',
    startingRelic: 'dead_branch_ironclad',
    startingHp: 70,
    unlocked: false,
    unlockCondition: {
      achievementId: 'kill_500_enemies'
    }
  },
  {
    id: 'paladin',
    name: '圣骑士',
    description: '防御与恢复的专家',
    icon: '🛡️',
    startingRelic: 'blood_vial',
    startingHp: 90,
    unlocked: false,
    unlockCondition: {
      achievementId: 'complete_game'
    }
  },
  {
    id: 'assassin',
    name: '刺客',
    description: '高速高伤害的致命打击者',
    icon: '🗡️',
    startingRelic: 'bag_of_prep',
    startingHp: 60,
    unlocked: false,
    unlockCondition: {
      achievementId: 'speed_runner'
    }
  }
];

// ==================== MetaProgressionSystem 类 ====================

/**
 * 元进度系统类
 */
export class MetaProgressionSystem {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {boolean} options.autoSave - 是否自动保存（默认true）
   * @param {string} options.storagePrefix - 存储键前缀
   */
  constructor(options = {}) {
    this.autoSave = options.autoSave !== false;
    this.storagePrefix = options.storagePrefix || '';

    // 成就数据
    this.achievements = [];
    this.unlockedAchievements = new Set();

    // 解锁内容
    this.unlockedCharacters = new Set(['ironclad']); // 默认解锁铁血战士
    this.unlockedRelics = new Set();
    this.unlockedCards = new Set();
    this.unlockedArtifacts = new Set();
    this.unlockedStarterDecks = new Set();

    // 统计数据
    this.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalKills: 0,
      totalGoldEarned: 0,
      bossesDefeated: 0,
      maxFloorReached: 0,
      totalPlayTime: 0,
      eventsDiscovered: new Set(),
      relicsCollected: new Set(),
      cardsCollected: new Set()
    };

    // 临时游戏统计（单次运行）
    this.currentRunStats = {
      damageTaken: 0,
      enemiesKilled: 0,
      goldEarned: 0,
      relicsCollected: 0,
      cardsCollected: 0,
      floor: 0,
      deck: [],
      startTime: null,
      eventsSeen: new Set()
    };

    // 加载状态
    this.isLoaded = false;
  }

  /**
   * 初始化并加载元进度数据
   * @async
   * @returns {Promise<boolean>} - 加载是否成功
   */
  async initialize() {
    try {
      // 加载成就定义
      await this.loadAchievements();

      // 加载已保存的元进度
      await this.loadMetaProgress();

      this.isLoaded = true;
      console.log('[MetaProgressionSystem] 初始化完成');
      return true;
    } catch (error) {
      console.error('[MetaProgressionSystem] 初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载成就定义
   * @async
   * @private
   */
  async loadAchievements() {
    this.achievements = [...DEFAULT_ACHIEVEMENTS];
    console.log(`[MetaProgressionSystem] 加载了 ${this.achievements.length} 个成就`);
  }

  /**
   * 加载元进度数据
   * @async
   * @private
   */
  async loadMetaProgress() {
    try {
      // 加载已解锁成就
      const savedAchievements = this._loadFromStorage(STORAGE_KEYS.ACHIEVEMENTS);
      if (savedAchievements) {
        this.unlockedAchievements = new Set(savedAchievements);
      }

      // 加载解锁内容
      const savedUnlocks = this._loadFromStorage(STORAGE_KEYS.UNLOCKED_CONTENT);
      if (savedUnlocks) {
        this.unlockedCharacters = new Set(savedUnlocks.characters || ['ironclad']);
        this.unlockedRelics = new Set(savedUnlocks.relics || []);
        this.unlockedCards = new Set(savedUnlocks.cards || []);
        this.unlockedArtifacts = new Set(savedUnlocks.artifacts || []);
        this.unlockedStarterDecks = new Set(savedUnlocks.starterDecks || []);
      }

      // 加载统计数据
      const savedStats = this._loadFromStorage(STORAGE_KEYS.STATS);
      if (savedStats) {
        this.stats = {
          ...this.stats,
          ...savedStats,
          eventsDiscovered: new Set(savedStats.eventsDiscovered || []),
          relicsCollected: new Set(savedStats.relicsCollected || []),
          cardsCollected: new Set(savedStats.cardsCollected || [])
        };
      }

      console.log(`[MetaProgressionSystem] 已解锁 ${this.unlockedAchievements.size} 个成就`);
    } catch (error) {
      console.warn('[MetaProgressionSystem] 加载元进度失败，使用默认值:', error);
    }
  }

  /**
   * 从 localStorage 加载数据
   * @param {string} key - 存储键
   * @returns {any|null} - 解析后的数据或null
   * @private
   */
  _loadFromStorage(key) {
    try {
      const fullKey = this.storagePrefix + key;
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`[MetaProgressionSystem] 加载 ${key} 失败:`, error);
      return null;
    }
  }

  /**
   * 保存数据到 localStorage
   * @param {string} key - 存储键
   * @param {any} data - 要保存的数据
   * @returns {boolean} - 保存是否成功
   * @private
   */
  _saveToStorage(key, data) {
    try {
      const fullKey = this.storagePrefix + key;
      localStorage.setItem(fullKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`[MetaProgressionSystem] 保存 ${key} 失败:`, error);
      return false;
    }
  }

  /**
   * 保存元进度
   * @returns {boolean} - 保存是否成功
   */
  saveMetaProgress() {
    try {
      // 保存已解锁成就
      this._saveToStorage(STORAGE_KEYS.ACHIEVEMENTS, Array.from(this.unlockedAchievements));

      // 保存解锁内容
      this._saveToStorage(STORAGE_KEYS.UNLOCKED_CONTENT, {
        characters: Array.from(this.unlockedCharacters),
        relics: Array.from(this.unlockedRelics),
        cards: Array.from(this.unlockedCards),
        artifacts: Array.from(this.unlockedArtifacts),
        starterDecks: Array.from(this.unlockedStarterDecks)
      });

      // 保存统计数据
      const statsToSave = {
        ...this.stats,
        eventsDiscovered: Array.from(this.stats.eventsDiscovered),
        relicsCollected: Array.from(this.stats.relicsCollected),
        cardsCollected: Array.from(this.stats.cardsCollected)
      };
      this._saveToStorage(STORAGE_KEYS.STATS, statsToSave);

      console.log('[MetaProgressionSystem] 元进度已保存');
      return true;
    } catch (error) {
      console.error('[MetaProgressionSystem] 保存元进度失败:', error);
      return false;
    }
  }

  /**
   * 检查并解锁成就
   * @param {Object} conditions - 成就触发条件
   * @returns {Array} - 新解锁的成就列表
   */
  checkAchievements(conditions) {
    if (!this.isLoaded) {
      console.warn('[MetaProgressionSystem] 系统未初始化');
      return [];
    }

    const newUnlocks = [];

    for (const achievement of this.achievements) {
      // 跳过已解锁的成就
      if (this.unlockedAchievements.has(achievement.id)) {
        continue;
      }

      // 检查是否满足条件
      if (this._checkAchievementCondition(achievement.condition, conditions)) {
        this._unlockAchievement(achievement);
        newUnlocks.push(achievement);
      }
    }

    // 自动保存
    if (this.autoSave && newUnlocks.length > 0) {
      this.saveMetaProgress();
    }

    return newUnlocks;
  }

  /**
   * 检查单个成就条件
   * @param {Object} condition - 成就条件
   * @param {Object} currentConditions - 当前条件状态
   * @returns {boolean} - 是否满足条件
   * @private
   */
  _checkAchievementCondition(condition, currentConditions) {
    switch (condition.type) {
      case 'boss_defeated':
        if (condition.anyBoss) {
          return currentConditions.bossDefeated === true;
        }
        if (condition.bossId) {
          return currentConditions.bossId === condition.bossId;
        }
        return false;

      case 'boss_defeated_with_archetype':
        if (!currentConditions.archetype || !currentConditions.bossDefeated) {
          return false;
        }
        return currentConditions.archetype === condition.archetype &&
               currentConditions.archetypeRatio >= condition.ratio;

      case 'enemies_killed':
        const totalKills = this.stats.totalKills + (currentConditions.enemiesKilled || 0);
        return totalKills >= condition.count;

      case 'max_floor':
        const maxFloor = Math.max(this.stats.maxFloorReached, currentConditions.floor || 0);
        return maxFloor >= condition.floor;

      case 'game_completed':
        const wins = this.stats.gamesWon + (currentConditions.win ? 1 : 0);
        return wins >= condition.wins;

      case 'games_played':
        const games = this.stats.gamesPlayed + (currentConditions.gameComplete ? 1 : 0);
        return games >= condition.count;

      case 'games_won':
        return this.stats.gamesWon >= condition.count;

      case 'gold_earned':
        const totalGold = this.stats.totalGoldEarned + (currentConditions.goldEarned || 0);
        return totalGold >= condition.count;

      case 'relics_collected':
        if (condition.singleRun) {
          return currentConditions.relicsCollected >= condition.count;
        }
        if (condition.rarity) {
          const rarityRelics = Array.from(this.stats.relicsCollected)
            .filter(id => {
              const relic = this._getRelicById(id);
              return relic && relic.rarity === condition.rarity;
            });
          return condition.count === 'all' ||
                 rarityRelics.length >= this._getTotalRelicsByRarity(condition.rarity);
        }
        return false;

      case 'cards_collected':
        if (condition.singleRun) {
          return currentConditions.cardsCollected >= condition.count;
        }
        return false;

      case 'events_discovered':
        if (condition.uniqueEvents) {
          const totalEvents = this.stats.eventsDiscovered.size +
                             (currentConditions.newEvents?.size || 0);
          return totalEvents >= this._getTotalEventCount();
        }
        return false;

      case 'damage_taken':
        return currentConditions.damageTaken <= condition.damage;

      case 'speed_run':
        if (!currentConditions.playTime) return false;
        const playTimeMinutes = currentConditions.playTime / 60000;
        return playTimeMinutes <= condition.minutes;

      case 'ascension':
        return currentConditions.ascension >= condition.ascension;

      default:
        console.warn(`[MetaProgressionSystem] 未知的条件类型: ${condition.type}`);
        return false;
    }
  }

  /**
   * 解锁成就并发放奖励
   * @param {Object} achievement - 成就对象
   * @private
   */
  _unlockAchievement(achievement) {
    this.unlockedAchievements.add(achievement.id);
    console.log(`[MetaProgressionSystem] 🏆 解锁成就: ${achievement.name}`);

    // 发放奖励
    if (achievement.reward) {
      this._grantReward(achievement.reward);
    }
  }

  /**
   * 发放成就奖励
   * @param {Object} reward - 奖励对象
   * @private
   */
  _grantReward(reward) {
    switch (reward.type) {
      case UNLOCK_TYPES.CHARACTER:
        this.unlockedCharacters.add(reward.id);
        console.log(`[MetaProgressionSystem] 解锁角色: ${reward.name}`);
        break;

      case UNLOCK_TYPES.RELIC:
        this.unlockedRelics.add(reward.id);
        console.log(`[MetaProgressionSystem] 解锁起始遗物: ${reward.name}`);
        break;

      case UNLOCK_TYPES.CARD:
        this.unlockedCards.add(reward.id);
        console.log(`[MetaProgressionSystem] 解锁卡牌: ${reward.name}`);
        break;

      case UNLOCK_TYPES.ARTIFACT:
        this.unlockedArtifacts.add(reward.id);
        console.log(`[MetaProgressionSystem] 解锁神器: ${reward.name}`);
        break;

      case UNLOCK_TYPES.STARTER_DECK:
        this.unlockedStarterDecks.add(reward.id);
        console.log(`[MetaProgressionSystem] 解锁起始卡组: ${reward.name}`);
        break;

      default:
        console.warn(`[MetaProgressionSystem] 未知的奖励类型: ${reward.type}`);
    }
  }

  /**
   * 获取指定稀有度的遗物总数
   * @param {string} rarity - 稀有度
   * @returns {number} - 遗物数量
   * @private
   */
  _getTotalRelicsByRarity(rarity) {
    // 这里应该从 RelicManager 获取，简化处理
    return 10; // 假设值
  }

  /**
   * 获取事件总数
   * @returns {number} - 事件数量
   * @private
   */
  _getTotalEventCount() {
    // 这里应该从 EventSystem 获取，简化处理
    return 20; // 假设值
  }

  /**
   * 根据ID获取遗物
   * @param {string} id - 遗物ID
   * @returns {Object|null} - 遗物对象
   * @private
   */
  _getRelicById(id) {
    // 这里应该从 RelicManager 获取，返回null表示未实现
    return null;
  }

  /**
   * 获取已解锁的角色列表
   * @returns {Array} - 角色列表
   */
  getUnlockedCharacters() {
    return DEFAULT_CHARACTERS.filter(char =>
      this.unlockedCharacters.has(char.id)
    );
  }

  /**
   * 获取所有角色（包括未解锁）
   * @returns {Array} - 所有角色列表
   */
  getAllCharacters() {
    return DEFAULT_CHARACTERS.map(char => ({
      ...char,
      unlocked: this.unlockedCharacters.has(char.id)
    }));
  }

  /**
   * 检查角色是否已解锁
   * @param {string} characterId - 角色ID
   * @returns {boolean} - 是否已解锁
   */
  isCharacterUnlocked(characterId) {
    return this.unlockedCharacters.has(characterId);
  }

  /**
   * 获取已解锁内容
   * @returns {Object} - 解锁内容对象
   */
  getUnlockedContent() {
    return {
      characters: Array.from(this.unlockedCharacters),
      relics: Array.from(this.unlockedRelics),
      cards: Array.from(this.unlockedCards),
      artifacts: Array.from(this.unlockedArtifacts),
      starterDecks: Array.from(this.unlockedStarterDecks)
    };
  }

  /**
   * 获取所有成就
   * @param {Object} options - 查询选项
   * @param {boolean} options.includeUnlocked - 是否包含已解锁（默认true）
   * @param {boolean} options.includeHidden - 是否包含隐藏成就（默认false）
   * @param {string} options.type - 按类型筛选
   * @returns {Array} - 成就列表
   */
  getAchievements(options = {}) {
    let achievements = [...this.achievements];

    // 标记已解锁状态
    achievements = achievements.map(a => ({
      ...a,
      unlocked: this.unlockedAchievements.has(a.id)
    }));

    // 过滤隐藏成就
    if (!options.includeHidden) {
      achievements = achievements.filter(a => !a.hidden || a.unlocked);
    }

    // 按类型筛选
    if (options.type) {
      achievements = achievements.filter(a => a.type === options.type);
    }

    return achievements;
  }

  /**
   * 根据ID获取成就
   * @param {string} achievementId - 成就ID
   * @returns {Object|null} - 成就对象或null
   */
  getAchievement(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (achievement) {
      return {
        ...achievement,
        unlocked: this.unlockedAchievements.has(achievementId)
      };
    }
    return null;
  }

  /**
   * 获取成就进度
   * @param {string} achievementId - 成就ID
   * @returns {Object} - 进度对象 {current, target, percentage}
   */
  getAchievementProgress(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) {
      return null;
    }

    const condition = achievement.condition;
    let current = 0;
    let target = 1;

    switch (condition.type) {
      case 'enemies_killed':
        current = this.stats.totalKills + this.currentRunStats.enemiesKilled;
        target = condition.count;
        break;

      case 'games_played':
        current = this.stats.gamesPlayed;
        target = condition.count;
        break;

      case 'games_won':
        current = this.stats.gamesWon;
        target = condition.count;
        break;

      case 'gold_earned':
        current = this.stats.totalGoldEarned + this.currentRunStats.goldEarned;
        target = condition.count;
        break;

      case 'max_floor':
        current = Math.max(this.stats.maxFloorReached, this.currentRunStats.floor);
        target = condition.floor;
        break;

      case 'relics_collected':
        if (condition.singleRun) {
          current = this.currentRunStats.relicsCollected;
          target = condition.count;
        } else {
          current = this.stats.relicsCollected.size;
          target = this._getTotalRelicsByRarity(condition.rarity || 'common');
        }
        break;

      default:
        current = this.unlockedAchievements.has(achievementId) ? 1 : 0;
        target = 1;
    }

    return {
      current: Math.min(current, target),
      target,
      percentage: Math.min(100, Math.floor((current / target) * 100))
    };
  }

  /**
   * 开始新的游戏运行
   * @param {Object} options - 运行选项
   */
  startNewRun(options = {}) {
    this.currentRunStats = {
      damageTaken: 0,
      enemiesKilled: 0,
      goldEarned: 0,
      relicsCollected: 0,
      cardsCollected: 0,
      floor: 0,
      deck: options.initialDeck || [],
      startTime: Date.now(),
      eventsSeen: new Set(),
      ascension: options.ascension || 0
    };

    this.stats.gamesPlayed++;
    console.log('[MetaProgressionSystem] 开始新的游戏运行');
  }

  /**
   * 更新当前运行统计数据
   * @param {Object} updates - 更新数据
   */
  updateRunStats(updates) {
    if (updates.damageTaken !== undefined) {
      this.currentRunStats.damageTaken += updates.damageTaken;
    }
    if (updates.enemiesKilled !== undefined) {
      this.currentRunStats.enemiesKilled += updates.enemiesKilled;
    }
    if (updates.goldEarned !== undefined) {
      this.currentRunStats.goldEarned += updates.goldEarned;
    }
    if (updates.relicsCollected !== undefined) {
      this.currentRunStats.relicsCollected += updates.relicsCollected;
    }
    if (updates.cardsCollected !== undefined) {
      this.currentRunStats.cardsCollected += updates.cardsCollected;
    }
    if (updates.floor !== undefined) {
      this.currentRunStats.floor = Math.max(this.currentRunStats.floor, updates.floor);
    }
    if (updates.deck !== undefined) {
      this.currentRunStats.deck = updates.deck;
    }
    if (updates.eventSeen !== undefined) {
      this.currentRunStats.eventsSeen.add(updates.eventSeen);
    }
    if (updates.relicCollected !== undefined) {
      this.stats.relicsCollected.add(updates.relicCollected);
    }
    if (updates.cardCollected !== undefined) {
      this.stats.cardsCollected.add(updates.cardCollected);
    }
  }

  /**
   * 结束游戏运行
   * @param {Object} results - 运行结果
   * @returns {Array} - 新解锁的成就列表
   */
  endRun(results = {}) {
    // 更新全局统计
    this.stats.totalKills += this.currentRunStats.enemiesKilled;
    this.stats.totalGoldEarned += this.currentRunStats.goldEarned;
    this.stats.maxFloorReached = Math.max(
      this.stats.maxFloorReached,
      this.currentRunStats.floor
    );

    if (results.win) {
      this.stats.gamesWon++;
    }

    // 添加新发现的事件
    this.currentRunStats.eventsSeen.forEach(eventId => {
      this.stats.eventsDiscovered.add(eventId);
    });

    // 计算流派
    const archetype = this._calculateArchetype(this.currentRunStats.deck);

    // 准备成就检查条件
    const achievementConditions = {
      ...this.currentRunStats,
      playTime: this.currentRunStats.startTime ? Date.now() - this.currentRunStats.startTime : 0,
      bossDefeated: results.bossDefeated || false,
      win: results.win || false,
      gameComplete: true,
      archetype,
      archetypeRatio: archetype ? this._getArchetypeRatio(this.currentRunStats.deck, archetype) : 0
    };

    // 检查成就
    const newAchievements = this.checkAchievements(achievementConditions);

    // 自动保存
    if (this.autoSave) {
      this.saveMetaProgress();
    }

    console.log(`[MetaProgressionSystem] 游戏运行结束，解锁 ${newAchievements.length} 个成就`);

    return newAchievements;
  }

  /**
   * 计算卡组流派
   * @param {Array} deck - 卡组
   * @returns {string|null} - 流派类型
   * @private
   */
  _calculateArchetype(deck) {
    if (!deck || deck.length === 0) return null;

    const typeCounts = { attack: 0, defense: 0, skill: 0 };
    deck.forEach(card => {
      if (card.type && typeCounts[card.type] !== undefined) {
        typeCounts[card.type]++;
      }
    });

    const total = deck.length;
    const maxRatio = Math.max(typeCounts.attack / total, typeCounts.defense / total, typeCounts.skill / total);

    if (maxRatio < 0.35) return 'balanced';
    if (typeCounts.attack / total === maxRatio) return 'attack';
    if (typeCounts.defense / total === maxRatio) return 'defense';
    if (typeCounts.skill / total === maxRatio) return 'skill';

    return null;
  }

  /**
   * 获取流派占比
   * @param {Array} deck - 卡组
   * @param {string} archetype - 流派类型
   * @returns {number} - 占比（0-1）
   * @private
   */
  _getArchetypeRatio(deck, archetype) {
    if (!deck || deck.length === 0) return 0;

    const typeCount = deck.filter(card => card.type === archetype).length;
    return typeCount / deck.length;
  }

  /**
   * 获取统计数据
   * @returns {Object} - 统计数据
   */
  getStats() {
    return {
      gamesPlayed: this.stats.gamesPlayed,
      gamesWon: this.stats.gamesWon,
      totalKills: this.stats.totalKills,
      totalGoldEarned: this.stats.totalGoldEarned,
      bossesDefeated: this.stats.bossesDefeated,
      maxFloorReached: this.stats.maxFloorReached,
      totalPlayTime: this.stats.totalPlayTime,
      eventsDiscovered: this.stats.eventsDiscovered.size,
      relicsCollected: this.stats.relicsCollected.size,
      cardsCollected: this.stats.cardsCollected.size,
      achievementsUnlocked: this.unlockedAchievements.size,
      totalAchievements: this.achievements.length,
      winRate: this.stats.gamesPlayed > 0
        ? Math.floor((this.stats.gamesWon / this.stats.gamesPlayed) * 100)
        : 0
    };
  }

  /**
   * 重置所有元进度（用于测试或开发）
   * @returns {boolean} - 重置是否成功
   */
  resetAllProgress() {
    try {
      localStorage.removeItem(this.storagePrefix + STORAGE_KEYS.ACHIEVEMENTS);
      localStorage.removeItem(this.storagePrefix + STORAGE_KEYS.UNLOCKED_CONTENT);
      localStorage.removeItem(this.storagePrefix + STORAGE_KEYS.STATS);

      this.unlockedAchievements.clear();
      this.unlockedCharacters = new Set(['ironclad']);
      this.unlockedRelics.clear();
      this.unlockedCards.clear();
      this.unlockedArtifacts.clear();
      this.unlockedStarterDecks.clear();

      this.stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0,
        totalGoldEarned: 0,
        bossesDefeated: 0,
        maxFloorReached: 0,
        totalPlayTime: 0,
        eventsDiscovered: new Set(),
        relicsCollected: new Set(),
        cardsCollected: new Set()
      };

      console.log('[MetaProgressionSystem] 所有元进度已重置');
      return true;
    } catch (error) {
      console.error('[MetaProgressionSystem] 重置元进度失败:', error);
      return false;
    }
  }

  /**
   * 获取当前运行统计
   * @returns {Object} - 当前运行统计
   */
  getCurrentRunStats() {
    return { ...this.currentRunStats };
  }

  /**
   * 导出元进度数据（用于备份）
   * @returns {string} - JSON格式的元进度数据
   */
  exportData() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      achievements: Array.from(this.unlockedAchievements),
      unlockedContent: {
        characters: Array.from(this.unlockedCharacters),
        relics: Array.from(this.unlockedRelics),
        cards: Array.from(this.unlockedCards),
        artifacts: Array.from(this.unlockedArtifacts),
        starterDecks: Array.from(this.unlockedStarterDecks)
      },
      stats: {
        ...this.stats,
        eventsDiscovered: Array.from(this.stats.eventsDiscovered),
        relicsCollected: Array.from(this.stats.relicsCollected),
        cardsCollected: Array.from(this.stats.cardsCollected)
      }
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入元进度数据（用于恢复备份）
   * @param {string} jsonData - JSON格式的元进度数据
   * @returns {boolean} - 导入是否成功
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      // 验证数据结构
      if (!data.achievements || !data.unlockedContent || !data.stats) {
        throw new Error('无效的元进度数据格式');
      }

      // 导入成就
      this.unlockedAchievements = new Set(data.achievements);

      // 导入解锁内容
      this.unlockedCharacters = new Set(data.unlockedContent.characters);
      this.unlockedRelics = new Set(data.unlockedContent.relics);
      this.unlockedCards = new Set(data.unlockedContent.cards);
      this.unlockedArtifacts = new Set(data.unlockedContent.artifacts);
      this.unlockedStarterDecks = new Set(data.unlockedContent.starterDecks);

      // 导入统计数据
      this.stats = {
        ...data.stats,
        eventsDiscovered: new Set(data.stats.eventsDiscovered),
        relicsCollected: new Set(data.stats.relicsCollected),
        cardsCollected: new Set(data.stats.cardsCollected)
      };

      // 保存到存储
      this.saveMetaProgress();

      console.log('[MetaProgressionSystem] 元进度数据已导入');
      return true;
    } catch (error) {
      console.error('[MetaProgressionSystem] 导入元进度数据失败:', error);
      return false;
    }
  }
}

// 导出常量和类
export {
  ACHIEVEMENT_TYPES,
  ACHIEVEMENT_RARITY,
  UNLOCK_TYPES,
  STORAGE_KEYS,
  ERROR_CODES,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_CHARACTERS
};
