# /spec

创建和管理项目规范（SPEC），支持规格驱动开发（Spec-Driven Development）。

## 描述

该命令帮助你创建、查看、更新和管理项目规范文档。规范驱动开发强调在编写代码之前先明确规范，然后基于规范编写测试，最后实现功能。

## 使用场景

- **新功能开发**：为新功能创建完整的规范文档
- **函数设计**：为函数编写输入输出规范、业务规则和边界条件
- **API 设计**：为 API 端点编写请求响应规范
- **代码审查**：基于规范审查代码实现是否符合预期
- **文档生成**：从规范自动生成测试用例

## 参数

| 参数 | 类型 | 必填 | 描述 | 可选值 |
|------|------|------|------|--------|
| action | string | 是 | 操作类型 | `create`, `view`, `update`, `list`, `generate-tests` |
| type | string | 否 | 规范类型 | `function`, `api`, `feature`, `module` |
| name | string | create 时必填 | 规范名称（如函数名、API路径） | - |
| path | string | 否 | 规范文件路径（默认 `.claude/specs/`） | - |

## 规范类型说明

### 1. Function Spec（函数规范）
适用于单个函数或方法的规范定义。

**包含内容**：
- 函数描述
- 输入参数（类型、约束）
- 输出值（类型、格式）
- 业务规则
- 边界条件
- 错误处理

### 2. API Spec（API 规范）
适用于 REST API、GraphQL 等接口规范。

**包含内容**：
- 端点路径和方法
- 请求参数（path/query/body）
- 响应格式
- 状态码定义
- 认证要求
- 速率限制

### 3. Feature Spec（功能规范）
适用于完整的功能模块规范。

**包含内容**：
- 功能概述
- 用户故事
- 验收标准
- 依赖关系
- 实现步骤

### 4. Module Spec（模块规范）
适用于整个模块或子系统的规范。

**包含内容**：
- 模块职责
- 公开接口
- 内部架构
- 与其他模块的交互

## 执行流程

### 创建规范 (`action: create`)

```
1. 确认规范类型和名称
   ↓
2. 选择对应的模板
   ↓
3. 填写规范内容
   ↓
4. 保存到 .claude/specs/<type>/<name>.md
   ↓
5. 返回规范文件路径
```

### 生成测试 (`action: generate-tests`)

```
1. 读取指定的规范文件
   ↓
2. 解析规范中的业务规则和边界条件
   ↓
3. 生成对应的测试用例
   ↓
4. 创建测试文件
   ↓
5. 返回测试文件路径和测试用例摘要
```

## 工作流集成

`/spec` 命令与以下命令和 Agent 配合使用：

```
/spec (创建规范)
    ↓
/test (基于规范生成测试)
    ↓
[编写实现代码]
    ↓
/test (运行测试)
    ↓
/refactor (重构优化)
```

## 示例用法

### 示例 1：创建函数规范

```
用户: /spec action=create type=function name=calculate_discount

Claude: 正在创建函数规范...
[使用 .claude/templates/specs/function-spec.md 模板]
[引导用户填写：输入、输出、业务规则、边界条件]
[保存到 .claude/specs/function/calculate_discount.md]
```

### 示例 2：基于规范生成测试

```
用户: /spec action=generate-tests name=calculate_discount

Claude: 正在基于规范生成测试...
[读取 .claude/specs/function/calculate_discount.md]
[解析业务规则和边界条件]
[生成测试文件 tests/test_calculate_discount.py]
[返回测试用例摘要]
```

### 示例 3：列出所有规范

```
用户: /spec action=list

Claude: 项目规范列表：
📁 function/
  - calculate_discount.md
  - validate_email.md
📁 api/
  - users POST.md
  - orders GET.md
📁 feature/
  - user-authentication.md
```

## 与 Spec-Kit 集成

如果项目已安装 [Spec-Kit](https://github.com/github/spec-kit)，该命令会：

1. 使用 Spec-Kit 的规范格式
2. 调用 `specify` 命令进行规范初始化
3. 生成与 Spec-Kit 兼容的规范文件

安装 Spec-Kit：
```bash
# 使用 uv（推荐）
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 或使用 pip
pip install specify-cli
```

## 注意事项

1. **规范先于代码**：始终先编写规范，再编写测试，最后实现代码
2. **规范是活文档**：规范应随需求变化而更新
3. **测试即验证**：测试用例是规范的可执行验证
4. **保持简洁**：规范应清晰简洁，避免过度详细
5. **版本控制**：规范文件应纳入 Git 版本控制

## 相关资源

- [Spec-Kit 官方仓库](https://github.com/github/spec-kit)
- [.claude/docs/spec-kit-guide.md](./spec-kit-guide.md) - Spec-Kit 详细使用指南
- [.claude/templates/specs/](./templates/specs/) - 规范模板目录
