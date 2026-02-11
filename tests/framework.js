/**
 * 测试框架配置
 * 使用原生 JS 实现简单的测试框架
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0
    };
    this.beforeEachHooks = [];
    this.currentTests = [];
  }

  describe(name, fn) {
    const beforeEachHooksBackup = [...this.beforeEachHooks];
    this.beforeEachHooks = [];

    console.group(`📦 ${name}`);
    fn(this);

    // 等待所有测试完成
    Promise.all(this.currentTests).then(() => {
      console.groupEnd();
    });

    this.beforeEachHooks = beforeEachHooksBackup;
    this.currentTests = [];
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  runBeforeEachHooks() {
    this.beforeEachHooks.forEach(hook => hook());
  }

  it(name, fn) {
    const testPromise = (async () => {
      try {
        this.runBeforeEachHooks();
        await fn();
        this.results.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.results.failed++;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
      }
    })();
    this.currentTests.push(testPromise);
    return testPromise;
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toBeInstanceOf: (expected) => {
        if (!(actual instanceof expected)) {
          throw new Error(`Expected instanceof ${expected.name}, but got ${typeof actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`);
        }
      },
      toThrow: (expectedError) => {
        let threw = false;
        let error = null;
        try {
          actual();
        } catch (e) {
          threw = true;
          error = e;
        }
        if (!threw) {
          throw new Error('Expected function to throw');
        }
        if (expectedError && !error.message.includes(expectedError)) {
          throw new Error(`Expected throw with error "${expectedError}", but got "${error.message}"`);
        }
      },
      not: {
        toThrow: () => {
          let threw = false;
          try {
            actual();
          } catch (e) {
            threw = true;
          }
          if (threw) {
            throw new Error('Expected function not to throw, but it did');
          }
        },
        toBeNull: () => {
          if (actual === null) {
            throw new Error('Expected value not to be null, but it was null');
          }
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Expected null, but got ${actual}`);
        }
      },
      notToBeNull: () => {
        if (actual === null) {
          throw new Error(`Expected not null, but got null`);
        }
      },
      toThrow: async (expectedError) => {
        try {
          await actual();
          throw new Error('Expected function to throw');
        } catch (error) {
          if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(`Expected throw with error "${expectedError}", but got "${error.message}"`);
          }
        }
      },
      toThrowSync: (expectedError) => {
        let threw = false;
        let error = null;
        try {
          actual();
        } catch (e) {
          threw = true;
          error = e;
        }
        if (!threw) {
          throw new Error('Expected function to throw');
        }
        if (expectedError && !error.message.includes(expectedError)) {
          throw new Error(`Expected throw with error "${expectedError}", but got "${error.message}"`);
        }
      },
      toBeUndefined: () => {
        if (actual !== undefined) {
          throw new Error(`Expected undefined, but got ${actual}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error(`Expected defined value, but got undefined`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (!(actual > expected)) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (!(actual < expected)) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toBeGreaterThanOrEqual: (expected) => {
        if (!(actual >= expected)) {
          throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
        }
      },
      toBeLessThanOrEqual: (expected) => {
        if (!(actual <= expected)) {
          throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
        }
      },
      toBeCloseTo: (expected, delta = 2) => {
        if (Math.abs(actual - expected) > delta) {
          throw new Error(`Expected ${actual} to be close to ${expected} (delta: ${delta})`);
        }
      },
      toContain: (expected) => {
        if (typeof actual === 'string' && !actual.includes(expected)) {
          throw new Error(`Expected string to contain "${expected}", but got "${actual}"`);
        } else if (Array.isArray(actual) && !actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}, but got [${actual.join(', ')}]`);
        }
      },
      toHaveLength: (expected) => {
        const actualLength = actual.length;
        if (actualLength !== expected) {
          throw new Error(`Expected length ${expected}, but got ${actualLength}`);
        }
      }
    };
  }

  async summary() {
    // 等待所有测试完成
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n📊 测试结果:');
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`⏭️  跳过: ${this.results.skipped}`);
    console.log(`📈 总计: ${this.results.passed + this.results.failed + this.results.skipped}`);
    return this.results.failed === 0;
  }
}

// 导出供测试文件使用
export default TestRunner;
