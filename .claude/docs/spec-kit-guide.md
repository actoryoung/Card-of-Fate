# Spec-Kit 使用指南

> **规格驱动开发（Spec-Driven Development）完整指南**

## 目录

- [简介](#简介)
- [安装](#安装)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [工作流](#工作流)
- [与 Claude Code 模板集成](#与-claude-code-模板集成)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 简介

**Spec-Kit** 是 GitHub 开源的规格驱动开发工具包，旨在帮助开发者更有效地与 AI 编码助手（如 GitHub Copilot、Claude Code、Cursor 等）协作。

### 核心理念

```
规范（Specification）→ 测试（Tests）→ 实现（Implementation）
```

**传统开发**：需求 → 代码 → 测试
**Spec-Kit**：**需求 → 规范 → 测试 → 代码**

### 优势

| 优势 | 说明 |
|------|------|
| **明确需求** | 强制在编码前明确规范 |
| **提高 AI 协作效率** | AI 基于结构化规范生成更准确的代码 |
| **可测试性** | 测试直接映射规范 |
| **减少返工** | 规范明确减少理解偏差 |

---

## 安装

### 方式 1：使用 uv（推荐）

```bash
# 安装 uv（如果未安装）
curl -LsSf https://astral.sh/uv/install.sh | sh  # Linux/macOS
irm https://astral.sh/uv/install.ps1 | iex        # Windows PowerShell

# 使用 uv 安装 Spec-Kit
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

### 方式 2：使用 pip

```bash
pip install specify-cli
```

### 方式 3：使用模板脚本

本模板提供了快速安装脚本：

```bash
# Linux/macOS
bash .claude/tools/spec-kit-init.sh

# Windows PowerShell
.\.claude\tools\spec-kit-init.ps1
```

### 验证安装

```bash
specify --version
```

---

## 快速开始

### 1. 初始化项目

```bash
# 在项目根目录
specify init
```

这会创建以下结构：

```
.specify/
├── principles.md     # 项目治理原则
├── plan.md           # 技术实现计划
└── specs/            # 规范目录
```

### 2. 创建规范

```bash
specify create
```

根据提示输入规范信息：

```
? 规范名称: user_login
? 规范类型: Function
? 描述: 用户登录功能
```

### 3. 生成实现

```bash
specify implement
```

Spec-Kit 会基于规范生成：
- 测试文件
- 实现代码骨架
- 文档

---

## 核心概念

### Spec-Kit 规范结构

```markdown
# Spec: {名称}

## Status
Draft | In Review | Approved | Implemented

## Summary
[功能概述]

## Requirements
1. [需求 1]
2. [需求 2]

## Test Plan
- [ ] 测试用例 1
- [ ] 测试用例 2

## Implementation Notes
[实现注意事项]
```

### 规范类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **Function** | 函数/方法规范 | `calculate_discount` |
| **API** | API 端点规范 | `POST /api/users` |
| **Feature** | 功能模块规范 | `用户认证系统` |
| **Module** | 模块/子系统规范 | `支付网关集成` |

---

## 工作流

### 完整的 Spec-Driven TDD 工作流

```
┌─────────────────────────────────────────────────────────────┐
│  1. 编写规范 (SPEC)                                          │
│     specify create                                          │
├─────────────────────────────────────────────────────────────┤
│  2. 审查规范                                                  │
│     检查完整性、清晰度、可测试性                               │
├─────────────────────────────────────────────────────────────┤
│  3. 生成测试 (基于规范)                                       │
│     specify implement --test-only                           │
├─────────────────────────────────────────────────────────────┤
│  4. 运行测试 (RED - 失败)                                     │
│     pytest                                                  │
├─────────────────────────────────────────────────────────────┤
│  5. 实现功能                                                 │
│     编写满足规范的代码                                        │
├─────────────────────────────────────────────────────────────┤
│  6. 运行测试 (GREEN - 通过)                                   │
│     pytest                                                  │
├─────────────────────────────────────────────────────────────┤
│  7. 重构优化                                                 │
│     在测试保护下重构代码                                      │
└─────────────────────────────────────────────────────────────┘
```

### 使用本模板的简化工作流

本模板已集成 Spec-Kit 支持，可通过以下方式使用：

#### 方式 1：使用 /spec 命令

```bash
# 创建规范
/spec action=create type=function name=calculate_discount

# 基于规范生成测试
/spec action=generate-tests name=calculate_discount

# 查看所有规范
/spec action=list
```

#### 方式 2：使用 spec-writer Agent

```
User: "帮我为用户登录功能编写规范"

Claude 会：
1. 调用 spec-writer Agent
2. 使用标准模板创建规范
3. 保存到 .claude/specs/
```

#### 方式 3：直接使用 Spec-Kit CLI

```bash
# 初始化 Spec-Kit
specify init

# 创建新规范
specify create

# 生成实现
specify implement
```

---

## 与 Claude Code 模板集成

本模板已完全集成 Spec-Kit 支持：

### 集成文件

| 文件 | 说明 |
|------|------|
| `.claude/commands/spec.md` | `/spec` 命令定义 |
| `.claude/agents/spec-writer.md` | spec-writer Agent 配置 |
| `.claude/workflows/spec-driven-tdd.md` | Spec-Driven TDD 工作流 |
| `.claude/templates/specs/` | 规范模板目录 |
| `.claude/tools/` | Spec-Kit 安装脚本 |

### 集成方式

```
Claude Code 模板
    │
    ├── /spec 命令 ←─── 创建和管理规范
    │
    ├── spec-writer Agent ←─── 编写规范
    │
    ├── 规范模板 ←─── 结构化规范格式
    │
    ├── spec-driven-tdd 工作流 ←─── 完整开发流程
    │
    └── Spec-Kit CLI ──── 可选：官方工具支持
```

### 规范存储

规范文件存储在 `.claude/specs/` 目录：

```
.claude/specs/
├── function/         # 函数规范
│   ├── calculate_discount.md
│   └── user_login.md
├── api/             # API 规范
│   ├── users_list.md
│   └── orders_create.md
└── feature/         # 功能规范
    └── user_auth.md
```

---

## 最佳实践

### 1. 规范编写原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **明确性** | 使用精确语言，避免模糊 | ❌ "快速返回"<br>✅ "在 100ms 内返回" |
| **完整性** | 考虑所有场景 | 包含正常、边界、错误场景 |
| **可测试性** | 每个规则都可测试 | "当 X 时，返回 Y" |
| **简洁性** | 避免冗余信息 | 只包含必要信息 |

### 2. 规范结构

每个规范应包含：

```markdown
# [名称]

## Description
[简洁描述]

## Inputs
[输入定义]

## Outputs
[输出定义]

## Business Rules
[业务规则]

## Edge Cases
[边界条件]

## Error Handling
[错误处理]

## Test Cases
[测试用例]
```

### 3. 测试驱动

基于规范生成测试：

```python
# 规范：silver 等级 10% 折扣
def test_silver_discount():
    assert calculate_discount(100, "silver") == 90

# 规范：负价格抛出异常
def test_negative_price():
    with pytest.raises(ValueError):
        calculate_discount(-10, "silver")
```

### 4. 持续迭代

```
规范 v1.0 → 实现 → 反馈 → 规范 v1.1 → 重构
```

---

## 常见问题

### Q1: Spec-Kit 必须安装吗？

**A**: 不是必须的。本模板提供了独立的规范系统和工具，你可以：

- ✅ 使用 `/spec` 命令和 `spec-writer` Agent（无需 Spec-Kit）
- ✅ 可选安装 Spec-Kit 获得额外功能

### Q2: 规范应该多详细？

**A**: 遵循 **JUST ENOUGH** 原则：

- ✅ **足够的细节**：AI 可以理解并生成正确的代码
- ❌ **过度详细**：变成了伪代码，失去抽象价值
- ❌ **过于简单**：信息不足，AI 需要反复询问

### Q3: 规范如何版本控制？

**A**: 规范应纳入 Git 版本控制：

```bash
.claude/specs/
├── function/
│   └── calculate_discount.md  # 纳入版本控制
```

建议：
- 规范变更时更新版本号
- 使用 Commit Message 关联规范变更
- 重要规范变更需要 PR Review

### Q4: 如何处理规范冲突？

**A**: 当实现与规范不一致时：

1. **检查规范**：规范是否过时或不完整
2. **更新规范**：如果需求变化，更新规范
3. **审查实现**：如果实现错误，修复代码

原则：**规范是真相之源**

### Q5: 适合团队协作吗？

**A**: 非常适合！

- **规范即文档**：新人可快速理解功能
- **PR Review**：基于规范审查代码
- **AI 协作**：团队成员使用相同的规范与 AI 协作

---

## 进阶使用

### 自定义规范模板

编辑 `.claude/templates/specs/` 中的模板以适配项目需求。

### 与 CI/CD 集成

```yaml
# .github/workflows/spec-check.yml
name: Spec Check

on: [pull_request]

jobs:
  check-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check spec completeness
        run: |
          # 检查规范完整性脚本
          python .claude/tools/check-specs.py
```

### 自动生成文档

```bash
# 从规范生成 API 文档
specify export --format markdown --output docs/api.md
```

---

## 参考资源

- [Spec-Kit GitHub 仓库](https://github.com/github/spec-kit)
- [Spec-Driven Development 官方博客](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [.claude/workflows/spec-driven-tdd.md](../workflows/spec-driven-tdd.md) - 完整工作流
- [.claude/commands/spec.md](../commands/spec.md) - /spec 命令

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2024-12-29 | 初始版本 |
