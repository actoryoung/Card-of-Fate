// 测试环境设置
import { LevelManager } from '../src/core/LevelManager.js';

// 模拟 localStorage
global.localStorage = {
  _store: {},
  setItem: function(key, value) {
    this._store[key] = value.toString();
  },
  getItem: function(key) {
    return this._store[key] || null;
  },
  removeItem: function(key) {
    delete this._store[key];
  },
  clear: function() {
    this._store = {};
  }
};

// 模拟 fetch
global.fetch = (url) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      chapters: [],
      levels: []
    })
  });
};

console.log('✅ 测试环境设置完成');