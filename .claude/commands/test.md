# /test

## 描述
运行测试并处理失败用例，支持 TDD 开发模式。

## 使用场景
- 开发过程中运行测试
- TDD 循环中的验证步骤
- CI 前本地验证

## 参数
- `pattern` (可选): 测试文件模式，默认运行全部
- `watch` (可选): 监听模式，用于 TDD

## 执行流程
1. 运行测试命令
2. 收集失败用例
3. 分析失败原因
4. 提供修复建议
5. 如有 watch 参数，启动监听模式

## 输出示例
```
运行测试: npm test

✓ 42 个测试通过
✗ 3 个测试失败

失败详情:
1) login.test.js:15 - 用户登录：错误凭证应抛出异常
   预期: throw Error
   实际: return null

建议: 检查 login 函数的错误处理逻辑
```

## TDD 模式
```bash
# 监听模式（推荐 TDD 使用）
/test --watch

# 单个测试文件
/test --pattern login.test.js
```

## 注意事项
- **通用命令**：支持 Jest、Vitest、Pytest 等主流框架
- 项目特定：需要在 CLAUDE.md 中配置测试命令
