# 规范文档索引

本目录存放命运卡牌项目的所有功能规范文档。

## 目录结构

```
specs/
├── function/          # 函数级规范
├── feature/           # 功能模块级规范
└── api/              # API 接口规范
```

## 功能规范文档

### 已完成的规范

| 文档 | 描述 | 状态 | 创建日期 |
|------|------|------|----------|
| [card-manager-spec.md](feature/card-manager-spec.md) | 卡牌管理系统 | Draft | 2026-01-15 |
| [combat-system-spec.md](feature/combat-system-spec.md) | 战斗系统 | Draft | - |
| [game-state-spec.md](feature/game-state-spec.md) | 游戏状态管理 | Draft | - |
| [game-renderer-spec.md](feature/game-renderer-spec.md) | 游戏渲染器 | Draft | - |
| [level-manager-spec.md](feature/level-manager-spec.md) | 关卡管理器 | Draft | - |
| [roguelike-transformation-spec.md](feature/roguelike-transformation-spec.md) | **Roguelike游戏改造总规范** | Draft | 2026-02-09 |
| [relic-manager-spec.md](function/relic-manager-spec.md) | **RelicManager 遗物管理系统** | Draft | 2026-02-09 |
| [intent-system-spec.md](function/intent-system-spec.md) | **IntentSystem 意图系统** | Draft | 2026-02-09 |

### 规划中的规范

| 文档 | 描述 | 优先级 |
|------|------|--------|
| status-effect-spec.md | 状态效果系统规范 | High |
| map-system-spec.md | 地图关卡系统规范 | High |
| character-system-spec.md | 角色成长系统规范 | Medium |
| combat-phase-spec.md | 战斗阶段流转规范 | Medium |

## 规范编写规范

所有规范文档必须遵循以下原则：
- **明确性**：规则清晰无歧义
- **完整性**：包含输入、输出、规则、边界、错误处理
- **可测试性**：每个规则都可以被测试验证
- **可追溯性**：每个规范对应具体需求

## 质量检查清单

生成规范后必须检查：
- [ ] 所有输入参数都有类型定义
- [ ] 所有输出都有明确的格式
- [ ] 业务规则覆盖主要场景
- [ ] 边界条件已考虑
- [ ] 错误场景已定义
- [ ] 测试用例可执行
