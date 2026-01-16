/**
 * 命运河牌 - 主入口文件
 * 整合所有模块，实现完整的游戏流程
 */

import { Game } from './core/Game.js';
import GameRenderer from './ui/GameRenderer.js';

// 游戏实例
let game;
let renderer;

// 初始化游戏
async function init() {
  try {
    showLoading();
    updateLoadingText(10, '正在初始化游戏引擎...');

    // 初始化游戏
    game = new Game();

    // 初始化渲染器 - 使用 document.body 作为容器
    // 这样渲染器可以在需要时创建全局反馈元素
    updateLoadingText(30, '正在初始化渲染器...');
    renderer = new GameRenderer();
    // 不传入 container，让渲染器只在需要时使用 document.body

    // 绑定UI事件
    updateLoadingText(50, '正在绑定游戏事件...');
    bindEvents();

    // 设置渲染器引用到游戏
    game.renderer = renderer;

    // 初始化游戏数据
    updateLoadingText(70, '正在加载游戏数据...');
    await game.initialize();

    updateLoadingText(90, '准备完成...');

    // 显示主菜单
    setTimeout(() => {
      showMainMenu();
    }, 500);

    console.log('游戏初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
    showError('游戏初始化失败: ' + error.message);
    updateLoadingText(0, '初始化失败');
  }
}

// 更新加载文本
function updateLoadingText(progress, text) {
  const loadingText = document.querySelector('.loading-text');
  if (loadingText) {
    loadingText.textContent = text || `加载中... ${progress}%`;
  }
}

// 绑定UI事件
function bindEvents() {
  // 新游戏按钮
  const newGameBtn = document.getElementById('btn-new-game');
  if (newGameBtn) {
    newGameBtn.addEventListener('click', async () => {
      console.log('新游戏按钮被点击');
      try {
        await game.startNewGame();
        console.log('新游戏已启动');
      } catch (error) {
        console.error('启动新游戏时出错:', error);
      }
    });
  } else {
    console.warn('找不到新游戏按钮');
  }

  // 继续游戏按钮
  const loadGameBtn = document.getElementById('btn-load-game');
  if (loadGameBtn) {
    loadGameBtn.addEventListener('click', () => {
      game.loadGame();
    });
  }

  // 返回主菜单按钮
  const backToMenuBtn = document.getElementById('btn-back-to-menu');
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
      game.backToMainMenu();
    });
  }

  // 下一回合按钮
  const nextTurnBtn = document.getElementById('btn-next-turn');
  if (nextTurnBtn) {
    nextTurnBtn.addEventListener('click', () => {
      game.nextTurn();
    });
  }

  // 结束回合按钮
  const endTurnBtn = document.getElementById('btn-end-turn');
  if (endTurnBtn) {
    endTurnBtn.addEventListener('click', () => {
      game.endPlayerTurn();
    });
  }
}

// 显示主菜单
function showMainMenu() {
  // 隐藏所有界面
  hideAllScreens();

  // 显示主菜单
  const mainMenu = document.getElementById('main-menu');
  if (mainMenu) {
    mainMenu.classList.add('active');
  }
}

// 隐藏所有界面
function hideAllScreens() {
  const screens = document.querySelectorAll('.screen');
  console.log('隐藏所有界面，找到', screens.length, '个界面元素');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
}

// 显示错误信息
function showError(message) {
  const errorBox = document.createElement('div');
  errorBox.className = 'error-box';
  errorBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(231, 76, 60, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 1000;
    text-align: center;
    max-width: 400px;
  `;
  errorBox.innerHTML = `
    <h3>⚠️ 错误</h3>
    <p>${message}</p>
    <button onclick="this.parentElement.remove()" style="
      margin-top: 15px;
      padding: 8px 20px;
      background: white;
      color: #e74c3c;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    ">确定</button>
  `;
  document.body.appendChild(errorBox);

  // 3秒后自动消失
  setTimeout(() => {
    if (errorBox.parentElement) {
      errorBox.remove();
    }
  }, 3000);
}

// 显示加载界面
function showLoading() {
  hideAllScreens();
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('active');
  }
}

// 显示关卡选择界面
function showLevelSelect() {
  console.log('showLevelSelect 被调用');
  hideAllScreens();
  const levelSelectScreen = document.getElementById('level-select-screen');
  console.log('关卡选择界面元素:', levelSelectScreen);
  if (levelSelectScreen) {
    levelSelectScreen.classList.add('active');
    console.log('已添加 active 类');
    renderLevelList();
  } else {
    console.error('找不到 level-select-screen 元素');
  }
}

// 渲染关卡列表
function renderLevelList() {
  console.log('renderLevelList 被调用');
  const levelGrid = document.getElementById('level-grid');
  if (!levelGrid) {
    console.warn('找不到 level-grid 元素');
    return;
  }
  if (!game) {
    console.warn('game 对象不存在');
    return;
  }
  if (!game.levelManager) {
    console.warn('levelManager 不存在');
    return;
  }

  const levels = game.levelManager.levels;
  console.log('关卡数据:', levels);
  levelGrid.innerHTML = '';

  if (!levels || levels.length === 0) {
    console.warn('没有可用的关卡数据');
    levelGrid.innerHTML = '<p style="text-align:center;">暂无可用关卡</p>';
    return;
  }

  levels.forEach(level => {
    const levelCard = document.createElement('div');
    levelCard.className = 'level-card';

    if (!level.unlocked) {
      levelCard.classList.add('locked');
    }

    if (level.completed) {
      levelCard.classList.add('completed');
    }

    if (level.unlocked) {
      levelCard.addEventListener('click', () => {
        console.log('点击关卡:', level.id);
        game.selectLevel(level.id);
        showCombatScreen();
      });
    }

    const typeMap = {
      'normal': '普通',
      'elite': '精英',
      'boss': 'BOSS',
      'rest': '休息',
      'shop': '商店'
    };

    levelCard.innerHTML = `
      <div class="level-id">第 ${level.id} 关</div>
      <div class="level-name">${level.name}</div>
      <div class="level-type">${typeMap[level.type] || level.type}</div>
    `;

    levelGrid.appendChild(levelCard);
  });

  console.log(`已渲染 ${levels.length} 个关卡`);
}

// 显示战斗界面
function showCombatScreen() {
  hideAllScreens();
  const combatScreen = document.getElementById('combat-screen');
  if (combatScreen) {
    combatScreen.classList.add('active');
  }
}

// 显示奖励界面
function showRewardScreen() {
  hideAllScreens();
  const rewardScreen = document.getElementById('reward-screen');
  if (rewardScreen) {
    rewardScreen.classList.add('active');
  }
}

// 显示游戏结束界面
function showGameOverScreen(isVictory) {
  hideAllScreens();
  const gameOverScreen = document.getElementById('game-over-screen');
  if (gameOverScreen) {
    gameOverScreen.classList.add('active');
    const messageEl = document.getElementById('game-over-message');
    if (messageEl) {
      messageEl.textContent = isVictory ? '游戏胜利！' : '游戏结束';
      messageEl.className = 'game-over-message ' + (isVictory ? 'victory' : 'defeat');
    }
  }
}

// 将全局UI函数附加到 window 对象，使其他模块可以访问
window.showLoading = showLoading;
window.showMainMenu = showMainMenu;
window.showLevelSelect = showLevelSelect;
window.showCombatScreen = showCombatScreen;
window.showRewardScreen = showRewardScreen;
window.showGameOverScreen = showGameOverScreen;
window.showError = showError;

// 启动游戏
window.addEventListener('DOMContentLoaded', init);
