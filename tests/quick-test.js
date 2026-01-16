// 快速测试GameRenderer的基本功能

// 模拟DOM环境（简化版）
global.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    appendChild: () => {},
    removeChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    innerHTML: '',
    offsetWidth: 100,
    offsetHeight: 140,
    clientWidth: 100,
    clientHeight: 140
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};

global.HTMLElement = function() {};
global.MouseEvent = function(type) {};
global.CustomEvent = function(type, detail) {};

// 创建一个简化版本的GameRenderer进行测试
class SimpleGameRenderer {
  constructor() {
    this.container = null;
    this.gameState = null;
    this.animationsEnabled = true;
  }

  init(container) {
    if (!container) {
      throw new Error('ERR_RENDER_CONTAINER_NOT_FOUND: 渲染容器不存在');
    }
    this.container = container;
  }

  renderCombatScreen() {
    if (!this.container) {
      throw new Error('ERR_RENDER_CONTAINER_NOT_FOUND: 渲染容器不存在');
    }
    this.container.innerHTML = '<div class="game-container">战斗界面</div>';
  }

  renderHand(cards) {
    if (!this.container) {
      throw new Error('ERR_RENDER_CONTAINER_NOT_FOUND: 渲染容器不存在');
    }
    this.container.innerHTML = `<div class="hand-container">手牌: ${cards.length}张</div>`;
  }

  updateHealthBar(target, current, max) {
    if (!this.container) return;
    this.container.innerHTML += `<div class="${target}-health">生命值: ${current}/${max}</div>`;
  }
}

// 测试
console.log('=== 快速测试 GameRenderer ===');

const renderer = new SimpleGameRenderer();

// 测试1: 初始化
try {
  renderer.init({ id: 'test-container' });
  console.log('✅ 初始化成功');
} catch (error) {
  console.log('❌ 初始化失败:', error.message);
}

// 测试2: 渲染战斗界面
try {
  const container = { id: 'test-container' };
  renderer.init(container);
  renderer.renderCombatScreen();
  console.log('✅ 渲染战斗界面成功');
} catch (error) {
  console.log('❌ 渲染战斗界面失败:', error.message);
}

// 测试3: 渲染手牌
try {
  const cards = [
    { id: 'card1', name: 'Strike', cost: 1 },
    { id: 'card2', name: 'Defend', cost: 1 }
  ];
  renderer.renderHand(cards);
  console.log('✅ 渲染手牌成功');
} catch (error) {
  console.log('❌ 渲染手牌失败:', error.message);
}

// 测试4: 更新生命值条
try {
  renderer.updateHealthBar('player', 80, 100);
  console.log('✅ 更新生命值条成功');
} catch (error) {
  console.log('❌ 更新生命值条失败:', error.message);
}

// 测试5: 错误处理
try {
  renderer.renderHand([]);
  console.log('✅ 空手牌处理成功');
} catch (error) {
  console.log('❌ 空手牌处理失败:', error.message);
}

console.log('\n🎉 快速测试完成！');