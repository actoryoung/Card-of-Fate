# Workflows 文档

## 概述

`.claude/workflows/` 目录包含了多步骤工作流定义，协调多个 commands 和 agents 完成复杂任务。

## 使用方式

在 Claude Code 中引用工作流：
```
请使用 feature-development 工作流
```

## 工作流列表

### feature-development.yaml

**功能**：新功能开发全流程

**步骤**：
1. 需求分析
2. 设计方案
3. TDD 开发（循环）
4. 代码审查
5. 集成测试
6. 文档更新
7. 提交代码
8. 创建 PR

**退出条件**：
- 所有测试通过
- 代码审查通过
- 文档已更新
- CI 检查通过

### bug-fix-flow.yaml

**功能**：Bug 修复流程

**步骤**：
1. 问题收集
2. 问题定位
3. 编写回归测试
4. 修复 Bug
5. 验证修复
6. 添加防护措施
7. 文档更新
8. 提交修复

**原则**：最小改动原则

### refactor-flow.yaml

**功能**：代码重构流程

**步骤**：
1. 代码分析
2. 确认测试覆盖
3. 重构规划
4. 小步重构（循环）
5. 验证行为不变
6. 代码审查

**原则**：
- 每次只改一个问题
- 频繁运行测试
- 小步提交
- 保持功能不变

### code-review-flow.yaml

**功能**：代码审查流程

**步骤**：
1. 获取变更上下文
2. 自动检查（linter, 类型检查, 测试）
3. 代码审查（5个维度）
4. 生成审查报告
5. 提供反馈

**审查维度**：
- 正确性
- 安全性
- 可维护性
- 性能
- 测试

## 创建自定义工作流

创建 `.claude/workflows/my-workflow.yaml`：

```yaml
name: My Workflow
description: 工作流描述

steps:
  - name: "步骤名称"
    agent: general-purpose
    actions:
      - 动作一
      - 动作二

  - name: "另一个步骤"
    command: /command-name
    actions:
      - 动作三

exit_conditions:
  - 条件一
  - 条件二

rollback_actions:
  - 回滚动作一
  - 回滚动作二
```
