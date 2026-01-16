/**
 * 调试版测试 - 检查卡牌元素内部结构
 */

import GameRenderer from './src/ui/GameRenderer.js';

// 创建一个简化的 DOM 环境
if (typeof document === 'undefined') {
  const createElement = (tag, className = '') => {
    const element = {
      tagName: tag.toUpperCase(),
      className: className,
      parentElement: null,
      children: [],
      style: {},
      classList: {
        add: (cls) => { element.className = `${element.className} ${cls}`.trim(); },
        remove: (cls) => { element.className = element.className.replace(cls, '').trim(); },
        contains: (cls) => element.className.includes(cls),
        toggle: (cls) => {
          if (element.classList.contains(cls)) {
            element.classList.remove(cls);
          } else {
            element.classList.add(cls);
          }
        }
      },
      _eventListeners: {},
      attributes: {},
      setAttribute: (name, value) => { element.attributes[name] = value; element[name] = value; },
      getAttribute: (name) => element.attributes[name] || null,
      appendChild: (child) => {
        child.parentElement = element;
        element.children.push(child);
      },
      removeChild: (child) => {
        const index = element.children.indexOf(child);
        if (index > -1) element.children.splice(index, 1);
        child.parentElement = null;
      },
      addEventListener: (event, handler) => {
        if (!element._eventListeners[event]) element._eventListeners[event] = [];
        element._eventListeners[event].push(handler);
      },
      removeEventListener: (event, handler) => {
        if (element._eventListeners[event]) {
          const index = element._eventListeners[event].indexOf(handler);
          if (index > -1) {
            element._eventListeners[event].splice(index, 1);
          }
        }
      },
      querySelector: function(selector) {
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          if (this.className === className) return this;
          for (const child of this.children) {
            const result = child.querySelector(selector);
            if (result) return result;
          }
        }
        return null;
      },
      cloneNode: function(deep = false) {
        const clone = createElement(this.tagName, this.className);
        Object.keys(this.attributes).forEach(key => {
          clone.setAttribute(key, this.attributes[key]);
        });
        Object.keys(this.style).forEach(key => {
          clone.style[key] = this.style[key];
        });
        return clone;
      },
      remove: function() {
        if (this.parentElement) {
          this.parentElement.removeChild(this);
        }
      },
      innerHTML: '',
      set innerHTML(value) {
        this._innerHTML = value;
        this.children = [];
        // Simple parsing for test
        if (value.includes('game-container')) {
          const gameContainer = createElement('DIV', 'game-container');
          const handArea = createElement('DIV', 'hand-area');
          const handContainer = createElement('DIV', 'hand-container');
          handArea.appendChild(handContainer);
          gameContainer.appendChild(handArea);
          this.appendChild(gameContainer);
        }
      },
      get innerHTML() { return this._innerHTML || ''; },
      offsetWidth: 100,
      offsetHeight: 140,
      clientWidth: 100,
      clientHeight: 140,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 140, right: 100, bottom: 140 }),
      id: '',
      textContent: ''
    };
    return element;
  };

  global.document = {
    createElement: (tag) => createElement(tag),
    body: { appendChild: () => {}, removeChild: () => {} }
  };

  global.EventTarget = class {};
  global.HTMLElement = class extends EventTarget {};
  global.MouseEvent = class extends EventTarget {};
  global.CustomEvent = class extends EventTarget {};
}

// 测试卡牌创建
console.log('调试卡牌创建过程...\n');

const mockCard = {
  id: 'card-001',
  name: 'Strike',
  cost: 1,
  damage: 6,
  description: 'Deal 6 damage',
  type: 'attack'
};

try {
  const renderer = new GameRenderer();
  const container = document.createElement('div');
  renderer.init(container);

  // 模拟游戏状态
  renderer.gameState = { energy: 3 };

  // 手动创建卡牌元素进行调试
  const cardEl = renderer.createCardElement(mockCard);

  console.log('卡牌元素:');
  console.log('- 标签:', cardEl.tagName);
  console.log('- 类名:', cardEl.className);
  console.log('- ID:', cardEl.id);
  console.log('- 内部 HTML:', cardEl.innerHTML);
  console.log('- 子元素数量:', cardEl.children.length);

  // 检查各个子元素
  console.log('\n查找子元素:');
  const cardNameEl = cardEl.querySelector('.card-name');
  console.log('- card-name 元素:', !!cardNameEl, '内容:', cardNameEl?.textContent);

  const cardCostEl = cardEl.querySelector('.card-cost');
  console.log('- card-cost 元素:', !!cardCostEl, '内容:', cardCostEl?.textContent);

  const cardDescEl = cardEl.querySelector('.card-description');
  console.log('- card-description 元素:', !!cardDescEl, '内容:', cardDescEl?.textContent);

} catch (error) {
  console.error('错误:', error);
}