/**
 * CharacterSystem - 多角色选择系统
 *
 * 负责角色定义、角色选择、角色解锁管理
 * 每个角色拥有独特的起始属性、卡牌组和专属遗物
 *
 * @class
 */

// 角色ID常量
export const CHARACTER_IDS = {
  IRONCLAD: 'ironclad',    // 铁甲战士
  SILENT: 'silent',        // 盗贼
  DEFECT: 'defect'         // 法师
};

// 角色解锁条件常量
export const UNLOCK_CONDITIONS = {
  DEFEAT_GUARDIAN: 'defeat_guardian',       // 击败守护者
  DEFEAT_HEXAGHOST: 'defeat_hexaghost',     // 击败六鬼
  DEFEAT_SLIME_BOSS: 'defeat_slime_boss',   // 击败史莱姆Boss
  REACH_LEVEL_3: 'reach_level_3',           // 到达第3层
  WIN_WITH_CHARACTER: 'win_with_character'  // 使用特定角色获胜
};

// 错误代码常量
export const CHARACTER_ERRORS = {
  CHARACTER_NOT_FOUND: 'ERR_CHARACTER_NOT_FOUND',
  CHARACTER_LOCKED: 'ERR_CHARACTER_LOCKED',
  CHARACTER_ALREADY_SELECTED: 'ERR_CHARACTER_ALREADY_SELECTED',
  UNLOCK_CONDITION_NOT_MET: 'ERR_UNLOCK_CONDITION_NOT_MET',
  INVALID_CHARACTER_ID: 'ERR_INVALID_CHARACTER_ID'
};

// 角色颜色主题
export const CHARACTER_COLORS = {
  [CHARACTER_IDS.IRONCLAD]: {
    primary: '#ff4444',      // 红色
    secondary: '#ff8888',    // 浅红色
    background: '#2a1a1a',   // 深红色背景
    accent: '#ff6b6b'        // 强调色
  },
  [CHARACTER_IDS.SILENT]: {
    primary: '#44ff44',      // 绿色
    secondary: '#88ff88',    // 浅绿色
    background: '#1a2a1a',   // 深绿色背景
    accent: '#6bff6b'        // 强调色
  },
  [CHARACTER_IDS.DEFECT]: {
    primary: '#4444ff',      // 蓝色
    secondary: '#8888ff',    // 浅蓝色
    background: '#1a1a2a',   // 深蓝色背景
    accent: '#6b6bff'        // 强调色
  }
};

/**
 * 默认角色数据定义
 * 每个角色包含：ID、名称、描述、图标、起始属性、起始卡组、起始遗物、颜色主题
 */
