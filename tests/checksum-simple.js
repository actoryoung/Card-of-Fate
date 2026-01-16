const testData = {
  version: 1.0,
  hp: 100,
  maxHp: 100,
  gold: 0,
  currentLevel: 1,
  currentArea: 1
};

function calculateChecksum(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

const checksum = calculateChecksum(testData);
console.log('Calculated checksum:', checksum);

const testSaveData = {
  ...testData,
  saveTime: new Date().toISOString(),
  checksum: checksum
};

function validateSave(data) {
  console.log('validateSave called');
  console.log('data:', data);

  if (!data) return false;

  const expectedChecksum = calculateChecksum({
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

console.log('Validation result:', validateSave(testSaveData));