/**
 * Git Helper Skill
 *
 * Git 操作辅助技能，提供常用 Git 命令和工作流。
 */

/**
 * Git 工作流类型
 */
const WORKFLOWS = {
  FEATURE: 'feature',
  BUGFIX: 'bugfix',
  HOTFIX: 'hotfix',
  REFACTOR: 'refactor'
};

/**
 * Conventional Commits 规范
 */
const COMMIT_TYPES = {
  FEAT: 'feat',      // 新功能
  FIX: 'fix',        // Bug 修复
  DOCS: 'docs',      // 文档更新
  STYLE: 'style',    // 代码格式（不影响功能）
  REFACTOR: 'refactor', // 重构
  PERF: 'perf',      // 性能优化
  TEST: 'test',      // 测试相关
  CHORE: 'chore',    // 构建/工具链相关
  CI: 'ci',          // CI 配置
  REVERT: 'revert'   // 回退提交
};

/**
 * 生成符合规范的分支名
 * @param {string} type - 分支类型 (feature|bugfix|hotfix|refactor)
 * @param {string} description - 简短描述
 * @param {string} ticketId - 关联的工单 ID（可选）
 * @returns {string} 分支名
 */
function generateBranchName(type, description, ticketId = '') {
  const normalizedDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const prefix = `${type}/${ticketId ? ticketId + '-' : ''}`;
  return `${prefix}${normalizedDescription}`;
}

/**
 * 生成符合 Conventional Commits 的提交信息
 * @param {string} type - 提交类型
 * @param {string} scope - 影响范围
 * @param {string} subject - 简短描述
 * @param {string} body - 详细描述（可选）
 * @param {string} footer - 关联 Issue（可选）
 * @returns {string} 完整提交信息
 */
function generateCommitMessage(type, scope, subject, body = '', footer = '') {
  let message = '';

  // Header: type(scope): subject
  if (scope) {
    message += `${type}(${scope}): ${subject}`;
  } else {
    message += `${type}: ${subject}`;
  }

  // Body
  if (body) {
    message += `\n\n${body}`;
  }

  // Footer
  if (footer) {
    message += `\n\n${footer}`;
  }

  return message;
}

/**
 * Git 操作检查清单
 */
const GIT_CHECKLIST = {
  beforeCommit: [
    '代码是否通过所有测试？',
    '是否添加了必要的文档？',
    '提交信息是否符合规范？',
    '是否有敏感信息被提交？'
  ],
  beforePush: [
    '是否拉取了最新代码？',
    '是否有冲突需要解决？',
    '是否通过了本地构建？'
  ],
  beforeMerge: [
    '是否完成了代码审查？',
    'CI 检查是否通过？',
    '是否有未完成的 TODO？'
  ]
};

/**
 * 获取 Git 工作流命令序列
 * @param {string} workflow - 工作流类型
 * @param {string} branchName - 分支名称
 * @returns {string[]} Git 命令序列
 */
function getWorkflowCommands(workflow, branchName) {
  const commands = {
    [WORKFLOWS.FEATURE]: [
      `git checkout develop`,
      `git pull origin develop`,
      `git checkout -b ${branchName}`,
      '# 开发完成后:',
      `git add .`,
      `git commit -m "feat: description"`,
      `git push origin ${branchName}`
    ],
    [WORKFLOWS.BUGFIX]: [
      `git checkout develop`,
      `git pull origin develop`,
      `git checkout -b ${branchName}`,
      '# 修复完成后:',
      `git add .`,
      `git commit -m "fix: description"`,
      `git push origin ${branchName}`
    ],
    [WORKFLOWS.HOTFIX]: [
      `git checkout main`,
      `git pull origin main`,
      `git checkout -b ${branchName}`,
      '# 修复完成后:',
      `git add .`,
      `git commit -m "fix: description"`,
      `git push origin ${branchName}`,
      '# 合并到 main 和 develop'
    ],
    [WORKFLOWS.REFACTOR]: [
      `git checkout -b ${branchName}`,
      '# 重构完成后:',
      `git add .`,
      `git commit -m "refactor: description"`,
      `git push origin ${branchName}`
    ]
  };

  return commands[workflow] || [];
}

module.exports = {
  WORKFLOWS,
  COMMIT_TYPES,
  generateBranchName,
  generateCommitMessage,
  GIT_CHECKLIST,
  getWorkflowCommands
};
