# CLAUDE.md 模板

> 本模板适用于全栈项目开发，根据项目实际需求裁剪使用

---

## 项目概述

### 项目简介
- **项目名称**：
- **项目定位**：
- **核心价值**：

### 技术栈概览
| 层级 | 技术选型 | 版本 | 用途说明 |
|------|---------|------|---------|
| 前端 | | | |
| 后端 | | | |
| 数据库 | | | |
| 缓存 | | | |
| 部署 | | | |

---

## 项目架构

### 目录结构
```
project-root/
├── docs/                   # 项目文档
├── frontend/              # 前端代码
├── backend/               # 后端代码
├── shared/                # 共享代码（类型定义、工具函数等）
├── scripts/               # 构建和部署脚本
├── tests/                 # 测试代码
└── deploy/                # 部署配置
```

### 架构决策记录 (ADR)
| 决策 | 选择方案 | 被放弃方案 | 决策理由 | 决策日期 |
|------|---------|-----------|---------|---------|
| 示例：状态管理 | Zustand | Redux | 更简洁的 API，减少样板代码 | 2024-XX-XX |

---

## 开发规范

### 代码风格
- **JavaScript/TypeScript**: ESLint + Prettier 配置
- **Python**: Black + isort
- **命名约定**:
  - 变量/函数: camelCase
  - 组件/类: PascalCase
  - 常量: UPPER_SNAKE_CASE
  - 文件名: kebab-case

### Git 工作流
```
main (生产环境)
  └── develop (开发环境)
      └── feature/* (功能分支)
      └── bugfix/* (修复分支)
      └── hotfix/* (紧急修复)
```

### Commit 信息规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**: feat | fix | docs | style | refactor | test | chore

**示例**:
```
feat(auth): add OAuth2 login support

- Implement Google OAuth flow
- Add token refresh mechanism
- Update user session handling

Closes #123
```

---

## 常用命令

### 环境准备
```bash
# 安装依赖
npm install          # 前端
pip install -r requirements.txt  # 后端

# 配置环境变量
cp .env.example .env
```

### 开发调试
```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务
python run.py

# 同时启动前后端
npm run dev:all
```

### 构建部署
```bash
# 构建生产版本
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

---

## 核心功能模块

### 模块清单
| 模块名称 | 职责描述 | 负责人 | 状态 |
|---------|---------|-------|------|
| 用户认证 | 登录/注册/权限管理 | | |
| 数据同步 | 离线/在线数据同步 | | |
| 报表生成 | 数据导出和可视化 | | |

### 模块依赖关系
```
[用户认证] → [权限管理] → [业务功能]
     ↓
[会话管理] ← [数据持久化]
```

---

## API 设计

### RESTful 端点
```
# 用户模块
GET    /api/users           # 获取用户列表
POST   /api/users           # 创建用户
GET    /api/users/:id       # 获取用户详情
PUT    /api/users/:id       # 更新用户
DELETE /api/users/:id       # 删除用户
```

### 请求/响应示例
```typescript
// 请求
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "hashed_password"
}

// 响应
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": { ... }
  },
  "message": "Login successful"
}
```

---

## 环境配置

### 环境变量
```bash
# 应用配置
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:8000

# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# 第三方服务
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

### 配置文件
- `config/development.json` - 开发环境
- `config/production.json` - 生产环境
- `config/test.json` - 测试环境

---

## 测试策略

### 开发模式：TDD (测试驱动开发)

**采用 TDD 的理由**：
- 测试即文档，描述代码应该做什么
- 重构安全网，敢于修改代码
- 设计驱动工具，迫使代码解耦
- 减少调试时间，快速定位问题

#### TDD 核心循环

```
┌─────────────────────────────────────────┐
│            TDD 开发循环                   │
│                                         │
│    ┌─────────┐    ┌─────────┐          │
│    │  RED    │───>│  GREEN  │───┐      │
│    │(写失败测试)│  │(写实现)  │   │      │
│    └─────────┘    └─────────┘   │      │
│         │              │         │      │
│         │              └─────────┼─┐    │
│         │                        │ │    │
│         └────────────────────────┼─▼────┘
│                                  │
│                            ┌─────────┐
│                            │ REFACTOR │
│                            │  (重构)  │
│                            └─────────┘
│         ▲                            │
│         └────────────────────────────┘
│
└─────────────────────────────────────────┘
```

