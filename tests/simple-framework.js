/**
 * 简化测试框架
 */
class SimpleTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0
    };
  }

  describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
  }

  it(name, fn) {
    try {
      fn();
      this.results.passed++;
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy, got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy, got ${actual}`);
        }
      },
      toThrow: (expectedError) => {
        let threw = false;
        try {
          actual();
        } catch (e) {
          threw = true;
          if (expectedError && e.message !== expectedError) {
            throw new Error(`Expected error "${expectedError}", got "${e.message}"`);
          }
        }
        if (!threw) {
          throw new Error('Expected function to throw');
        }
      },
      toContain: (expected) => {
        if (typeof actual === 'string' && !actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
        if (Array.isArray(actual) && !actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`);
        }
      }
    };
  }

  summary() {
    console.log('\n📊 测试结果:');
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`📈 总计: ${this.results.passed + this.results.failed}`);
    return this.results.failed === 0;
  }
}

export default SimpleTestRunner;