const DEFAULT_CHARACTERS = [
  // ===== 铁甲战士 (Ironclad) =====
  {
    id: CHARACTER_IDS.IRONCLAD,
    name: '铁甲战士',
    englishName: 'Ironclad',
    description: '来自深渊的战士，以强健的体魄和火焰之力战斗。',
    detailedDescription: '铁甲战士擅长直接攻击和燃烧伤害，他的卡组以攻击卡为主，通过牺牲生命值来换取强大的攻击力。',
    icon: '⚔️',
    portrait: 'warrior_portrait', // 头像资源ID
    // 起始属性
    startingStats: {
      maxHp: 80,
      hp: 80,
      gold: 100,
      maxEnergy: 3
    },
    // 起始卡牌组（10张卡牌）
    startingDeck: [
      { id: 'attack_basic', copies: 5 },   // 基础攻击 x5
      { id: 'defend_basic', copies: 4 },    // 铁壁 x4
      { id: 'attack_heavy', copies: 1 }    // 重击 x1
    ],
    // 起始遗物
    startingRelics: ['burning_blood_ironclad'],
    // 颜色主题
    colors: CHARACTER_COLORS[CHARACTER_IDS.IRONCLAD],
    // 解锁状态（默认解锁）
    unlocked: true,
    unlockCondition: null,
    // 专属特性
    features: {
      playstyle: 'aggressive',           // 激进型
      strength: 'high_damage',           // 高伤害
      weakness: 'low_survivability'      // 低生存力
    }
  },

  // ===== 盗贼 (Silent) =====
  {
    id: CHARACTER_IDS.SILENT,
    name: '盗贼',
    englishName: 'Silent',
    description: '来自深林中的暗影刺客，精通毒素和技巧。',
    detailedDescription: '盗贼擅长使用毒素和技巧卡牌，通过叠加毒性和精准打击来击败敌人。她的卡组需要策略性地构建连击。',
    icon: '🗡️',
    portrait: 'rogue_portrait',
    // 起始属性
    startingStats: {
      maxHp: 70,
      hp: 70,
      gold: 100,
      maxEnergy: 3
    },
    // 起始卡牌组（10张卡牌）
    startingDeck: [
      { id: 'attack_basic', copies: 5 },   // 基础攻击 x5
      { id: 'defend_basic', copies: 4 },    // 铁壁 x4
      { id: 'skill_draw', copies: 1 }      // 战术思考 x1
    ],
    // 起始遗物
    startingRelics: ['ring_of_the_snake'], // 蛇戒（每回合第一张牌费用为0）
    // 颜色主题
    colors: CHARACTER_COLORS[CHARACTER_IDS.SILENT],
    // 解锁状态（需要击败守护者）
    unlocked: false,
    unlockCondition: {
      type: UNLOCK_CONDITIONS.DEFEAT_GUARDIAN,
      description: '击败守护者Boss后解锁'
    },
    // 专属特性
    features: {
      playstyle: 'tactical',               // 策略型
      strength: 'poison_and_deck_control', // 毒素和卡组控制
      weakness: 'low_base_damage'          // 低基础伤害
    }
  },

  // ===== 法师 (Defect) =====
  {
    id: CHARACTER_IDS.DEFECT,
    name: '法师',
    englishName: 'Defect',
    description: '古代机器人，掌握着神秘的充能球技术。',
    detailedDescription: '法师使用充能球系统，每回合可以生成和消耗各种元素的球体。充能球可以造成伤害、提供护甲或回复能量。',
    icon: '⚡',
    portrait: 'mage_portrait',
    // 起始属性
    startingStats: {
      maxHp: 65,
      hp: 65,
      gold: 100,
      maxEnergy: 3
    },
    // 起始卡牌组（10张卡牌）
    startingDeck: [
      { id: 'attack_basic', copies: 5 },   // 基础攻击 x5
      { id: 'defend_basic', copies: 4 },    // 铁壁 x4
      { id: 'skill_energy', copies: 1 }    // 集中 x1
    ],
    // 起始遗物
    startingRelics: ['crystal_core'],      // 水晶核心（每回合开始获得1点能量）
    // 颜色主题
    colors: CHARACTER_COLORS[CHARACTER_IDS.DEFECT],
    // 解锁状态（需要击败六鬼）
    unlocked: false,
    unlockCondition: {
      type: UNLOCK_CONDITIONS.DEFEAT_HEXAGHOST,
      description: '击败六鬼Boss后解锁'
    },
    // 专属特性
    features: {
      playstyle: 'strategic',              // 战略型
      strength: 'orb_synergy',             // 充能球协同
      weakness: 'low_hp'                   // 低生命值
    }
  }
];

/**
 * 角色系统类
 */
export class CharacterSystem {
  /**
   * 构造函数
   * @param {Object} gameState - 游戏状态管理器
   */
  constructor(gameState = null) {
    this.gameState = gameState;

    // 所有角色数据
    this.allCharacters = [];

    // 已解锁的角色ID
    this.unlockedCharacters = new Set();

    // 当前选中的角色
    this.selectedCharacter = null;

    // 解锁进度记录
    this.unlockProgress = {};

    // 加载状态
    this.isLoaded = false;
  }

