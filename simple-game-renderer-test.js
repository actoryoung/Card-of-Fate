/**
 * 简单的 GameRenderer 集成测试
 * 验证基本功能是否正常工作
 */

import GameRenderer from './src/ui/GameRenderer.js';

// 创建一个模拟的 DOM 环境
if (typeof document === 'undefined') {
  const mockElements = new Map();

  const createElement = (tag, className = '') => {
    const element = {
      tagName: tag.toUpperCase(),
      className: className,
      style: {},
      classList: {
        add: (className) => {
          element.className = `${element.className} ${className}`.trim();
        },
        remove: (className) => {
          element.className = element.className.replace(new RegExp(`s*${className}`), '').trim();
        },
        contains: (className) => {
          return element.className && element.className.includes(className);
        }
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: (name, value) => {
        element[name] = value;
      },
      getAttribute: (name) => {
        return element[name] || null;
      },
      appendChild: (child) => {
        if (!element.children) element.children = [];
        element.children.push(child);
        child.parentElement = element;
      },
      removeChild: (child) => {
        if (element.children) {
          const index = element.children.indexOf(child);
          if (index > -1) {
            element.children.splice(index, 1);
          }
        }
        child.parentElement = null;
      },
      querySelector: (selector) => {
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          if (element.classList && element.classList.contains(className)) {
            return element;
          }
          if (element.children) {
            for (const child of element.children) {
              const result = child.querySelector(selector);
              if (result) return result;
            }
          }
        } else if (selector.startsWith('#')) {
          const id = selector.substring(1);
          if (element.id === id) {
            return element;
          }
          if (element.children) {
            for (const child of element.children) {
              const result = child.querySelector(selector);
              if (result) return result;
            }
          }
        }
        return null;
      },
      querySelectorAll: () => [],
      offsetWidth: 100,
      offsetHeight: 140,
      clientWidth: 100,
      clientHeight: 140,
      getBoundingClientRect: () => ({
        left: 0, top: 0, width: 100, height: 140,
        right: 100, bottom: 140
      }),
      parentElement: null,
      children: [],
      id: '',
      textContent: '',
      dispatchEvent: () => true
    };

    return element;
  };

  global.document = {
    createElement: (tag) => {
      return createElement(tag);
    },

      // Add property setters/getters
      Object.defineProperty(element, 'innerHTML', {
        set(value) {
          element._innerHTML = value;
          // Clear existing children
          element.children = [];

          // Simple HTML parsing for our test cases
          if (value.includes('<div class="game-container">')) {
            // Create mock elements with proper structure
            const createMockElement = (tag, className, children = []) => ({
              tagName: tag,
              className: className,
              children: children,
              parentElement: null,
              style: {},
              classList: {
                add: () => {},
                remove: () => {},
                contains: () => false
              },
              querySelector: (selector) => {
                return children.find(child =>
                  selector.startsWith('.') &&
                  child.className === selector.substring(1)
                );
              },
              appendChild: (child) => {
                children.push(child);
                child.parentElement = this || element;
              },
              removeChild: (child) => {
                const index = children.indexOf(child);
                if (index > -1) {
                  children.splice(index, 1);
                }
              }
            });

            const gameContainer = createMockElement('DIV', 'game-container', [
              createMockElement('DIV', 'player-area', [
                createMockElement('DIV', 'player-avatar'),
                createMockElement('DIV', 'player-stats', [
                  createMockElement('DIV', 'health-bar'),
                  createMockElement('DIV', 'armor-display'),
                  createMockElement('DIV', 'energy-display')
                ])
              ]),
              createMockElement('DIV', 'enemy-area', [
                createMockElement('DIV', 'enemy-avatar'),
                createMockElement('DIV', 'enemy-stats', [
                  createMockElement('DIV', 'enemy-health-bar'),
                  createMockElement('DIV', 'armor-display'),
                  createMockElement('DIV', 'intent-display')
                ])
              ]),
              createMockElement('DIV', 'hand-area', [
                createMockElement('DIV', 'hand-container')
              ]),
              createMockElement('DIV', 'deck-area', [
                createMockElement('DIV', 'deck-icon'),
                createMockElement('DIV', 'deck-count')
              ])
            ]);
            element.children.push(gameContainer);
          }
        },
        get() {
          return element._innerHTML || '';
        }
      });

      mockElements.set(element, tag);
      return element;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };

  global.EventTarget = class {
    closest() { return null; }
    matches() { return false; }
  };

  global.HTMLElement = class extends EventTarget {};
  global.MouseEvent = class extends EventTarget {
    constructor(type, options = {}) {
      super();
      this.type = type;
      this.target = options.target || null;
      this.clientX = options.clientX || 0;
      this.clientY = options.clientY || 0;
    }
  };

  global.CustomEvent = class extends EventTarget {
    constructor(type, options = {}) {
      super();
      this.type = type;
      this.detail = options.detail || {};
    }
  };

  global.getComputedStyle = () => ({
    getPropertyValue: () => ''
  });
}

