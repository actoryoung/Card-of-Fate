# 命运河牌 - Orchestrator 配置

本文档定义了自动化开发流程的配置和执行计划。

## 项目信息

| 属性 | 值 |
|------|-----|
| 项目名称 | 命运河牌 (Card of Fate) |
| 技术栈 | HTML/CSS/JavaScript (纯原生) |
| 开发模式 | 规范驱动开发 (Spec-Driven Development) |
| 主控代理 | Orchestrator |

## 功能模块清单

基于 `.claude/specs/feature/` 中的规范文档：

| ID | 功能模块 | 规范文件 | 优先级 | 状态 |
|----|---------|---------|-------|------|
| F1 | CardManager | card-manager-spec.md | P0 | 规范完成 ✅ |
| F2 | CombatSystem | combat-system-spec.md | P0 | 规范完成 ✅ |
| F3 | GameState | game-state-spec.md | P0 | 规范完成 ✅ |
| F4 | GameRenderer | game-renderer-spec.md | P1 | 待生成 |
| F5 | LevelManager | level-manager-spec.md | P1 | 待生成 |

## 自动化流程配置

### 流程模板：规范驱动开发

```yaml
workflow: spec_driven_development
steps:
  - name: "编写规范"
    agent: spec-writer
    input:
      - 设计文档路径
      - 功能需求描述
    output:
      - .claude/specs/{type}/{name}-spec.md
    validation:
      - 规范完整性检查
      - 测试用例覆盖度检查

  - name: "生成测试"
    agent: test-writer
    input:
      - 规范文件路径
    output:
      - tests/{module}.test.js
    validation:
      - 测试代码语法检查
      - 测试用例与规范对照

  - name: "实现代码"
    agent: code-writer
    input:
      - 规范文件路径
      - 测试文件路径
    output:
      - src/{module}.js
    validation:
      - 代码通过测试
      - 代码符合规范

  - name: "代码审查"
    agent: code-reviewer
    input:
      - 实现代码路径
      - 规范文件路径
    output:
      - .claude/reviews/{module}-review.md
    validation:
      - 审查通过标准
      - 无阻塞性问题
```

### 检查点配置

| 检查点ID | 触发时机 | 验证内容 | 回退目标 |
|---------|---------|---------|---------|
| CP_SPEC | 规范生成后 | 规范完整性、可测试性 | 重新生成规范 |
| CP_TEST | 测试生成后 | 测试覆盖度、语法正确 | 重新生成测试 |
| CP_CODE | 代码实现后 | 测试通过、规范符合 | 重新实现代码 |
| CP_REVIEW | 代码审查后 | 代码质量、无阻塞性问题 | 修改代码 |

### 错误处理配置

```yaml
error_handling:
  L1_surface:
    action: "直接修复"
    max_retries: 0
    notify_user: false

  L2_logic:
    action: "重新调用代理"
    max_retries: 2
    notify_user: "重试2次后失败时通知"

  L3_design:
    action: "回退检查点"
    max_retries: 1
    notify_user: true
    fallback_checkpoint: "CP_SPEC"

  L4_understanding:
    action: "请求用户澄清"
    max_retries: 1
    notify_user: true
    fallback_checkpoint: "开始"
```

## 开发计划

### Phase 1: 核心功能 (当前阶段)

**目标**: 实现基础游戏逻辑

| 任务 | 规范 | 测试 | 代码 | 审查 | 状态 |
|------|------|------|------|------|------|
| CardManager | ✅ | 🔄 | ⏳ | ⏳ | 进行中 |
| CombatSystem | ✅ | ⏳ | ⏳ | ⏳ | 待开始 |
| GameState | ✅ | ⏳ | ⏳ | ⏳ | 待开始 |

### Phase 2: UI渲染

**目标**: 实现游戏界面

| 任务 | 规范 | 测试 | 代码 | 审查 | 状态 |
|------|------|------|------|------|------|
| GameRenderer | ⏳ | ⏳ | ⏳ | ⏳ | 待开始 |

### Phase 3: 游戏流程

**目标**: 整合完整游戏体验

| 任务 | 规范 | 测试 | 代码 | 审查 | 状态 |
|------|------|------|------|------|------|
| LevelManager | ⏳ | ⏳ | ⏳ | ⏳ | 待开始 |
| GameLoop | ⏳ | ⏳ | ⏳ | ⏳ | 待开始 |

## 触发命令

### 开始新功能开发
```
As an Orchestrator, start spec-driven development for:
- Feature: <功能名称>
- Spec template: feature-spec.md
- Priority: <P0/P1/P2>
- Requirements: <需求描述>
```

### 继续未完成的功能
```
As an Orchestrator, resume development for:
- Feature: <功能名称>
- Current checkpoint: <检查点ID>
- Last error: <错误描述>
```

### 批量开发多个功能
```
As an Orchestrator, execute batch development:
- Features: [<功能1>, <功能2>, <功能3>]
- Mode: parallel (可并行部分) / sequential (必须串行)
- Dependencies: <依赖关系描述>
```

## 验证清单

每个功能完成后必须验证：

- [ ] 规范文档完整（所有字段已填写）
- [ ] 测试用例覆盖所有业务规则
- [ ] 测试代码可运行
- [ ] 实现代码通过所有测试
- [ ] 代码符合规范要求
- [ ] 代码审查通过（无阻塞性问题）
- [ ] 文档已更新（如需要）

## 输出产物

每个功能开发完成后应产生：

```
.claude/
├── specs/feature/
│   └── {feature}-spec.md          # 功能规范
├── reviews/
│   └── {feature}-review.md        # 代码审查报告
└── ORCHESTRATOR_LOG.md            # 执行日志

src/
└── {module}.js                    # 实现代码

tests/
└── {module}.test.js               # 测试代码
```

## 快捷指令

```bash
# 开发单个功能
@orchestrator develop CardManager

# 批量开发（Phase 1核心功能）
@orchestrator develop-batch CardManager,CombatSystem,GameState

# 继续未完成的功能
@orchestrator resume CombatSystem

# 查看开发状态
@orchestrator status
```