  /**
   * 初始化角色系统
   * @async
   * @returns {Promise<void>}
   * @throws {Error} 当角色数据加载失败时抛出错误
   */
  async initialize() {
    try {
      // 加载默认角色数据
      this.allCharacters = this._createDefaultCharacters();

      // 从存档加载解锁状态
      this._loadUnlockProgress();

      this.isLoaded = true;
      console.log('[CharacterSystem] 角色系统初始化完成');

    } catch (error) {
      console.error('[CharacterSystem] 初始化失败:', error);
      throw new Error(`${CHARACTER_ERRORS.CHARACTER_NOT_FOUND}: 角色系统初始化失败: ${error.message}`);
    }
  }

  /**
   * 创建默认角色数据
   * @private
   * @returns {Array} 角色数据数组
   */
  _createDefaultCharacters() {
    return DEFAULT_CHARACTERS.map(char => ({
      ...char,
      // 深拷贝避免修改原始数据
      startingDeck: char.startingDeck.map(card => ({ ...card })),
      startingRelics: [...char.startingRelics],
      colors: { ...char.colors },
      features: { ...char.features }
    }));
  }

  /**
   * 加载解锁进度
   * @private
   */
  _loadUnlockProgress() {
    if (!this.gameState || !this.gameState.storage) {
      return;
    }

    try {
      const savedData = this.gameState.storage.getItem('character_unlocks');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.unlockedCharacters = new Set(data.unlocked || []);
        this.unlockProgress = data.progress || {};

        // 更新角色解锁状态
        this.allCharacters.forEach(char => {
          if (this.unlockedCharacters.has(char.id)) {
            char.unlocked = true;
          }
        });

        console.log('[CharacterSystem] 加载解锁进度:', this.unlockedCharacters);
      }
    } catch (error) {
      console.warn('[CharacterSystem] 加载解锁进度失败:', error);
    }
  }

  /**
   * 保存解锁进度
   * @private
   */
  _saveUnlockProgress() {
    if (!this.gameState || !this.gameState.storage) {
      return;
    }

    try {
      const data = {
        unlocked: Array.from(this.unlockedCharacters),
        progress: this.unlockProgress
      };
      this.gameState.storage.setItem('character_unlocks', JSON.stringify(data));
    } catch (error) {
      console.warn('[CharacterSystem] 保存解锁进度失败:', error);
    }
  }

  /**
   * 获取所有可用角色（已解锁的角色）
   * @returns {Array} 可用角色数组
   */
  getAvailableCharacters() {
    return this.allCharacters.filter(char => char.unlocked);
  }

  /**
   * 获取所有角色（包括未解锁的）
   * @returns {Array} 所有角色数组
   */
  getAllCharacters() {
    return this.allCharacters.map(char => ({
      id: char.id,
      name: char.name,
      description: char.description,
      icon: char.icon,
      unlocked: char.unlocked,
      unlockCondition: char.unlockCondition
    }));
  }

  /**
   * 根据ID获取角色
   * @param {string} characterId - 角色ID
   * @returns {Object|null} 角色对象或null
   */
  getCharacter(characterId) {
    return this.allCharacters.find(char => char.id === characterId) || null;
  }

  /**
   * 检查角色是否已解锁
   * @param {string} characterId - 角色ID
   * @returns {boolean} 是否已解锁
   */
  isCharacterUnlocked(characterId) {
    return this.unlockedCharacters.has(characterId);
  }

  /**
   * 选择角色
   * @param {string} characterId - 角色ID
   * @returns {{success: boolean, character?: Object, message?: string}} - 操作结果
   */
  selectCharacter(characterId) {
    // 验证角色ID
    const character = this.getCharacter(characterId);
    if (!character) {
      return {
        success: false,
        message: `${CHARACTER_ERRORS.CHARACTER_NOT_FOUND}: 未找到角色 ${characterId}`
      };
    }

    // 检查是否已解锁
    if (!character.unlocked) {
      return {
        success: false,
        message: `${CHARACTER_ERRORS.CHARACTER_LOCKED}: 角色 ${character.name} 尚未解锁`
      };
    }

    // 设置选中的角色
    this.selectedCharacter = character;

    console.log(`[CharacterSystem] 选择角色: ${character.name}`);

    return {
      success: true,
      character: character
    };
  }

  /**
   * 获取当前选中的角色
   * @returns {Object|null} 当前角色或null
   */
  getSelectedCharacter() {
    return this.selectedCharacter;
  }

  /**
   * 获取角色的起始卡组
   * @param {string} characterId - 角色ID
   * @returns {Array} 起始卡组数组（包含卡牌ID和数量）
   */
  getStartingDeck(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      console.warn(`[CharacterSystem] 未找到角色: ${characterId}`);
      return [];
    }

    return character.startingDeck.map(card => ({ ...card }));
  }

  /**
   * 获取角色的起始遗物
   * @param {string} characterId - 角色ID
   * @returns {Array} 起始遗物ID数组
   */
  getStartingRelics(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      console.warn(`[CharacterSystem] 未找到角色: ${characterId}`);
      return [];
    }

    return [...character.startingRelics];
  }

  /**
   * 获取角色的起始属性
   * @param {string} characterId - 角色ID
   * @returns {Object} 起始属性对象
   */
  getStartingStats(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      console.warn(`[CharacterSystem] 未找到角色: ${characterId}`);
      return null;
    }

    return { ...character.startingStats };
  }

  /**
   * 解锁角色
   * @param {string} characterId - 角色ID
   * @returns {{success: boolean, message?: string}} - 操作结果
   */
  unlockCharacter(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      return {
        success: false,
        message: `${CHARACTER_ERRORS.CHARACTER_NOT_FOUND}: 未找到角色 ${characterId}`
      };
    }

    // 检查是否已解锁
    if (character.unlocked) {
      return {
        success: true,
        message: `角色 ${character.name} 已经解锁`
      };
    }

    // 解锁角色
    character.unlocked = true;
    this.unlockedCharacters.add(characterId);

    // 保存解锁进度
    this._saveUnlockProgress();

    console.log(`[CharacterSystem] 解锁角色: ${character.name}`);

    return {
      success: true,
      message: `成功解锁角色: ${character.name}`
    };
  }

  /**
   * 检查解锁条件
   * @param {string} characterId - 角色ID
   * @param {Object} gameState - 当前游戏状态
   * @returns {boolean} 是否满足解锁条件
   */
  checkUnlockCondition(characterId, gameState) {
    const character = this.getCharacter(characterId);
    if (!character || !character.unlockCondition) {
      return false;
    }

    const condition = character.unlockCondition;
    const progress = this.unlockProgress;

    switch (condition.type) {
      case UNLOCK_CONDITIONS.DEFEAT_GUARDIAN:
        // 检查是否击败过守护者
        return progress.bossDefeated?.guardian === true;

      case UNLOCK_CONDITIONS.DEFEAT_HEXAGHOST:
        // 检查是否击败过六鬼
        return progress.bossDefeated?.hexaghost === true;

      case UNLOCK_CONDITIONS.DEFEAT_SLIME_BOSS:
        // 检查是否击败过史莱姆Boss
        return progress.bossDefeated?.slimeBoss === true;

      case UNLOCK_CONDITIONS.REACH_LEVEL_3:
        // 检查是否到达第3层
        return gameState?.progressState?.maxLevel >= 3;

      case UNLOCK_CONDITIONS.WIN_WITH_CHARACTER:
        // 检查是否使用特定角色获胜
        const winChar = condition.character || CHARACTER_IDS.IRONCLAD;
        return progress.winsByCharacter?.[winChar] > 0;

      default:
        return false;
    }
  }

  /**
   * 记录Boss击败
   * @param {string} bossId - Boss ID
   */
  recordBossDefeat(bossId) {
    if (!this.unlockProgress.bossDefeated) {
      this.unlockProgress.bossDefeated = {};
    }
    this.unlockProgress.bossDefeated[bossId] = true;

    // 检查是否有角色因击败Boss而解锁
    this._checkAutoUnlocks();
    this._saveUnlockProgress();
  }

  /**
   * 记录角色获胜
   * @param {string} characterId - 角色ID
   */
  recordCharacterWin(characterId) {
    if (!this.unlockProgress.winsByCharacter) {
      this.unlockProgress.winsByCharacter = {};
    }
    this.unlockProgress.winsByCharacter[characterId] =
      (this.unlockProgress.winsByCharacter[characterId] || 0) + 1;

    // 检查是否有角色因获胜而解锁
    this._checkAutoUnlocks();
    this._saveUnlockProgress();
  }

  /**
   * 检查自动解锁
   * @private
   */
  _checkAutoUnlocks() {
    this.allCharacters.forEach(char => {
      if (!char.unlocked && char.unlockCondition) {
        // 简单检查解锁条件
        if (char.unlockCondition.type === UNLOCK_CONDITIONS.DEFEAT_GUARDIAN &&
            this.unlockProgress.bossDefeated?.guardian) {
          this.unlockCharacter(char.id);
        } else if (char.unlockCondition.type === UNLOCK_CONDITIONS.DEFEAT_HEXAGHOST &&
                   this.unlockProgress.bossDefeated?.hexaghost) {
          this.unlockCharacter(char.id);
        }
      }
    });
  }

  /**
   * 获取角色颜色主题
   * @param {string} characterId - 角色ID
   * @returns {Object|null} 颜色主题对象
   */
  getCharacterColors(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      return null;
    }

    return { ...character.colors };
  }

  /**
   * 获取角色专属特性
   * @param {string} characterId - 角色ID
   * @returns {Object|null} 特性对象
   */
  getCharacterFeatures(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      return null;
    }

    return { ...character.features };
  }

  /**
   * 重置角色系统（用于新游戏）
   * 注意：不重置已解锁的角色
   */
  resetForNewGame() {
    this.selectedCharacter = null;
    console.log('[CharacterSystem] 重置新游戏状态');
  }

  /**
   * 完全重置角色系统（包括解锁状态）
   * 仅用于测试或完全重置进度
   */
  fullReset() {
    this.selectedCharacter = null;
    this.unlockedCharacters.clear();
    this.unlockProgress = {};

    // 重置所有角色解锁状态（铁甲战士除外，他默认解锁）
    this.allCharacters.forEach(char => {
      char.unlocked = char.id === CHARACTER_IDS.IRONCLAD;
    });

    this._saveUnlockProgress();
    console.log('[CharacterSystem] 完全重置');
  }

  /**
   * 获取系统状态快照
   * @returns {Object} 系统状态
   */
  getState() {
    return {
      isLoaded: this.isLoaded,
      selectedCharacter: this.selectedCharacter?.id || null,
      unlockedCharacters: Array.from(this.unlockedCharacters),
      unlockProgress: { ...this.unlockProgress },
      totalCharacters: this.allCharacters.length,
      availableCharacters: this.getAvailableCharacters().length
    };
  }

  /**
   * 验证角色数据
   * @param {Object} character - 角色对象
   * @returns {boolean} - 是否有效
   */
  validateCharacter(character) {
    const requiredFields = ['id', 'name', 'description', 'icon', 'startingStats', 'startingDeck', 'startingRelics', 'colors'];

    for (const field of requiredFields) {
      if (character[field] === undefined || character[field] === null) {
        console.warn(`角色 ${character.id || 'unknown'} 缺少必需字段: ${field}`);
        return false;
      }
    }

    // 验证起始属性
    if (typeof character.startingStats.maxHp !== 'number' || character.startingStats.maxHp <= 0) {
      console.warn(`角色 ${character.id} 的起始生命值无效`);
      return false;
    }

    // 验证起始卡组
    if (!Array.isArray(character.startingDeck) || character.startingDeck.length === 0) {
      console.warn(`角色 ${character.id} 的起始卡组无效`);
      return false;
    }

    return true;
  }
}
