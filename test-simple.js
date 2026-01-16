import TestRunner from './tests/framework.js';

// 简单的测试
const testRunner = new TestRunner();

testRunner.describe('简单测试', () => {
  testRunner.it('应该通过', () => {
    const result = 1 + 1;
    testRunner.expect(result).toBe(2);
  });
});

const success = testRunner.summary();