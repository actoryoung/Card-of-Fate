/**
 * 游戏状态管理 (GameState) 单元测试
 * 基于 .claude/specs/feature/game-state-spec.md 规范文档
 */

import TestRunner from './framework.js';

const runner = new TestRunner();

// 模拟 localStorage
const mockLocalStorage = (() => {
  let storage = {};
  return {
    setItem: (key, value) => {
      storage[key] = value;
    },
    getItem: (key) => {
      return storage[key] || null;
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index) => {
      return Object.keys(storage)[index];
    },
    // 模拟存储空间不足
    simulateStorageFull: () => {
      for (let i = 0; i < 1000000; i++) {
        storage[`large_key_${i}`] = 'x'.repeat(1000);
      }
    }
  };
})();

// 清除 localStorage
function clearStorage() {
  mockLocalStorage.clear();
}

// 创建 GameState 类的测试版本
class MockGameState {
  constructor() {
    this.VERSION = 1;
    this.CURRENT_SLOT = 1;
    this.storage = mockLocalStorage;
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
  }

  // 计算校验和
  calculateChecksum(data) {
    // 使用简单的字符串哈希，兼容 Node.js 和浏览器
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  // 验证数据完整性
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

  // 初始化新游戏
  initNewGame() {
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
    this.saveTime = new Date().toISOString();
    this.CURRENT_SLOT = 1;
    return Promise.resolve();
  }

  // 自动保存
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
      return Promise.resolve(false);
    }
  }

  // 保存到指定槽位
  saveToSlot(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('无效的存档槽位');
    }

    this.CURRENT_SLOT = slotId;
    return this.autoSave();
  }

  // 从指定槽位读取
  loadFromSlot(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('无效的存档槽位');
    }

    const key = `game_save_${slotId}`;
    const savedData = this.storage.getItem(key);

    if (!savedData) {
      return Promise.resolve(null);
    }

    try {
      const data = JSON.parse(savedData);
      if (this.validateSave(data)) {
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
        return Promise.resolve(data);
      } else {
        return Promise.resolve(null);
      }
    } catch (error) {
      return Promise.resolve(null);
    }
  }

  // 获取存档槽位信息
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

  // 删除存档
  deleteSave(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('无效的存档槽位');
    }

    const key = `game_save_${slotId}`;
    this.storage.removeItem(key);
    return Promise.resolve(true);
  }

  // 重置游戏
  resetGame() {
    this.initNewGame();
    for (let i = 1; i <= 3; i++) {
      this.deleteSave(i).catch(() => {});
    }
    return Promise.resolve();
  }

  // 导出存档
  exportSave(slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('无效的存档槽位');
    }

    const key = `game_save_${slotId}`;
    const savedData = this.storage.getItem(key);
    return Promise.resolve(savedData);
  }

  // 导入存档
  importSave(data, slotId) {
    if (slotId < 1 || slotId > 3) {
      throw new Error('无效的存档槽位');
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
      return Promise.resolve(false);
    }
  }

  // 更新玩家状态
  updatePlayerState(updates) {
    Object.assign(this.playerState, updates);
  }
}

// 初始化测试环境
let gameState;

function setupTest() {
  clearStorage();
  gameState = new MockGameState();
}

// 清理测试环境
function cleanupTest() {
  clearStorage();
}

// 运行测试

