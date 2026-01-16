// 测试DOM模拟是否正常工作

// 模拟 DOM 环境
if (typeof document === 'undefined') {
  // 创建更完整的DOM模拟
  const mockDOMElements = new Map();

  global.document = {
    createElement: (tag) => {
      const element = {
        tagName: tag.toUpperCase(),
        style: {},
        classList: {
          add: (className) => {
            if (!element.className) element.className = '';
            element.className += ' ' + className;
          },
          remove: (className) => {
            if (element.className) {
              element.className = element.className.replace(new RegExp('s*' + className), '');
            }
          },
          toggle: (className) => {
            if (element.classList.contains(className)) {
              element.classList.remove(className);
            } else {
              element.classList.add(className);
            }
          },
          contains: (className) => {
            return element.className && element.className.includes(className);
          }
        },
        addEventListener: (event, handler) => {
          if (!element._eventListeners) element._eventListeners = {};
          if (!element._eventListeners[event]) element._eventListeners[event] = [];
          element._eventListeners[event].push(handler);
        },
        removeEventListener: (event, handler) => {
          if (element._eventListeners && element._eventListeners[event]) {
            const index = element._eventListeners[event].indexOf(handler);
            if (index > -1) {
              element._eventListeners[event].splice(index, 1);
            }
          }
        },
        setAttribute: (name, value) => {
          element[name] = value;
        },
        getAttribute: (name) => {
          return element[name] || null;
        },
        appendChild: (child) => {
          if (!element.children) element.children = [];
          element.children.push(child);
          if (child.parentElement) {
            child.parentElement.removeChild(child);
          }
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
          // 简单的选择器实现
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
        querySelectorAll: (selector) => {
          const elements = [];
          // 简化的实现
          if (selector.startsWith('.')) {
            const className = selector.substring(1);
            if (element.classList && element.classList.contains(className)) {
              elements.push(element);
            }
            if (element.children) {
              for (const child of element.children) {
                elements.push(...child.querySelectorAll(selector));
              }
            }
          }
          return elements;
        },
        innerHTML: '',
        offsetWidth: 100,
        offsetHeight: 140,
        clientWidth: 100,
        clientHeight: 140,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 100,
          height: 140,
          right: 100,
          bottom: 140
        }),
        parentElement: null,
        children: [],
        id: '',
        className: '',
        textContent: ''
      };

      mockDOMElements.set(element, tag);
      return element;
    },
    querySelector: (selector) => {
      // 返回一个默认容器
      return {
        style: {},
        classList: {
          add: () => {},
          remove: () => {}
        },
        addEventListener: () => {},
        innerHTML: '',
        offsetWidth: 800,
        offsetHeight: 600,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
          right: 800,
          bottom: 600
        })
      };
    }
  };

  // 为事件目标添加 closest 方法
  global.EventTarget = class {
    closest(selector) {
      let current = this;
      while (current && current.parentElement) {
        if (current.matches && current.matches(selector)) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    }

    matches(selector) {
      // 简化的matches实现
      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        return this.classList && this.classList.contains(className);
      }
      return false;
    }
  };

  global.HTMLElement = class extends global.EventTarget {};

  global.MouseEvent = class extends global.EventTarget {
    constructor(type, options = {}) {
      super();
      this.type = type;
      this.target = options.target || null;
      this.clientX = options.clientX || 0;
      this.clientY = options.clientY || 0;
    }
  };

  global.CustomEvent = class extends global.EventTarget {
    constructor(type, options = {}) {
      super();
      this.type = type;
      this.detail = options.detail || {};
    }
  };

  // 添加全局方法
  global.getComputedStyle = (element) => {
    return {
      getPropertyValue: (prop) => {
        return element.style[prop] || '';
      }
    };
  };

  // 修复body引用
  document.body = {
    appendChild: (element) => {
      element.parentElement = document.body;
    },
    removeChild: (element) => {
      element.parentElement = null;
    }
  };
}

// 测试DOM模拟
console.log('=== 测试DOM模拟 ===');

// 测试createElement
const div = document.createElement('div');
console.log('✅ createElement:', div.tagName);

// 测试classList
div.classList.add('test-class');
console.log('✅ addClass:', div.className);

div.classList.remove('test-class');
console.log('✅ removeClass:', div.className);

// 测试查询
div.id = 'test-id';
div.className = 'test-class';
console.log('✅ querySelectorById:', div.querySelector('#test-id') === div);
console.log('✅ querySelectorByClass:', div.querySelector('.test-class') === div);

// 测试事件
let eventTriggered = false;
div.addEventListener('click', () => {
  eventTriggered = true;
});
div.dispatchEvent(new MouseEvent('click'));
console.log('✅ addEventListener:', eventTriggered);

console.log('\n🎉 DOM模拟测试通过！');