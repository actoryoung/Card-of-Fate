// 模拟 gameState 类的核心功能
class MockGameState {
  constructor() {
    this.VERSION = 1;
  }

  calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  validateSave(data) {
    console.log('\n--- validateSave called ---');

    // Check each field step by step
    console.log('data exists:', !!data);
    console.log('version:', data?.version, typeof data?.version);
    console.log('hp:', data?.hp, typeof data?.hp);
    console.log('maxHp:', data?.maxHp, typeof data?.maxHp);
    console.log('gold:', data?.gold, typeof data?.gold);
    console.log('currentLevel:', data?.currentLevel, typeof data?.currentLevel);
    console.log('currentArea:', data?.currentArea, typeof data?.currentArea);
    console.log('saveTime:', data?.saveTime, typeof data?.saveTime);
    console.log('checksum:', data?.checksum, typeof data?.checksum);

    if (!data) {
      console.log('data is null/undefined');
      return false;
    }
    if (!data.version || typeof data.version !== 'number') {
      console.log('version validation failed');
      return false;
    }
    if (!data.hp || typeof data.hp !== 'number') {
      console.log('hp validation failed');
      return false;
    }
    if (!data.maxHp || typeof data.maxHp !== 'number') {
      console.log('maxHp validation failed');
      return false;
    }
    if (!data.gold || typeof data.gold !== 'number') {
      console.log('gold validation failed');
      return false;
    }
    if (!data.currentLevel || typeof data.currentLevel !== 'number') {
      console.log('currentLevel validation failed');
      return false;
    }
    if (!data.currentArea || typeof data.currentArea !== 'number') {
      console.log('currentArea validation failed');
      return false;
    }
    if (!data.saveTime || typeof data.saveTime !== 'string') {
      console.log('saveTime validation failed');
      return false;
    }
    if (!data.checksum || typeof data.checksum !== 'string') {
      console.log('checksum validation failed');
      return false;
    }
    console.log('All field validations passed');

    const expectedChecksum = this.calculateChecksum({
      version: data.version,
      hp: data.hp,
      maxHp: data.maxHp,
      gold: data.gold,
      currentLevel: data.currentLevel,
      currentArea: data.currentArea
    });

    console.log('Expected checksum:', expectedChecksum);
    console.log('Actual checksum:', data.checksum);
    console.log('Match:', expectedChecksum === data.checksum);

    return expectedChecksum === data.checksum;
  }
}

const gameState = new MockGameState();

// Test 1: Basic checksum
const checksumData = {
  version: 1,
  hp: 100,
  maxHp: 100,
  gold: 0,
  currentLevel: 1,
  currentArea: 1
};

const checksum = gameState.calculateChecksum(checksumData);
console.log('\nTest 1 - Basic checksum calculation:');
console.log('Checksum:', checksum);

// Test 2: Validation
console.log('Checksum before creating validData:', checksum);

const validData = {
  ...checksumData,
  saveTime: new Date().toISOString(),
  checksum: checksum
};

console.log('\nTest 2 - Validation:');
console.log('Valid data checksum:', validData.checksum);
const result = gameState.validateSave(validData);
console.log('Validation result:', result);

// Test 3: Show the actual JSON being compared
console.log('\nTest 3 - JSON comparison:');
console.log('Checksum JSON:', JSON.stringify(checksumData));
console.log('Expected checksum:', gameState.calculateChecksum(checksumData));