#### TDD 三步法

| 步骤 | 状态 | 操作 | 输出 | 原则 |
|------|------|------|------|------|
| **1. 写测试** | 🔴 RED | 先写一个失败的测试 | 明确需求 | "不写测试，不写代码" |
| **2. 写实现** | 🟢 GREEN | 写最少代码让测试通过 | 实现功能 | "刚好够用，不过度设计" |
| **3. 重构** | ♻️ REFACTOR | 优化代码，保持测试通过 | 改善设计 | "有测试保护，放心重构" |

#### TDD 实践示例

```javascript
// ========== Step 1: RED ==========
// 先写测试，描述预期行为
test('用户登录：正确凭证返回 token', () => {
  const result = login('user@example.com', 'correct_password');
  expect(result).toHaveProperty('token');
  expect(result.token).toMatch(/^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/);
});

// 运行测试：失败（因为 login 函数还不存在）
// npm test → FAIL

// ========== Step 2: GREEN ==========
// 写最少代码让测试通过
function login(email, password) {
  return { token: 'dummy.jwt.token' };  // 硬编码，快速通过
}

// 运行测试：通过
// npm test → PASS

// ========== Step 3: REFACTOR ==========
// 重构为真实实现
function login(email, password) {
  const user = authenticate(email, password);
  if (!user) throw new Error('Invalid credentials');
  return { token: generateJWT(user) };
}

// 运行测试：仍然通过
// npm test → PASS
```

#### TDD 最佳实践

**✅ 应该做**：
- 每次只写一个失败的测试
- 测试失败时立即停止，不要继续写代码
- 重构时保持所有测试通过
- 使用描述性的测试名称，描述业务行为

**❌ 不应该做**：
- 一次写多个测试
- 在测试失败时继续写实现
- 为了"覆盖率"写无意义测试
- Mock 系统内部逻辑（只 Mock 外部依赖）

#### TDD 与传统开发对比

| 维度 | 传统开发 | TDD |
|------|---------|-----|
| 开发顺序 | 先写代码，后补测试 | 先写测试，后写代码 |
| 测试定位 | 验证工具 | 设计工具 |
| 修改心态 | 害怕改坏代码 | 敢于重构优化 |
| 调试时间 | 占开发时间 30-50% | 占开发时间 10-20% |
| 代码质量 | 依赖经验 | 测试保护下持续改善 |

#### TDD 何时使用

**推荐使用 TDD**：
- 核心业务逻辑
- 复杂算法和数据处理
- 公共组件和工具函数
- API 端点和服务层

**不必强求 TDD**：
- UI 原型和探索性开发
- 一次性脚本
- 简单的配置文件
- 第三方集成代码（用集成测试覆盖）

### 测试金字塔

```
        /\
       /E2E\          ← 端到端测试 (少量，关键流程)
      /------\           TDD 优先：单元测试
     /  集成  \          其次：集成测试
    /----------\         最后：E2E 测试
   /    单元    \      ← 单元测试 (大量，覆盖核心逻辑)
  /______________\
```

### 测试规范
- **单元测试**: 覆盖率目标 ≥ 80%，使用 TDD 开发
- **集成测试**: 覆盖所有 API 端点
- **E2E 测试**: 覆盖核心用户流程
- **Mock 使用**: 仅用于外部依赖，不覆盖业务逻辑

### 运行测试
```bash
# 全部测试
npm test

# 监听模式（TDD 推荐）
npm test -- --watch

# 单个测试文件
npm test -- login.test.js

# 覆盖率报告
npm run test:coverage
```

---

## 代码审查

### PR 检查清单
- [ ] 代码通过所有测试
- [ ] 新增功能有对应测试
- [ ] 代码符合风格规范
- [ ] 更新了相关文档
- [ ] 没有引入新的安全漏洞
- [ ] 性能影响可接受

