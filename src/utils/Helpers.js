/**
 * 工具函数集合
 */

const Utils = {
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 随机数组元素
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  // 范围随机数
  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 深拷贝
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // 格式化数字
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },

  // 本地存储
  saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
};
