/**
 * 游戏状态管理类
 * 管理玩家状态、进度、设置和存档功能
 * 基于 .claude/specs/feature/game-state-spec.md 规范文档
 */
export default class GameState {
  constructor() {
    this.VERSION = 1;
    this.CURRENT_SLOT = 1;
    this.storage = localStorage;
    this.playerState = {
      hp: 100,
      maxHp: 100,
      gold: 0,
      deck: [],
      unlockedCards: [],
      unlockedItems: []
    };
    this.progressState = {
      currentLevel: 1,
      currentArea: 1,
      maxLevel: 1,
      completedLevels: []
    };
    this.settings = {
      musicVolume: 0.8,
      sfxVolume: 0.9,
      difficulty: 'normal',
      autoSave: true
    };
    this.saveTime = new Date().toISOString();
    this._checkStorageAvailability();
  }

  /**
   * 检查存储是否可用
   * @private
   */
  _checkStorageAvailability() {
    try {
      const testKey = '__test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
    } catch (error) {
      console.warn('localStorage 不可用，将使用内存存储');
      this.storage = this._createMemoryStorage();
    }
  }

  /**
   * 创建内存存储作为降级方案
   * @private
   * @returns {Object} 内存存储对象
   */
  _createMemoryStorage() {
    const storage = {};
    return {
      setItem: (key, value) => { storage[key] = value; },
      getItem: (key) => storage[key] || null,
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
    };
  }

  /**
   * 计算校验和
   * @private
   * @param {Object} data - 要计算校验和的数据
   * @returns {string} 校验和字符串
   */
  calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 验证存档数据完整性
   * @param {any} data - 要验证的存档数据
   * @returns {boolean} - 数据是否有效
   */
  validateSave(data) {
    if (!data) return false;
    if (!data.version || typeof data.version !== 'number') return false;
    if (!data.hp || typeof data.hp !== 'number') return false;
    if (!data.maxHp || typeof data.maxHp !== 'number') return false;
    if (!data.gold || typeof data.gold !== 'number') return false;
    if (!data.currentLevel || typeof data.currentLevel !== 'number') return false;
    if (!data.currentArea || typeof data.currentArea !== 'number') return false;
    if (!data.saveTime || typeof data.saveTime !== 'string') return false;
    if (!data.checksum || typeof data.checksum !== 'string') return false;

    // 验证校验和
    const expectedChecksum = this.calculateChecksum({
      version: data.version,
      hp: data.hp,
      maxHp: data.maxHp,
      gold: data.gold,
      currentLevel: data.currentLevel,
      currentArea: data.currentArea
    });

    return data.checksum === expectedChecksum;
  }

  /**
   * 初始化新游戏
   * @returns {Promise<void>}
   */
  initNewGame() {
    // 保留永久解锁内容
    const permanentUnlocks = {
      ...this.playerState.unlockedCards,
      ...this.playerState.unlockedItems
    };

    this.playerState = {
      hp: 100,
      maxHp: 100,
      gold: 0,
      deck: [],
      unlockedCards: [...permanentUnlocks.unlockedCards || []],
      unlockedItems: [...permanentUnlocks.unlockedItems || []]
    };
    this.progressState = {
      currentLevel: 1,
      currentArea: 1,
      maxLevel: 1,
      completedLevels: []
    };
    this.saveTime = new Date().toISOString();
    this.CURRENT_SLOT = 1;

    return Promise.resolve();
  }

  /**
   * 自动保存到当前槽位
   * @returns {Promise<boolean>} - 保存是否成功
   */
  autoSave() {
    const saveData = {
      version: this.VERSION,
      hp: this.playerState.hp,
      maxHp: this.playerState.maxHp,
      gold: this.playerState.gold,
      deck: this.playerState.deck,
      unlockedCards: this.playerState.unlockedCards,
      unlockedItems: this.playerState.unlockedItems,
      currentLevel: this.progressState.currentLevel,
      currentArea: this.progressState.currentArea,
      maxLevel: this.progressState.maxLevel,
      completedLevels: this.progressState.completedLevels,
      settings: this.settings,
      saveTime: this.saveTime,
      checksum: this.calculateChecksum({
        version: this.VERSION,
        hp: this.playerState.hp,
        maxHp: this.playerState.maxHp,
        gold: this.playerState.gold,
        currentLevel: this.progressState.currentLevel,
        currentArea: this.progressState.currentArea
      })
    };

    const key = `game_save_${this.CURRENT_SLOT}`;
    try {
      this.storage.setItem(key, JSON.stringify(saveData));
      return Promise.resolve(true);
    } catch (error) {
      console.warn('自动保存失败:', error);
      return Promise.resolve(false);
    }
  }

  /**
   * 保存到指定槽位
   * @param {number} slotId - 槽位ID (1-3)
   * @returns {Promise<boolean>} - 保存是否成功
   */
  saveToSlot(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('ERR_SLOT_INVALID: 无效的存档槽位');
    }