### PR 描述模板
```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

## 变更说明
简要描述本次变更的内容和目的

## 测试情况
描述测试方法和结果

## 相关 Issue
Closes #xxx
```

---

## 安全与合规

### 敏感数据处理
- 密码使用 bcrypt 加密，cost ≥ 10
- API 密钥存储在环境变量，不提交到代码库
- 日志中脱敏敏感信息（邮箱、手机号、身份证）

### 认证授权
- JWT Token 有效期: 1小时
- Refresh Token 有效期: 7天
- API 限流: 100请求/分钟/用户

### 依赖安全
```bash
# 定期扫描依赖漏洞
npm audit
pip-audit

# 依赖更新策略
# - 生产依赖: 锁定版本
# - 开发依赖: 允许小版本更新
```

---

## 性能与监控

### 性能基准
| 指标 | 目标值 | 当前值 |
|------|-------|-------|
| 首屏加载时间 | < 2s | |
| API 响应时间 (P95) | < 200ms | |
| 内存使用 | < 512MB | |

### 日志规范
```javascript
// 日志级别使用原则
logger.debug('详细调试信息，开发环境使用')
logger.info('关键业务流程节点')
logger.warn('异常但可恢复的情况')
logger.error('需要关注的错误')
```

### 监控告警
- 错误率 > 1% 触发告警
- 响应时间 P95 > 1s 触发告警
- 服务可用性 < 99.9% 触发告警

---

## 部署流程

### 构建步骤
```bash
# 1. 拉取代码
git pull origin main

# 2. 安装依赖
npm ci --production

# 3. 构建前端
npm run build

# 4. 运行数据库迁移
npm run migrate

# 5. 重启服务
pm2 restart all
```

### 回滚机制
```bash
# 快速回滚到上一版本
pm2 revert all

# 数据库回滚
npm run migrate:undo
```

---

## 常见问题

### 开发环境
**Q: 端口被占用怎么办？**
A: 修改 `.env` 文件中的 PORT 配置，或使用命令查找并终止占用进程

### 数据库
**Q: 数据库迁移失败？**
A: 检查迁移文件是否有语法错误，确保数据库连接正常

### 部署
**Q: 部署后页面空白？**
A: 检查静态资源路径配置，确认 API_BASE_URL 是否正确

---

## 业务术语表

| 术语 | 定义 | 示例 |
|------|------|------|
| | | |

---

## 外部依赖

### 第三方服务
| 服务 | 用途 | SLA | 降级方案 |
|------|------|-----|---------|
| | | | |

### 依赖健康检查
```bash
# 检查关键依赖可用性
npm run health-check
```

---

## 故障响应

### 故障分级
- **P0** (严重): 核心功能不可用，影响全部用户
- **P1** (高): 重要功能异常，影响部分用户
- **P2** (中): 功能降级，有替代方案
- **P3** (低): 体验问题，不影响使用

### 响应时间要求
| 故障等级 | 响应时间 | 解决时间 |
|---------|---------|---------|
| P0 | 15分钟 | 2小时 |
| P1 | 1小时 | 8小时 |
| P2 | 4小时 | 24小时 |
| P3 | 1天 | 3天 |

---

## 扩展性规划

### 技术债务清单
| 问题 | 影响 | 优先级 | 计划处理时间 |
|------|------|-------|-------------|
| | | | |

### 重构触发条件
- 代码复杂度超过阈值
- 性能测试发现瓶颈
- 新需求难以实现

---

## 待办事项

### 当前迭代
- [ ] 功能 A
- [ ] 功能 B
- [ ] Bug 修复

### 技术储备
- [ ] 新技术调研
- [ ] 性能优化
- [ ] 文档完善

---

## 知识索引

### 关键代码位置
| 功能 | 文件路径 | 说明 |
|------|---------|------|
| | | |

### 重要文档
- [架构设计文档](./docs/architecture.md)
- [API 文档](./docs/api.md)
- [部署手册](./docs/deployment.md)

---

## 更新日志

### 2024-XX-XX
- 新增 XXX 模块
- 修复 YYY 问题
- 更新 ZZZ 文档

---

**最后更新**: 2024-XX-XX
**维护者**: [你的名字]
