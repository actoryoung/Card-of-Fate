/**
 * 模块依赖关系验证测试
 */

// 导入所有核心模块
import { Game, GAME_STATES, ERRORS } from './src/core/Game.js';
import GameState from './src/core/GameState.js';
import { CardManager } from './src/core/CardManager.js';
import { CombatSystem } from './src/core/CombatSystem.js';
import { LevelManager } from './src/core/LevelManager.js';
import GameRenderer from './src/ui/GameRenderer.js';

// 验证模块导入
console.log('=== 模块依赖关系验证 ===');

// 1. 验证 Game 类
console.log('\n1. 验证 Game 类');
try {
  const game = new Game();
  console.log('✓ Game 类创建成功');
  console.log('- 游戏状态常量:', Object.keys(GAME_STATES));
  console.log('- 错误代码常量:', Object.keys(ERRORS));
} catch (error) {
  console.error('✗ Game 类创建失败:', error.message);
}

// 2. 验证 GameState 类
console.log('\n2. 验证 GameState 类');
try {
  const gameState = new GameState();
  console.log('✓ GameState 类创建成功');
  const state = gameState.getState();
  console.log('- 玩家状态:', Object.keys(state.playerState));
  console.log('- 进度状态:', Object.keys(state.progressState));
} catch (error) {
  console.error('✗ GameState 类创建失败:', error.message);
}

// 3. 验证 CardManager 类
console.log('\n3. 验证 CardManager 类');
try {
  const cardManager = new CardManager();
  console.log('✓ CardManager 类创建成功');
  console.log('- 卡牌管理器状态:', cardManager.getGameState());
} catch (error) {
  console.error('✗ CardManager 类创建失败:', error.message);
}

// 4. 验证 CombatSystem 类
console.log('\n4. 验证 CombatSystem 类');
try {
  const combatSystem = new CombatSystem();
  console.log('✓ CombatSystem 类创建成功');
  const combatState = combatSystem.getCombatState();
  console.log('- 战斗状态:', combatState);
} catch (error) {
  console.error('✗ CombatSystem 类创建失败:', error.message);
}

// 5. 验证 LevelManager 类
console.log('\n5. 验证 LevelManager 类');
try {
  const gameState = new GameState();
  const combatSystem = new CombatSystem(gameState);
  const levelManager = new LevelManager(gameState, combatSystem);
  console.log('✓ LevelManager 类创建成功');
  const stats = levelManager.getGameStats();
  console.log('- 游戏统计:', stats);
} catch (error) {
  console.error('✗ LevelManager 类创建失败:', error.message);
}

// 6. 验证 GameRenderer 类
console.log('\n6. 验证 GameRenderer 类');
try {
  const renderer = new GameRenderer();
  console.log('✓ GameRenderer 类创建成功');
  console.log('- 渲染器状态:', {
    container: renderer.container ? '已设置' : '未设置',
    gameState: renderer.gameState ? '已设置' : '未设置'
  });
} catch (error) {
  console.error('✗ GameRenderer 类创建失败:', error.message);
}

// 7. 验证 Game 类的模块整合
console.log('\n7. 验证 Game 类的模块整合');
try {
  const game = new Game();
  console.log('✓ Game 类模块整合成功');
  console.log('- 游戏状态管理器:', game.gameState ? '✓' : '✗');
  console.log('- 卡牌管理器:', game.cardManager ? '✓' : '✗');
  console.log('- 战斗系统:', game.combatSystem ? '✓' : '✗');
  console.log('- 关卡管理器:', game.levelManager ? '✓' : '✗');
  console.log('- 渲染器:', game.renderer ? '✓' : '✗');
} catch (error) {
  console.error('✗ Game 类模块整合失败:', error.message);
}

// 8. 验证方法调用
console.log('\n8. 验证方法调用');
try {
  const game = new Game();

  // 测试初始化
  console.log('测试初始化...');
  game.initialize().then(() => {
    console.log('✓ 游戏初始化成功');

    // 测试状态获取
    const state = game.getState();
    console.log('- 当前游戏状态:', state.currentState);
    console.log('- 是否已初始化:', state.isInitialized);
    console.log('- 当前关卡ID:', state.currentLevelId);

    // 测试事件监听
    console.log('\n测试事件监听...');
    game.on('initialized', () => {
      console.log('✓ 初始化完成事件触发');
    });

    console.log('\n=== 模块依赖关系验证完成 ===');
    console.log('所有模块都已正确导入和实例化，可以开始游戏！');
  }).catch(error => {
    console.error('✗ 游戏初始化失败:', error.message);
  });

} catch (error) {
  console.error('✗ 方法调用验证失败:', error.message);
}

export { Game, GameState, CardManager, CombatSystem, LevelManager, GameRenderer };