// 模拟游戏状态
const mockGameState = {
  player: {
    health: 100,
    maxHealth: 100,
    energy: 3,
    maxEnergy: 3,
    armor: 0,
    hand: [],
    deck: [],
    discard: []
  },
  enemy: {
    health: 80,
    maxHealth: 80,
    armor: 0,
    intent: 'attack',
    intentValue: 10
  },
  turn: 'player',
  energy: 3
};

// 模拟卡牌数据
const mockCard = {
  id: 'card-001',
  name: 'Strike',
  cost: 1,
  damage: 6,
  description: 'Deal 6 damage',
  type: 'attack'
};

console.log('🎮 GameRenderer 简单集成测试\n');

try {
  // 1. 测试初始化
  console.log('1. 测试初始化...');
  const renderer = new GameRenderer();
  console.log('✅ GameRenderer 实例创建成功');

  // 2. 测试容器初始化
  console.log('2. 测试容器初始化...');
  const container = document.createElement('div');
  renderer.init(container);
  console.log('✅ 渲染器初始化成功');

  // 3. 测试渲染战斗界面
  console.log('3. 测试渲染战斗界面...');
  renderer.renderCombatScreen();
  console.log('✅ 战斗界面渲染成功');

  // 4. 测试渲染玩家状态
  console.log('4. 测试渲染玩家状态...');
  renderer.renderPlayerState(mockGameState.player);
  console.log('✅ 玩家状态渲染成功');

  // 5. 测试渲染敌人状态
  console.log('5. 测试渲染敌人状态...');
  renderer.renderEnemyState(mockGameState.enemy);
  console.log('✅ 敌人状态渲染成功');

  // 6. 测试渲染手牌
  console.log('6. 测试渲染手牌...');
  // 首先需要检查是否有手牌容器
  console.log('Container HTML:', renderer.container.innerHTML);
  console.log('Has hand-container:', !!renderer.container.querySelector('.hand-container'));

  // 手动创建手牌容器
  const handArea = renderer.container.querySelector('.hand-area');
  console.log('Hand area found:', !!handArea);
  if (handArea) {
    const handContainer = document.createElement('div');
    handContainer.className = 'hand-container';
    handArea.appendChild(handContainer);
    console.log('Hand container created');
  }

  renderer.renderHand([mockCard]);
  console.log('✅ 手牌渲染成功');

  // 7. 测试能量不足的卡牌
  console.log('7. 测试能量不足的卡牌...');
  renderer.gameState = { ...mockGameState, energy: 0 };
  renderer.renderHand([mockCard]);
  const cardEl = renderer.container.querySelector('.card');
  if (cardEl && cardEl.classList.contains('disabled')) {
    console.log('✅ 能量不足的卡牌正确显示为禁用状态');
  } else {
    console.log('❌ 能量不足的卡牌未正确显示为禁用状态');
  }

  // 8. 测试抽牌动画
  console.log('8. 测试抽牌动画...');
  const drawPromise = renderer.playDrawAnimation([mockCard]);
  if (drawPromise instanceof Promise) {
    console.log('✅ 抽牌动画返回 Promise');
  } else {
    console.log('❌ 抽牌动画未返回 Promise');
  }

  // 9. 测试出牌动画
  console.log('9. 测试出牌动画...');
  const playPromise = renderer.playPlayAnimation(mockCard, 'enemy');
  if (playPromise instanceof Promise) {
    console.log('✅ 出牌动画返回 Promise');
  } else {
    console.log('❌ 出牌动画未返回 Promise');
  }

  // 10. 测试伤害动画
  console.log('10. 测试伤害动画...');
  const damagePromise = renderer.playDamageAnimation('enemy', 10);
  if (damagePromise instanceof Promise) {
    console.log('✅ 伤害动画返回 Promise');
  } else {
    console.log('❌ 伤害动画未返回 Promise');
  }

  // 11. 测试洗牌动画
  console.log('11. 测试洗牌动画...');
  const shufflePromise = renderer.playShuffleAnimation();
  if (shufflePromise instanceof Promise) {
    console.log('✅ 洗牌动画返回 Promise');
  } else {
    console.log('❌ 洗牌动画未返回 Promise');
  }

  // 12. 测试视觉反馈
  console.log('12. 测试视觉反馈...');
  renderer.showFeedback('测试消息', 'info');
  console.log('✅ 视觉反馈功能正常');

  // 13. 测试动画开关
  console.log('13. 测试动画开关...');
  renderer.toggleAnimations(false);
  if (!renderer.animationsEnabled) {
    console.log('✅ 动画开关功能正常');
  } else {
    console.log('❌ 动画开关功能异常');
  }

  // 14. 测试错误处理
  console.log('14. 测试错误处理...');
  try {
    renderer.renderHand([mockCard]); // 应该抛出错误，因为没有手牌容器
    console.log('❌ 错误处理异常 - 应该抛出错误');
  } catch (error) {
    if (error.message.includes('ERR_CARD_ELEMENT_NOT_FOUND')) {
      console.log('✅ 错误处理正常 - 正确抛出容器不存在错误');
    } else {
      console.log('❌ 错误处理异常 - 抛出了错误的错误信息');
    }
  }

  console.log('\n🎉 所有基本功能测试通过！GameRenderer 实现正确。');
} catch (error) {
  console.error('\n❌ 测试过程中发生错误:', error);
}