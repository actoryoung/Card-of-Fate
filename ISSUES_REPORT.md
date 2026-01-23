# 命运河牌 - 问题报告

生成时间: 2026-01-16

## 🔴 严重问题（核心游戏机制）

### 1. 护甲机制错误（防御系统完全失效）
**位置**: `src/core/CombatSystem.js` 第442-470行 `calculateDamage()`

**问题描述**:
- 当前护甲计算是**永久减免伤害**，不是"临时生命"（Block）
- 代码保证最小伤害为1，导致低伤害卡（如3点伤害）打在有10点护甲的敌人上仍然造成1点伤害
- 这违背了卡牌游戏的基本机制：护甲应该作为临时生命值被消耗

**当前代码**:
```javascript
// 计算最终伤害
damage = damage - defender.armor;

// 最小伤害为1  ← 这是错误的！
damage = Math.max(1, damage);
```

**正确行为应该是**:
1. 护甲优先抵消伤害
2. 当护甲耗尽后，剩余伤害才作用于HP
3. 如果伤害≤护甲，则HP不受伤害，护甲相应减少
4. 低伤害卡可能完全被护甲吸收，不造成HP伤害

**影响**:
- 防御卡效果被严重削弱
- 低伤害卡牌失去战术价值
- 游戏难度失衡

---

### 2. 护甲没有在回合开始时重置
**位置**: `src/core/CombatSystem.js` 第119-139行 `startPlayerTurn()`

**问题描述**:
- 玩家回合开始时，护甲没有被清零
- 护甲应该只在当前回合有效，下回合开始时清零
- 这导致护甲可以无限累积

**当前代码**:
```javascript
startPlayerTurn() {
  // ...
  // 重置能量
  this.combatState.player.energy = this.combatState.player.maxEnergy;
  // ← 缺少：this.combatState.player.armor = 0;
  // ...
}
```

**影响**:
- 护甲永久累积，破坏游戏平衡
- 玩家可以通过堆叠防御卡变得无敌

---

### 3. 卡组无法更新（无法获得新卡牌）
**位置**: `src/core/LevelManager.js` 第649-682行 `generateRewards()`

**问题描述**:
- 奖励系统只生成金币，**从不生成 `card_choice`（卡牌选择）奖励**
- 玩家战斗胜利后无法获得新卡牌
- 卡组在整个游戏中保持10张初始卡牌不变

**当前代码**:
```javascript
generateRewards(levelId) {
  // 普通战只生成金币
  if (level.type === LEVEL_TYPES.NORMAL) {
    rewards.push({
      type: 'gold',  // ← 只有金币
      amount: ...
    });
    return rewards;
  }
  // 精英战、BOSS战同样只有金币
}
```

**应该的行为**:
- 每次战斗胜利后，玩家应该能够从3张随机卡牌中选择1张加入卡组
- 奖励应该包含 `card_choice` 类型
- 需要UI界面让玩家选择卡牌

**影响**:
- 游戏失去了卡牌构建的核心乐趣
- 无法体验卡组不断演变的策略性
- 重复游玩价值极低

---

### 4. 敌人意图在战斗开始时不可见
**位置**: `src/core/CombatSystem.js` 第65-114行 `startCombat()`

**问题描述**:
- 战斗开始时，敌人意图没有初始化
- `showEnemyIntent()` 只在敌人回合开始时调用（第173行）
- 玩家在第一回合无法看到敌人下回合的行动计划

**当前代码**:
```javascript
startCombat(enemy) {
  // ... 初始化战斗状态
  // ... 添加战斗日志

  // 开始玩家回合  ← 在这之前应该先显示敌人意图
  this.startPlayerTurn();
}
```

**应该的行为**:
- 在玩家第一回合开始前，就应该生成并显示敌人意图
- 让玩家能够根据敌人的行动计划做出决策

---

## 🟡 中等问题（功能缺陷）

### 5. 奖励界面没有卡牌选择功能
**位置**: `index.html` 第446-454行, `src/main.js` 第275-281行

**问题描述**:
- 奖励界面只有"下一关"按钮
- 没有显示可选卡牌的UI元素
- 即使生成了 `card_choice` 奖励，玩家也无法选择

**需要实现**:
- 显示3张随机卡牌
- 每张卡牌可点击查看详情
- 选择后卡牌加入卡组
- 跳过选项（不选择卡牌）

---

### 6. 护甲值UI更新不完整
**位置**: `src/core/Game.js` 第523-549行 `updateCombatUI()`

**问题描述**:
- `updateCombatUI()` 调用 `renderer.updateCombatUI()` 但这个方法不一定存在
- 护甲值更新依赖 `updatePlayerArmor()` 和 `updateEnemyArmor()` 被调用
- 但这些调用只在特定的更新方法中，不是所有UI更新路径都触发

**当前实现**:
```javascript
if (typeof this.renderer.updateCombatUI === 'function') {
  this.renderer.updateCombatUI(combatState);
} else {
  // 回退到旧方法
  this.renderer.renderPlayerState(combatState.player);
  this.renderer.renderEnemyState(combatState.enemy);
}
```

**风险**:
- 不同代码路径可能导致UI不一致
- 护甲值可能不及时更新

---

### 7. 卡牌效果类型不完整
**位置**: `src/core/CombatSystem.js` 第346-433行 `executeSkillCard()`

