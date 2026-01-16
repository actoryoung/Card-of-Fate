/**
 * TDD Helper Skill
 *
 * 辅助测试驱动开发的技能，提供测试模板和最佳实践建议。
 */

/**
 * 生成单元测试模板
 * @param {string} framework - 测试框架 (jest|vitest|pytest)
 * @param {string} language - 编程语言
 * @returns {string} 测试模板
 */
function generateTestTemplate(framework, language) {
  // JavaScript/TypeScript 模板
  if (['javascript', 'typescript'].includes(language)) {
    return `
describe('${FUNCTION_NAME}', () => {
  describe('正常场景', () => {
    test('应返回预期结果', () => {
      // Arrange
      const input = /* 测试输入 */;

      // Act
      const result = ${FUNCTION_NAME}(input);

      // Assert
      expect(result).toBe(/* 预期输出 */);
    });
  });

  describe('边界条件', () => {
    test('空输入应处理', () => {
      expect(${FUNCTION_NAME}('')).toBeDefined();
    });

    test('极大输入应处理', () => {
      const largeInput = 'x'.repeat(10000);
      expect(() => ${FUNCTION_NAME}(largeInput)).not.toThrow();
    });
  });

  describe('异常场景', () => {
    test('无效输入应抛出异常', () => {
      expect(() => ${FUNCTION_NAME}(null)).toThrow();
    });
  });
});
`;
  }

  // Python 模板
  if (language === 'python') {
    return `
import pytest

class Test${CLASS_NAME}:
    """${CLASS_NAME} 单元测试"""

    def test_normal_case(self):
        """正常场景应返回预期结果"""
        # Arrange
        input_data = # 测试输入

        # Act
        result = ${FUNCTION_NAME}(input_data)

        # Assert
        assert result == # 预期输出

    def test_edge_case_empty(self):
        """空输入应正确处理"""
        assert ${FUNCTION_NAME}('') is not None

    def test_invalid_input_raises_error(self):
        """无效输入应抛出异常"""
        with pytest.raises(ValueError):
            ${FUNCTION_NAME}(None)
`;
  }

  throw new Error(`Unsupported language: ${language}`);
}

/**
 * TDD 循环检查清单
 */
const TDD_CHECKLIST = {
  red: [
    '测试是否明确描述了预期行为？',
    '测试名称是否具有描述性？',
    '测试是否会失败（因为实现还不存在）？'
  ],
  green: [
    '是否写了最少的代码让测试通过？',
    '是否避免了过度实现？',
    '测试是否通过了？'
  ],
  refactor: [
    '代码是否可以简化？',
    '是否有重复代码？',
    '命名是否清晰？',
    '测试是否仍然通过？'
  ]
};

/**
 * 获取 TDD 当前阶段建议
 * @param {string} phase - 当前阶段 (red|green|refactor)
 * @returns {string[]} 检查清单
 */
function getTDDChecklist(phase) {
  return TDD_CHECKLIST[phase] || [];
}

module.exports = {
  generateTestTemplate,
  getTDDChecklist,
  TDD_CHECKLIST
};
