// 调试奖励生成
import { LevelManager } from './src/core/LevelManager.js';

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

const mockLevelData = {
  levels: [
    {
      id: 1,
      name: "森林入口",
      type: "normal",
      area: 1,
      difficulty: 1,
      enemies: [
        {
          enemyId: "goblin",
          hp: 30,
          attack: 10,
          armor: 5,
          skills: ["attack"],
          aiType: "aggressive"
        }
      ],
      rewards: {
        goldMin: 20,
        goldMax: 30,
        cardPool: ["basic_attack", "basic_defense", "basic_skill"],
        cardChoices: 3,
        itemPool: []
      },
      unlocked: true,
      completed: false
    },
    {
      id: 2,
      name: "森林精英",
      type: "elite",
      area: 1,
      difficulty: 2,
      enemies: [
        {
          enemyId: "elite_goblin",
          hp: 60,
          attack: 20,
          armor: 10,
          skills: ["attack", "defend"],
          aiType: "defensive"
        }
      ],
      rewards: {
        goldMin: 40,
        goldMax: 60,
        cardPool: ["rare_attack", "rare_defense", "epic_skill"],
        cardChoices: 3,
        itemPool: []
      },
      unlocked: false,
      completed: false
    },
    {
      id: 3,
      name: "森林守护者",
      type: "boss",
      area: 1,
      difficulty: 3,
      enemies: [
        {
          enemyId: "forest_boss",
          hp: 150,
          attack: 30,
          armor: 15,
          skills: ["rage", "summon"],
          aiType: "special"
        }
      ],
      rewards: {
        goldMin: 100,
        goldMax: 150,
        cardPool: ["epic_attack", "legendary_defense", "rare_skill"],
        cardChoices: 3,
        itemPool: ["healing_potion"]
      },
      unlocked: false,
      completed: false
    }
  ]
};

const levelManager = new LevelManager();
levelManager.loadLevelData(mockLevelData);

console.log('\n=== 调试奖励生成 ===');
console.log('普通战奖励 (ID: 1):', levelManager.generateRewards(1));
console.log('精英战奖励 (ID: 2):', levelManager.generateRewards(2));
console.log('BOSS战奖励 (ID: 3):', levelManager.generateRewards(3));