    this.CURRENT_SLOT = slotId;
    return this.autoSave();
  }

  /**
   * 从指定槽位读取存档
   * @param {number} slotId - 槽位ID (1-3)
   * @returns {Promise<GameState|null>} - 读取到的游戏状态或null
   */
  loadFromSlot(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('ERR_SLOT_INVALID: 无效的存档槽位');
    }

    const key = `game_save_${slotId}`;
    const savedData = this.storage.getItem(key);

    if (!savedData) {
      return Promise.resolve(null);
    }

    try {
      const data = JSON.parse(savedData);
      if (this.validateSave(data)) {
        // 检查版本兼容性
        if (data.version !== this.VERSION) {
          console.warn(`ERR_VERSION_INCOMPATIBLE: 存档版本 ${data.version} 不兼容当前版本 ${this.VERSION}`);
          return Promise.resolve(null);
        }

        this.playerState = {
          hp: data.hp,
          maxHp: data.maxHp,
          gold: data.gold,
          deck: data.deck || [],
          unlockedCards: data.unlockedCards || [],
          unlockedItems: data.unlockedItems || []
        };
        this.progressState = {
          currentLevel: data.currentLevel,
          currentArea: data.currentArea,
          maxLevel: data.maxLevel || 1,
          completedLevels: data.completedLevels || []
        };
        this.settings = data.settings || this.settings;
        this.saveTime = data.saveTime;
        this.CURRENT_SLOT = slotId;
        return Promise.resolve(data);
      } else {
        console.warn('ERR_SAVE_CORRUPTED: 存档已损坏');
        return Promise.resolve(null);
      }
    } catch (error) {
      console.warn('ERR_LOAD_FAILED: 读取存档失败:', error);
      return Promise.resolve(null);
    }
  }

  /**
   * 读取最新存档
   * @returns {Promise<GameState|null>} - 读取到的游戏状态或null
   */
  loadLatestSave() {
    // 从槽位3开始检查（最新的存档通常放在最后）
    for (let slotId = 3; slotId >= 1; slotId--) {
      const key = `game_save_${slotId}`;
      const savedData = this.storage.getItem(key);
      if (savedData) {
        return this.loadFromSlot(slotId);
      }
    }
    return Promise.resolve(null);
  }

  /**
   * 获取所有存档槽位信息
   * @returns {Promise<Array>} - 存档槽位信息数组
   */
  getSaveSlots() {
    const slots = [];
    for (let i = 1; i <= 3; i++) {
      const key = `game_save_${i}`;
      const savedData = this.storage.getItem(key);

      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          slots.push({
            slotId: i,
            isEmpty: false,
            saveTime: data.saveTime,
            preview: `关卡 ${data.currentLevel}-${data.currentArea}, 生命值 ${data.hp}, 金币 ${data.gold}`
          });
        } catch (error) {
          slots.push({
            slotId: i,
            isEmpty: true,
            saveTime: null,
            preview: '存档已损坏'
          });
        }
      } else {
        slots.push({
          slotId: i,
          isEmpty: true,
          saveTime: null,
          preview: '空'
        });
      }
    }
    return Promise.resolve(slots);
  }

  /**
   * 删除指定存档
   * @param {number} slotId - 槽位ID (1-3)
   * @returns {Promise<boolean>} - 删除是否成功
   */
  deleteSave(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('ERR_SLOT_INVALID: 无效的存档槽位');
    }

    const key = `game_save_${slotId}`;
    this.storage.removeItem(key);
    return Promise.resolve(true);
  }

  /**
   * 重置游戏进度
   * @returns {Promise<void>}
   */
  resetGame() {
    // 清除所有存档
    for (let i = 1; i <= 3; i++) {
      try {
        this.deleteSave(i).catch(() => {});
      } catch (error) {
        console.error('删除存档失败:', error);
      }
    }

    // 重置游戏状态
    return this.initNewGame();
  }

  /**
   * 导出存档为JSON字符串
   * @param {number} slotId - 槽位ID (1-3)
   * @returns {Promise<string>} - 存档数据JSON字符串
   */
  exportSave(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('ERR_SLOT_INVALID: 无效的存档槽位');
    }

    const key = `game_save_${slotId}`;
    const savedData = this.storage.getItem(key);
    return Promise.resolve(savedData);
  }

  /**
   * 导入存档数据
   * @param {string} data - 存档数据JSON字符串
   * @param {number} slotId - 槽位ID (1-3)
   * @returns {Promise<boolean>} - 导入是否成功
   */
  importSave(data, slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('ERR_SLOT_INVALID: 无效的存档槽位');
    }

    try {
      const parsedData = JSON.parse(data);
      if (this.validateSave(parsedData)) {
        const key = `game_save_${slotId}`;
        this.storage.setItem(key, data);
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    } catch (error) {
      console.warn('导入存档失败:', error);
      return Promise.resolve(false);
    }
  }

  /**
   * 更新玩家状态
   * @param {Object} updates - 要更新的玩家状态
   */
  updatePlayerState(updates) {
    Object.assign(this.playerState, updates);
    this.saveTime = new Date().toISOString(); // 更新保存时间
  }

  /**
   * 获取当前游戏状态的副本（用于调试）
   * @returns {Object} 游戏状态副本
   */
  getState() {
    return {
      playerState: { ...this.playerState },
      progressState: { ...this.progressState },
      settings: { ...this.settings },
      saveTime: this.saveTime,
      currentSlot: this.CURRENT_SLOT,
      version: this.VERSION
    };
  }
}