**问题描述**:
- 技能卡效果处理不完整
- 只有 `damage`, `status`, `draw`, `energy`, `vulnerable`, `draw_energy`
- 缺少其他常见效果类型：
  - `heal` - 治疗
  - `shield_break` - 破盾
  - `draw_and_discard` - 抽牌弃牌
  - `energy_gain_all` - 全员加能量
  - `copy` - 复制上一张卡
  - `exhaust` - 消耗卡牌

---

## 🟢 轻微问题（体验优化）

### 8. 战斗日志只在控制台显示
**位置**: `src/core/CombatSystem.js` 各处 `addCombatLog()`

**问题描述**:
- 战斗日志通过 `console.log()` 输出
- 玩家在游戏界面中看不到战斗过程详情
- 应该在UI中显示战斗日志面板

---

### 9. 回合切换延迟不够明显
**位置**: `src/core/Game.js` 第342-385行 `endPlayerTurn()`

**问题描述**:
- 回合切换使用了 `setTimeout`，但没有视觉反馈
- 玩家可能不清楚现在是哪个回合
- 应该添加"敌人回合"的视觉提示

---

### 10. 卡牌交互反馈不足
**位置**: `src/ui/GameRenderer.js`

**问题描述**:
- 卡牌悬停时没有显示详细信息（伤害数值、效果说明）
- 点击卡牌没有动画效果
- 出牌后没有视觉/音效反馈

---

### 11. 关卡选择界面信息不完整
**位置**: `src/main.js` 第198-263行 `renderLevelList()`

**问题描述**:
- 关卡卡片只显示ID、名称、类型
- 缺少重要信息：
  - 推荐卡组强度
  - 敌人预览
  - 预计难度
  - 特殊机制说明

---

## 📁 架构问题

### 12. 状态管理分散
**问题描述**:
- 游戏状态分散在多个对象中：
  - `Game.currentState`
  - `CombatSystem.combatState`
  - `GameState.playerState`
  - `CardManager.hand/drawPile/discardPile`
- 缺少统一的状态管理
- 容易出现状态不一致

**建议**:
- 实现单一状态树
- 所有状态变更通过action派发
- 使用观察者模式通知UI更新

---

### 13. UI更新依赖DOM查询
**位置**: `src/ui/GameRenderer.js`, `src/core/Game.js`

**问题描述**:
- 大量使用 `document.querySelector()` 获取DOM元素
- 每次UI更新都重新查询DOM
- 性能不佳且容易出错

**建议**:
- 在初始化时缓存DOM元素引用
- 使用组件化架构管理UI元素

---

### 14. 缺少数据持久化
**位置**: `src/core/GameState.js`

**问题描述**:
- 虽然有 `saveToSlot()` 和 `loadLatestSave()` 方法
- 但没有自动保存机制
- 游戏崩溃或刷新页面会丢失进度

**建议**:
- 每回合结束后自动保存
- 关卡完成时自动保存
- 提供多个存档槽位

---

### 15. 错误处理不完整
**问题描述**:
- 很多地方用 `console.warn()` 处理错误
- 玩家看不到错误信息
- 可能导致游戏进入未定义状态

**建议**:
- 实现全局错误处理
- 向用户显示友好的错误提示
- 记录错误日志用于调试

---

## 🎨 UI/UX 问题

### 16. 缺少游戏设置界面
**问题描述**:
- 无法调整：
  - 音量
  - 动画速度
  - 自动保存频率
  - 字体大小
  - 色盲模式

---

### 17. 缺少帮助/教程系统
**问题描述**:
- 新玩家不知道游戏规则
- 卡牌效果说明不够详细
- 没有新手引导

---

### 18. 缺少统计信息
**问题描述**:
- 无法查看：
  - 胜率
  - 最快通关时间
  - 最喜欢的卡牌
  - 死亡原因统计

---

## 🔧 性能问题

### 19. 每次抽牌都重新渲染整个手牌
**位置**: `src/core/Game.js` 第573-603行 `renderHandInContainer()`

**问题描述**:
- `container.innerHTML = ''` 清空整个容器
- 然后重新创建所有DOM元素
- 性能浪费

**建议**:
- 使用虚拟DOM或差量更新
- 只更新变化的部分

---

### 20. 没有资源预加载
**问题描述**:
- 卡牌图标、音效等资源没有预加载
- 可能导致首次使用时卡顿

---

## 📋 修复优先级建议

### P0 - 必须立即修复（游戏基本功能）
1. ✅ 护甲机制错误（问题#1）
2. ✅ 护甲回合重置（问题#2）
3. ✅ 卡组无法更新（问题#3）
4. ✅ 敌人意图初始化（问题#4）

### P1 - 高优先级（核心体验）
5. 奖励界面卡牌选择（问题#5）
6. 护甲UI更新（问题#6）
7. 错误处理（问题#15）

### P2 - 中优先级（游戏完整度）
8. 战斗日志UI（问题#8）
9. 回合切换反馈（问题#9）
10. 卡牌交互反馈（问题#10）
11. 数据持久化（问题#14）

### P3 - 低优先级（锦上添花）
12. 游戏设置（问题#16）
13. 教程系统（问题#17）
14. 统计信息（问题#18）
15. 性能优化（问题#19, #20）

---

## 总结

共发现 **20个问题**：
- 🔴 严重问题：4个
- 🟡 中等问题：6个
- 🟢 轻微问题：10个

建议优先修复P0和P1问题，使游戏基本功能完整。
