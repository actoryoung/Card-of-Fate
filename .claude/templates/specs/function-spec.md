# Function Spec: {{FUNCTION_NAME}}

> **版本**: 1.0
> **创建日期**: {{DATE}}
> **作者**: {{AUTHOR}}
> **状态**: Draft | Review | Approved

## Description

<!-- 简洁描述这个函数的功能和目的 -->

## Function Signature

```python
{{LANGUAGE_SIGNATURE}}
# 示例: def {{FUNCTION_NAME}}({{PARAMETERS}}) -> {{RETURN_TYPE}}:
```

## Inputs

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| {{PARAM_NAME}} | {{TYPE}} | Yes/No | {{CONSTRAINTS}} | {{DESCRIPTION}} |

### Input Validation

<!-- 定义输入验证规则 -->
- [ ] {{VALIDATION_RULE_1}}
- [ ] {{VALIDATION_RULE_2}}

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| {{RETURN_FIELD}} | {{TYPE}} | {{DESCRIPTION}} |

### Output Format

<!-- 描述输出值的格式和约束 -->
```
{{OUTPUT_EXAMPLE}}
```

## Business Rules

<!-- 定义核心业务逻辑规则 -->
1. **规则名称**: {{RULE_DESCRIPTION}}
   - 条件: {{CONDITION}}
   - 结果: {{RESULT}}

2. **规则名称**: {{RULE_DESCRIPTION}}
   - 条件: {{CONDITION}}
   - 结果: {{RESULT}}

## Edge Cases

| Case | Input | Expected Output | Notes |
|------|-------|-----------------|-------|
| {{CASE_NAME}} | {{INPUT}} | {{OUTPUT}} | {{NOTES}} |
| 空值输入 | `null`, `""`, `[]` | {{BEHAVIOR}} | {{NOTES}} |
| 边界值 | {{BOUNDARY_VALUE}} | {{BEHAVIOR}} | {{NOTES}} |

## Error Handling

| Error Type | Condition | Error Code | Message |
|------------|-----------|------------|---------|
| {{ERROR_TYPE}} | {{CONDITION}} | {{CODE}} | {{MESSAGE}} |

### Exception Behavior

```python
# 示例错误处理
if {{INVALID_CONDITION}}:
    raise {{ExceptionType}}("{{ERROR_MESSAGE}}")
```

## Dependencies

<!-- 函数依赖的其他组件或服务 -->
- `{{DEPENDENCY_NAME}}`: {{PURPOSE}}

## Performance Requirements

- **时间复杂度**: {{COMPLEXITY}}
- **最大执行时间**: {{TIME_LIMIT}}
- **内存限制**: {{MEMORY_LIMIT}}

## Test Cases

### Normal Cases

```python
# {{TEST_DESCRIPTION}}
assert {{FUNCTION_NAME}}({{INPUT}}) == {{EXPECTED_OUTPUT}}
```

### Edge Cases

```python
# {{TEST_DESCRIPTION}}
assert {{FUNCTION_NAME}}({{EDGE_INPUT}}) == {{EXPECTED_OUTPUT}}
```

### Error Cases

```python
# {{TEST_DESCRIPTION}}
with pytest.raises({{ExceptionType}}):
    {{FUNCTION_NAME}}({{INVALID_INPUT}})
```

## Implementation Notes

<!-- 任何实现相关的注意事项 -->

## Examples

### Example 1: {{EXAMPLE_TITLE}}

```python
result = {{FUNCTION_NAME}}(
    {{PARAM1}}={{VALUE1}},
    {{PARAM2}}={{VALUE2}}
)
print(result)  # {{EXPECTED_OUTPUT}}
```

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | {{DATE}} | Initial version | {{AUTHOR}} |
