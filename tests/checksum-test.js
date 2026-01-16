import TestRunner from './framework.js';

const runner = new TestRunner();

class TestClass {
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

    console.log('Expected:', expectedChecksum);
    console.log('Actual:', data.checksum);
    console.log('Match:', expectedChecksum === data.checksum);

    return expectedChecksum === data.checksum;
  }
}

const testInstance = new TestClass();

const testData = {
  version: 1.0,
  hp: 100,
  maxHp: 100,
  gold: 0,
  currentLevel: 1,
  currentArea: 1
};

const checksum = testInstance.calculateChecksum(testData);
console.log('Test checksum:', checksum);

const testSaveData = {
  ...testData,
  saveTime: new Date().toISOString(),
  checksum: checksum
};

console.log('About to call validateSave...');
const validationResult = testInstance.validateSave(testSaveData);
console.log('Validation result after call:', validationResult);

runner.describe('Checksum Test', () => {
  runner.it('should calculate checksum correctly', () => {
    const result = testInstance.calculateChecksum(testData);
    console.log('Calculated checksum:', result);
  });
});