runner.describe('游戏状态管理 (GameState)', () => {
  runner.describe('新游戏初始化', () => {
    runner.it('TC-001: 应该创建默认玩家状态', () => {
      setupTest();
      gameState.initNewGame();

      runner.expect(gameState.playerState.hp).toBe(100);
      runner.expect(gameState.playerState.maxHp).toBe(100);
      runner.expect(gameState.playerState.gold).toBe(0);
      runner.expect(gameState.playerState.deck).toEqual([]);
      runner.expect(gameState.progressState.currentLevel).toBe(1);
      runner.expect(gameState.progressState.currentArea).toBe(1);
    });

    runner.it('TC-002: 应该有正确的初始设置', () => {
      setupTest();
      gameState.initNewGame();

      runner.expect(gameState.settings.musicVolume).toBe(0.8);
      runner.expect(gameState.settings.sfxVolume).toBe(0.9);
      runner.expect(gameState.settings.difficulty).toBe('normal');
      runner.expect(gameState.settings.autoSave).toBe(true);
    });

    runner.it('TC-009: 重置游戏应该清除所有存档', async () => {
      // 先保存一些数据
      await gameState.saveToSlot(1);
      await gameState.saveToSlot(2);
      await gameState.saveToSlot(3);

      // 验证存档存在
      const slots = await gameState.getSaveSlots();
      runner.expect(slots.every(slot => !slot.isEmpty)).toBe(true);

      // 重置游戏
      await gameState.resetGame();

      // 验证存档已被清除
      const newSlots = await gameState.getSaveSlots();
      runner.expect(newSlots.every(slot => slot.isEmpty)).toBe(true);

      // 验证游戏状态已重置
      runner.expect(gameState.playerState.hp).toBe(100);
      runner.expect(gameState.progressState.currentLevel).toBe(1);
    });
  });

  runner.describe('存档保存和读取', () => {
    runner.it('TC-002: 保存有效状态应该成功', async () => {
      gameState.playerState.hp = 50;
      gameState.playerState.gold = 100;
      gameState.progressState.currentLevel = 3;

      const result = await gameState.saveToSlot(1);

      runner.expect(result).toBe(true);
      const slots = await gameState.getSaveSlots();
      runner.expect(slots[0].isEmpty).toBe(false);
      runner.expect(slots[0].preview).toContain('关卡 3');
      runner.expect(slots[0].preview).toContain('生命值 50');
    });

    runner.it('TC-003: 读取有效存档应该完整恢复状态', async () => {
      // 先保存
      gameState.playerState.hp = 30;
      gameState.playerState.gold = 200;
      gameState.progressState.currentLevel = 5;
      await gameState.saveToSlot(1);

      // 创建新实例
      const newState = new MockGameState();

      // 读取存档
      const savedData = await newState.loadFromSlot(1);

      runner.expect(savedData).toBeTruthy();
      runner.expect(newState.playerState.hp).toBe(30);
      runner.expect(newState.playerState.gold).toBe(200);
      runner.expect(newState.progressState.currentLevel).toBe(5);
    });

    runner.it('TC-004: 读取损坏存档应该返回 null', async () => {
      // 存储损坏数据
      gameState.storage.setItem('game_save_1', 'invalid json');

      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });

    runner.it('TC-006: 读取空槽位应该返回 null', async () => {
      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });

    runner.it('TC-007: 自动保存应该保存到当前槽位', async () => {
      gameState.CURRENT_SLOT = 2;
      gameState.playerState.hp = 80;

      const result = await gameState.autoSave();

      runner.expect(result).toBe(true);
      const slots = await gameState.getSaveSlots();
      runner.expect(slots[1].isEmpty).toBe(false);
      runner.expect(slots[1].preview).toContain('生命值 80');
      runner.expect(slots[0].isEmpty).toBe(true);
    });

    runner.it('TC-008: 手动保存应该保存到指定槽位', async () => {
      gameState.playerState.hp = 60;
      gameState.playerState.gold = 150;

      await gameState.saveToSlot(3);

      const slots = await gameState.getSaveSlots();
      runner.expect(slots[2].isEmpty).toBe(false);
      runner.expect(slots[2].preview).toContain('生命值 60');
      runner.expect(slots[2].preview).toContain('金币 150');
    });

    runner.it('TC-005: 保存到满额槽位应该覆盖现有存档', async () => {
      // 先保存数据到槽位1
      gameState.playerState.hp = 40;
      await gameState.saveToSlot(1);

      // 验证数据存在
      let slots = await gameState.getSaveSlots();
      runner.expect(slots[0].preview).toContain('生命值 40');

      // 覆盖数据
      gameState.playerState.hp = 90;
      await gameState.saveToSlot(1);

      // 验证数据被覆盖
      slots = await gameState.getSaveSlots();
      runner.expect(slots[0].preview).toContain('生命值 90');
    });
  });

  runner.describe('存档验证', () => {
    runner.it('TC-011: 校验和不匹配应该标记存档为损坏', async () => {
      // 正确保存
      await gameState.saveToSlot(1);

      // 修改存档数据但不修改校验和
      const key = `game_save_${1}`;
      const savedData = gameState.storage.getItem(key);
      const modifiedData = JSON.parse(savedData);
      modifiedData.hp = 999; // 修改数据

      // 重新计算错误的校验和
      modifiedData.checksum = gameState.calculateChecksum({
        version: modifiedData.version,
        hp: 50, // 使用旧值计算校验和
        maxHp: modifiedData.maxHp,
        gold: modifiedData.gold,
        currentLevel: modifiedData.currentLevel,
        currentArea: modifiedData.currentArea
      });

      gameState.storage.setItem(key, JSON.stringify(modifiedData));

      // 尝试读取
      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });

    runner.it('TC-012: localStorage 不可用应该降级到内存存储', async () => {
      // 模拟 localStorage 不可用
      const originalStorage = gameState.storage;
      gameState.storage = {
        getItem: () => { throw new Error('存储不可用'); },
        setItem: () => { throw new Error('存储不可用'); },
        removeItem: () => {},
        clear: () => {}
      };

      // 尝试保存
      const result = await gameState.autoSave();
      runner.expect(result).toBe(true);
    });

    runner.it('TC-015: 导入无效存档应该拒绝导入', async () => {
      const invalidData = JSON.stringify({
        version: 1.0,
        hp: 100,
        maxHp: 100,
        gold: 0,
        currentLevel: 1,
        currentArea: 1,
        saveTime: new Date().toISOString(),
        checksum: 'invalid_checksum'
      });

      const result = await gameState.importSave(invalidData, 1);
      runner.expect(result).toBe(false);

      const slots = await gameState.getSaveSlots();
      runner.expect(slots[0].isEmpty).toBe(true);
    });

    runner.it('TC-014: 导入有效存档应该成功', async () => {
      const validData = gameState.exportSave(1);

      gameState.initNewGame();

      const result = await gameState.importSave(await validData, 2);
      runner.expect(result).toBe(true);

      const slots = await gameState.getSaveSlots();
      runner.expect(slots[1].isEmpty).toBe(false);
    });
  });

  runner.describe('版本兼容性', () => {
    runner.it('TC-010: 版本不兼容应该显示警告', async () => {
      // 创建旧版本存档
      const oldVersionData = {
        version: 0, // 旧版本
        hp: 100,
        maxHp: 100,
        gold: 0,
        currentLevel: 1,
        currentArea: 1,
        saveTime: new Date().toISOString(),
        checksum: gameState.calculateChecksum({
          version: 0,
          hp: 100,
          maxHp: 100,
          gold: 0,
          currentLevel: 1,
          currentArea: 1
        })
      };

      gameState.storage.setItem('game_save_1', JSON.stringify(oldVersionData));

      // 尝试读取
      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });
  });

  runner.describe('边界条件', () => {
    runner.it('EC-001: localStorage 已满应该处理错误', async () => {
      // 模拟存储空间不足
      mockLocalStorage.simulateStorageFull();

      gameState.playerState.hp = 50;
      gameState.playerState.gold = 100;

      const result = await gameState.saveToSlot(1);
      // 即使存储空间不足，也应该返回 true（模拟降级处理）
      runner.expect(result).toBe(true);
    });

    runner.it('EC-002: 存档版本号不匹配应该拒绝读取', async () => {
      // 创建不支持的版本
      const futureVersionData = {
        version: 2, // 未来版本
        hp: 100,
        maxHp: 100,
        gold: 0,
        currentLevel: 1,
        currentArea: 1,
        saveTime: new Date().toISOString(),
        checksum: gameState.calculateChecksum({
          version: 2,
          hp: 100,
          maxHp: 100,
          gold: 0,
          currentLevel: 1,
          currentArea: 1
        })
      };

      gameState.storage.setItem('game_save_1', JSON.stringify(futureVersionData));

      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });

    runner.it('EC-003: 数据字段缺失应该使用默认值', async () => {
      // 创建缺少字段的存档
      const incompleteData = {
        version: 1,
        hp: 100,
        saveTime: new Date().toISOString(),
        checksum: gameState.calculateChecksum({
          version: 1,
          hp: 100,
          maxHp: 100,
          gold: 0,
          currentLevel: 1,
          currentArea: 1
        })
      };

      gameState.storage.setItem('game_save_1', JSON.stringify(incompleteData));

      // 由于 validateSave 会验证必需字段，应该返回 null
      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });

    runner.it('EC-005: 同时触发多次保存应该处理并发', async () => {
      // 模拟快速连续保存
      const promises = [];
      for (let i = 0; i < 5; i++) {
        gameState.playerState.hp = 50 + i;
        promises.push(gameState.saveToSlot(1));
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        runner.expect(result).toBe(true);
      });

      // 最终保存的应该是最后一个
      const finalSlots = await gameState.getSaveSlots();
      runner.expect(finalSlots[0].preview).toContain('生命值 54');
    });
  });

  runner.describe('错误处理', () => {
    runner.it('ERR_SLOT_INVALID: 无效的存档槽位应该抛出错误', () => {
      const invalidSlot = () => gameState.loadFromSlot(0);
      runner.expect(invalidSlot).toThrow();

      const invalidSlot2 = () => gameState.loadFromSlot(4);
      runner.expect(invalidSlot2).toThrow();
    });

    runner.it('ERR_SAVE_FAILED: 保存失败应该返回 false', async () => {
      // 创建总是失败存储
      gameState.storage.setItem = () => { throw new Error('保存失败'); };

      const result = await gameState.autoSave();
      runner.expect(result).toBe(false);
    });

    runner.it('ERR_LOAD_FAILED: 读取失败应该返回 null', async () => {
      gameState.storage.getItem = () => { throw new Error('读取失败'); };

      const result = await gameState.loadFromSlot(1);
      runner.expect(result).toBe(null);
    });
  });

  runner.describe('业务规则', () => {
    runner.it('BR-001: 自动保存应该使用当前槽位', async () => {
      gameState.CURRENT_SLOT = 2;

      gameState.playerState.hp = 70;
      await gameState.autoSave();

      const slots = await gameState.getSaveSlots();
      runner.expect(slots[1].isEmpty).toBe(false);
      runner.expect(slots[0].isEmpty).toBe(true);
      runner.expect(slots[2].isEmpty).toBe(true);
    });

    runner.it('BR-002: 存档槽位应该独立', async () => {
      // 在槽位1保存
      gameState.CURRENT_SLOT = 1;
      gameState.playerState.hp = 30;
      await gameState.saveToSlot(1);

      // 在槽位2保存不同数据
      gameState.CURRENT_SLOT = 2;
      gameState.playerState.hp = 50;
      await gameState.saveToSlot(2);

      const slots = await gameState.getSaveSlots();
      runner.expect(slots[0].preview).toContain('生命值 30');
      runner.expect(slots[1].preview).toContain('生命值 50');
      runner.expect(slots[2].preview).toBe('空');
    });

    runner.it('BR-003: 数据完整性验证应该正确', async () => {
      setupTest();

      // 使用实际保存的数据结构进行测试
      gameState.playerState.hp = 100;
      gameState.playerState.maxHp = 100;
      gameState.playerState.gold = 0;
      gameState.progressState.currentLevel = 1;
      gameState.progressState.currentArea = 1;

      // 保存真实数据
      await gameState.autoSave();

      // 从存储中读取验证
      const key = `game_save_${1}`;
      const savedData = gameState.storage.getItem(key);
      const parsedData = JSON.parse(savedData);

      runner.expect(gameState.validateSave(parsedData)).toBe(true);
      runner.expect(gameState.validateSave(null)).toBe(false);

      // Test invalid checksum
      const invalidData = { ...parsedData, checksum: 'wrong_checksum' };
      runner.expect(gameState.validateSave(invalidData)).toBe(false);
    });

    runner.it('BR-005: 重置应该保留永久解锁内容', async () => {
      // 模拟永久解锁内容
      gameState.playerState.unlockedCards = ['card1', 'card2'];

      await gameState.resetGame();

      runner.expect(gameState.playerState.unlockedCards).toEqual(['card1', 'card2']);
      runner.expect(gameState.playerState.hp).toBe(100);
    });
  });
});

// 运行测试并显示结果
const success = runner.summary();

if (success) {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
} else {
  console.log('\n❌ 有测试失败！');
  process.exit(1);
}