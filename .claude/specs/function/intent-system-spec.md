# Function Spec: IntentSystem 敌人意图系统

> **版本**: 1.0
> **创建日期**: 2026-02-09
> **作者**: Spec Writer Agent
> **状态**: Draft

## Description

IntentSystem 是游戏中的敌人意图显示系统，负责：
- 生成和存储敌人的下回合行动意图
- 在UI上显示敌人的意图图标和数值
- 确保意图与实际行为的一致性
- 支持多阶段Boss的特殊意图模式
- 处理条件性意图（如低血量时的特殊行为）

## Class Structure

```javascript
class IntentSystem {
    // 私有属性
    #currentIntents: Map<string, Intent>    // 当前所有敌人的意图
    #intentHistory: Map<string, Intent[]>   // 意图历史记录
    #iconRegistry: Map<string, string>      // 意图类型到图标的映射

    // 公共方法
    generateIntent(enemy: Enemy, context: GameContext): Intent
    getIntent(enemyId: string): Intent | null
    setIntent(enemyId: string, intent: Intent): void
    clearIntent(enemyId: string): void
    clearAllIntents(): void
    validateIntentExecution(enemy: Enemy, action: EnemyAction): boolean
    getIntentIcon(intentType: string): string
    getIntentDisplayText(intent: Intent): string
    registerIntentIcon(intentType: string, icon: string): void
}

interface Intent {
    type: string              // 意图类型
    value: number | object    // 意图数值/参数
    displayText?: string      // 自定义显示文本（可选）
    priority?: number         // 显示优先级（多意图时）
    conditions?: Condition[]  // 触发条件
}

interface Enemy {
    id: string
    name: string
    hp: number
    maxHp: number
    attacks: EnemyAttack[]    // 可用的攻击模式列表
    currentPhase?: number     // 当前阶段（Boss用）
}

interface EnemyAttack {
    type: string              // 行为类型
    value: number | object    // 行为数值
    intent?: string           // 覆盖的意图文本
    condition?: function      // 触发条件
    weight?: number           // 选择权重
    phase?: number            // 所属阶段（Boss用）
}

interface GameContext {
    turn: number
    playerHP: number
    playerBlock: number
    // 其他上下文信息
}
```

## Inputs

### generateIntent()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| enemy | Enemy | Yes | Must have attacks array | 要生成意图的敌人 |
| context | GameContext | Yes | - | 当前游戏上下文 |

### getIntent()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| enemyId | string | Yes | - | 敌人ID |

### setIntent()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| enemyId | string | Yes | - | 敌人ID |
| intent | Intent | Yes | Valid intent object | 要设置的意图 |

### clearIntent()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| enemyId | string | Yes | - | 敌人ID |

### clearAllIntents()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| - | - | - | - | 无参数 |

### validateIntentExecution()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| enemy | Enemy | Yes | - | 执行行动的敌人 |
| action | EnemyAction | Yes | - | 实际执行的行动 |

### getIntentIcon()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| intentType | string | Yes | - | 意图类型 |

### getIntentDisplayText()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| intent | Intent | Yes | - | 意图对象 |

### registerIntentIcon()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| intentType | string | Yes | - | 意图类型 |
| icon | string | Yes | Valid emoji/icon | 图标 |

## Outputs

### generateIntent()

| Field | Type | Description |
|-------|------|-------------|
| intent | Intent | 生成的意图对象 |

### getIntent()

| Field | Type | Description |
|-------|------|-------------|
| intent | Intent \| null | 敌人的当前意图，不存在返回null |

### setIntent()

| Field | Type | Description |
|-------|------|-------------|
| - | void | 无返回值 |

### clearIntent()

| Field | Type | Description |
|-------|------|-------------|
| - | void | 无返回值 |

### clearAllIntents()

| Field | Type | Description |
|-------|------|-------------|
| - | void | 无返回值 |

### validateIntentExecution()

| Field | Type | Description |
|-------|------|-------------|
| valid | boolean | true=意图与行为一致, false=不一致 |

### getIntentIcon()

| Field | Type | Description |
|-------|------|-------------|
| icon | string | 意图对应的图标 |

### getIntentDisplayText()

| Field | Type | Description |
|-------|------|-------------|
| text | string | 意图的显示文本 |

## Business Rules

### BR-001: 意图类型定义

| 意图类型 | 图标 | 描述 | 颜色 |
|----------|------|------|------|
| attack | ⚔️ | 攻击意图，显示伤害值 | 红色 |
| defend | 🛡️ | 防御意图，显示格挡值 | 蓝色 |
| buff | 💪 | 自身增益，显示效果类型 | 绿色 |
| debuff | 💀 | 对玩家施加负面状态 | 紫色 |
| heal | 💚 | 治疗自身，显示回复量 | 绿色 |
| special | ⭐ | 特殊行动，显示描述 | 金色 |
| unknown | ❓ | 未知意图（多阶段Boss） | 灰色 |

### BR-002: 意图生成规则

```javascript
// 基础意图生成算法
function generateIntent(enemy, context) {
    // 1. 检查Boss特殊阶段
    if (enemy.isBoss && enemy.currentPhase !== undefined) {
        return generateBossIntent(enemy, context);
    }

    // 2. 检查条件性攻击（如低血量）
    const conditionalAttacks = enemy.attacks.filter(a =>
        a.condition && a.condition(enemy, context)
    );
    if (conditionalAttacks.length > 0) {
        return selectByWeight(conditionalAttacks);
    }

    // 3. 根据权重随机选择攻击模式
    return selectByWeight(enemy.attacks);
}
```

### BR-003: 多阶段Boss意图规则

- Boss在不同阶段有不同的攻击模式
- 阶段切换时意图可能显示为"unknown"（1回合）
- 阶段切换条件：血量百分比、特定回合数

```javascript
// 示例：森林之王阶段定义
const BOSS_PHASES = {
    1: { threshold: 1.0, attacks: ['attack', 'defend', 'attack'] },
    2: { threshold: 0.6, attacks: ['buff', 'attack_all', 'heal'] },
    3: { threshold: 0.3, attacks: ['special', 'attack', 'special'] }
};
```

### BR-004: 意图显示规则

- 意图在敌人头顶显示
- 图标大小：32x32px
- 显示格式：`图标 + 数值/文本`
- 多意图时按优先级排列
- 意图在玩家回合开始时更新
- 意图在敌人行动前持续显示

### BR-005: 意图与行为一致性验证

```javascript
// 验证规则
function validateIntentExecution(enemy, action) {
    const intent = getIntent(enemy.id);
    if (!intent) return false;

    // 类型匹配
    if (intent.type !== action.type) return false;

    // 数值匹配（允许小范围误差）
    if (typeof intent.value === 'number' && typeof action.value === 'number') {
        return Math.abs(intent.value - action.value) <= 1;
    }

    return true;
}
```

### BR-006: 特殊意图规则

| 场景 | 意图行为 |
|------|----------|
| 第一次见到新敌人 | 意图正常显示 |
| 多阶段Boss切换阶段 | 显示"unknown" 1回合 |
| 敌人被迷惑/控制 | 意图显示为混乱图标 |
| 连续行动敌人 | 显示多个意图 |

## Edge Cases

| Case | Input | Expected Output | Notes |
|------|-------|-----------------|-------|
| 敌人无攻击模式 | attacks: [] | { type: 'unknown' } | 默认未知意图 |
| 敌人所有攻击都有条件 | 所有都有condition，都不满足 | 选择第一个攻击 | 保底选择 |
| 意图标不存在 | type: 'invalid_type' | 返回默认图标'❓' | 使用回退图标 |
| 多阶段Boss切换时 | hp降至phase阈值 | { type: 'unknown' } | 1回合未知 |
| 敌人中途被击败 | 获取已死亡敌人意图 | null | 清空意图 |
| 意图数值为0 | value: 0 | 显示图标但无数值 | 仅显示图标 |

## Error Handling

| Error Code | Error Message | Condition | Resolution |
|------------|---------------|-----------|------------|
| ERR_INTENT_INVALID_ENEMY | "无效的敌人对象" | enemy为null或无效 | 检查敌人数据 |
| ERR_INTENT_NO_ATTACKS | "敌人无可用攻击模式" | attacks数组为空 | 返回unknown意图 |
| ERR_INTENT_TYPE_MISMATCH | "意图类型与执行类型不匹配" | 验证失败 | 记录警告，继续游戏 |
| ERR_INTENT_ICON_NOT_FOUND | "意图图标未找到: {type}" | 图标未注册 | 使用默认图标 |

### Exception Behavior

```javascript
// 意图生成错误处理示例
generateIntent(enemy, context) {
    if (!enemy || !Array.isArray(enemy.attacks)) {
        console.error('[IntentSystem] 无效的敌人对象');
        return { type: 'unknown', value: 0 };
    }

    if (enemy.attacks.length === 0) {
        console.warn(`[IntentSystem] 敌人 ${enemy.id} 无可用攻击模式`);
        return { type: 'unknown', value: 0 };
    }

    // 正常意图生成逻辑...
}
```

## Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| enemies.json | Internal | 敌人攻击模式数据 |
| GameState | Internal | 获取游戏上下文 |
| GameRenderer | Internal | 渲染意图UI |
| CombatSystem | Internal | 验证意图执行 |

## Performance Requirements

| Metric | Requirement |
|--------|-------------|
| 意图生成时间 | < 5ms per enemy |
| 意图更新频率 | 每回合1次 |
| 意图验证时间 | < 2ms |
| 内存占用 | < 1MB |

## Test Cases

### Unit Tests

```javascript
// TC-INT-001: 生成基础攻击意图
test('generateIntent should create attack intent', () => {
    const enemy = {
        id: 'goblin_01',
        attacks: [{ type: 'attack', value: 6, weight: 100 }]
    };
    const intent = intentSystem.generateIntent(enemy, context);
    expect(intent.type).toBe('attack');
    expect(intent.value).toBe(6);
});

// TC-INT-002: 生成防御意图
test('generateIntent should create defend intent', () => {
    const enemy = {
        id: 'goblin_02',
        attacks: [{ type: 'defend', value: 8, weight: 100 }]
    };
    const intent = intentSystem.generateIntent(enemy, context);
    expect(intent.type).toBe('defend');
    expect(intent.value).toBe(8);
});

// TC-INT-003: 根据权重选择攻击
test('generateIntent should select attack by weight', () => {
    const enemy = {
        id: 'goblin_03',
        attacks: [
            { type: 'attack', value: 6, weight: 20 },
            { type: 'attack', value: 10, weight: 80 }
        ]
    };
    // 多次测试验证权重分布
    const results = {};
    for (let i = 0; i < 100; i++) {
        const intent = intentSystem.generateIntent(enemy, context);
        results[intent.value] = (results[intent.value] || 0) + 1;
    }
    expect(results[10]).toBeGreaterThan(results[6]);
});

// TC-INT-004: 条件性意图触发
test('generateIntent should use conditional attack at low HP', () => {
    const enemy = {
        id: 'goblin_04',
        hp: 5,
        maxHp: 30,
        attacks: [
            { type: 'attack', value: 6, weight: 100 },
            { type: 'attack', value: 15, weight: 100, condition: (e) => e.hp < e.maxHp * 0.3 }
        ]
    };
    const intent = intentSystem.generateIntent(enemy, context);
    expect(intent.value).toBe(15);
});

// TC-INT-005: Boss阶段切换显示未知意图
test('generateIntent should show unknown on boss phase change', () => {
    const boss = {
        id: 'forest_king',
        isBoss: true,
        hp: 60,
        maxHp: 100,
        currentPhase: 2,
        phaseChanged: true
    };
    const intent = intentSystem.generateIntent(boss, context);
    expect(intent.type).toBe('unknown');
});

// TC-INT-006: 获取已设置的意图
test('getIntent should return current intent', () => {
    const intent = { type: 'attack', value: 10 };
    intentSystem.setIntent('enemy_01', intent);
    const retrieved = intentSystem.getIntent('enemy_01');
    expect(retrieved).toEqual(intent);
});

// TC-INT-007: 获取不存在的意图返回null
test('getIntent should return null for non-existent enemy', () => {
    const intent = intentSystem.getIntent('invalid_enemy');
    expect(intent).toBeNull();
});

// TC-INT-008: 验证意图与行为一致
test('validateIntentExecution should return true for matching intent', () => {
    const enemy = { id: 'enemy_01' };
    const intent = { type: 'attack', value: 10 };
    intentSystem.setIntent('enemy_01', intent);

    const action = { type: 'attack', value: 10 };
    expect(intentSystem.validateIntentExecution(enemy, action)).toBe(true);
});

// TC-INT-009: 验证意图与行为不一致
test('validateIntentExecution should return false for mismatched intent', () => {
    const enemy = { id: 'enemy_01' };
    const intent = { type: 'attack', value: 10 };
    intentSystem.setIntent('enemy_01', intent);

    const action = { type: 'defend', value: 8 };
    expect(intentSystem.validateIntentExecution(enemy, action)).toBe(false);
});

// TC-INT-010: 清除单个意图
test('clearIntent should remove specific intent', () => {
    intentSystem.setIntent('enemy_01', { type: 'attack', value: 10 });
    intentSystem.clearIntent('enemy_01');
    expect(intentSystem.getIntent('enemy_01')).toBeNull();
});

// TC-INT-011: 清除所有意图
test('clearAllIntents should remove all intents', () => {
    intentSystem.setIntent('enemy_01', { type: 'attack', value: 10 });
    intentSystem.setIntent('enemy_02', { type: 'defend', value: 8 });
    intentSystem.clearAllIntents();
    expect(intentSystem.getIntent('enemy_01')).toBeNull();
    expect(intentSystem.getIntent('enemy_02')).toBeNull();
});

// TC-INT-012: 获取意图图标
test('getIntentIcon should return correct icon', () => {
    expect(intentSystem.getIntentIcon('attack')).toBe('⚔️');
    expect(intentSystem.getIntentIcon('defend')).toBe('🛡️');
});

// TC-INT-013: 获取未知类型图标返回默认
test('getIntentIcon should return default icon for unknown type', () => {
    const icon = intentSystem.getIntentIcon('invalid_type');
    expect(icon).toBe('❓');
});

// TC-INT-014: 获取意图显示文本
test('getIntentDisplayText should format correctly', () => {
    const attackIntent = { type: 'attack', value: 10 };
    expect(intentSystem.getIntentDisplayText(attackIntent)).toBe('⚔️ 10');

    const defendIntent = { type: 'defend', value: 8 };
    expect(intentSystem.getIntentDisplayText(defendIntent)).toBe('🛡️ 8');
});

// TC-INT-015: 自定义显示文本
test('getIntentDisplayText should use custom displayText', () => {
    const customIntent = {
        type: 'special',
        value: 0,
        displayText: '强力攻击'
    };
    expect(intentSystem.getIntentDisplayText(customIntent)).toBe('⭐ 强力攻击');
});
```

## Data Structures

### enemies.json 扩展格式

```json
{
  "enemies": [
    {
      "id": "goblin_minion",
      "name": "哥布林小兵",
      "hp": 20,
      "attacks": [
        {
          "type": "attack",
          "value": 6,
          "intent": "准备攻击",
          "weight": 100
        },
        {
          "type": "attack",
          "value": 8,
          "intent": "重击",
          "weight": 50
        }
      ],
      "icon": "👺"
    },
    {
      "id": "dark_mage",
      "name": "黑暗法师",
      "hp": 40,
      "attacks": [
        {
          "type": "attack",
          "value": 6,
          "intent": "暗影箭",
          "weight": 60
        },
        {
          "type": "debuff",
          "value": { "effect": "weak", "duration": 2 },
          "intent": "虚弱诅咒",
          "weight": 40
        },
        {
          "type": "attack_multi",
          "value": 4,
          "count": 3,
          "intent": "连发",
          "weight": 30
        }
      ],
      "icon": "🧙"
    },
    {
      "id": "boss_forest_king",
      "name": "森林之王",
      "hp": 100,
      "isBoss": true,
      "phases": [
        {
          "stage": 1,
          "hpThreshold": 1.0,
          "attacks": [
            { "type": "attack", "value": 12, "weight": 40 },
            { "type": "defend", "value": 15, "weight": 30 },
            { "type": "attack_all", "value": 8, "weight": 30 }
          ]
        },
        {
          "stage": 2,
          "hpThreshold": 0.6,
          "showUnknown": true,
          "attacks": [
            { "type": "buff", "value": { "effect": "strength", "amount": 2 }, "weight": 30 },
            { "type": "attack_all", "value": 10, "weight": 50 },
            { "type": "heal", "value": 15, "weight": 20 }
          ]
        },
        {
          "stage": 3,
          "hpThreshold": 0.3,
          "showUnknown": true,
          "attacks": [
            { "type": "special", "value": 0, "intent": "自然之怒", "weight": 40 },
            { "type": "attack", "value": 18, "weight": 60 }
          ]
        }
      ],
      "icon": "👑"
    }
  ]
}
```

## Implementation Notes

### 1. 意图图标注册

```javascript
// 默认意图图标映射
const DEFAULT_INTENT_ICONS = {
    attack: '⚔️',
    defend: '🛡️',
    buff: '💪',
    debuff: '💀',
    heal: '💚',
    special: '⭐',
    unknown: '❓',
    attack_multi: '⚔️⚔️',
    attack_all: '💥',
    defend_break: '💔'
};

class IntentSystem {
    constructor() {
        this.#iconRegistry = new Map(Object.entries(DEFAULT_INTENT_ICONS));
    }

    registerIntentIcon(intentType, icon) {
        this.#iconRegistry.set(intentType, icon);
    }
}
```

### 2. 意图显示文本格式化

```javascript
getIntentDisplayText(intent) {
    const icon = this.getIntentIcon(intent.type);

    // 自定义显示文本优先
    if (intent.displayText) {
        return `${icon} ${intent.displayText}`;
    }

    // 根据类型格式化
    switch (intent.type) {
        case 'attack':
            return `${icon} ${intent.value}`;
        case 'attack_multi':
            return `${icon} ${intent.value}×${intent.count}`;
        case 'defend':
            return `${icon} ${intent.value}`;
        case 'heal':
            return `${icon} +${intent.value}`;
        case 'buff':
        case 'debuff':
            const effectName = this.getEffectName(intent.value.effect);
            return `${icon} ${effectName}`;
        default:
            return `${icon}`;
    }
}

getEffectName(effect) {
    const NAMES = {
        weak: '虚弱',
        vulnerable: '易伤',
        strength: '力量',
        poison: '中毒'
    };
    return NAMES[effect] || effect;
}
```

### 3. 多阶段Boss意图生成

```javascript
generateBossIntent(enemy, context) {
    const currentPhase = this.getCurrentPhase(enemy);
    const phaseData = enemy.phases[currentPhase - 1];

    // 检查是否刚切换阶段
    if (phaseData.showUnknown && enemy.phaseChanged) {
        enemy.phaseChanged = false;
        return { type: 'unknown', value: 0 };
    }

    // 从当前阶段的攻击中选择
    const availableAttacks = phaseData.attacks;
    return this.selectByWeight(availableAttacks);
}

getCurrentPhase(enemy) {
    const hpPercent = enemy.hp / enemy.maxHp;
    for (let i = enemy.phases.length - 1; i >= 0; i--) {
        if (hpPercent <= enemy.phases[i].hpThreshold) {
            return enemy.phases[i].stage;
        }
    }
    return 1;
}
```

### 4. 权重随机选择

```javascript
selectByWeight(attacks) {
    const totalWeight = attacks.reduce((sum, a) => sum + (a.weight || 100), 0);
    let random = Math.random() * totalWeight;

    for (const attack of attacks) {
        random -= (attack.weight || 100);
        if (random <= 0) {
            return {
                type: attack.type,
                value: attack.value,
                count: attack.count,
                displayText: attack.intent
            };
        }
    }

    // 保底返回第一个
    return {
        type: attacks[0].type,
        value: attacks[0].value
    };
}
```

## UI Integration

### 意图显示位置

```
┌─────────────────────────────────┐
│                                 │
│         [敌人精灵图]             │
│                                 │
│         ⚔️ 12                   │  ← 意图显示区
│        (准备攻击)                │
│                                 │
│   HP: ████████░░ 80/100         │
│                                 │
└─────────────────────────────────┘
```

### 意图样式配置

```javascript
const INTENT_STYLES = {
    attack: {
        color: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
        fontSize: '16px'
    },
    defend: {
        color: '#4488ff',
        backgroundColor: 'rgba(68, 136, 255, 0.2)',
        fontSize: '16px'
    },
    buff: {
        color: '#44ff44',
        backgroundColor: 'rgba(68, 255, 68, 0.2)',
        fontSize: '14px'
    },
    debuff: {
        color: '#aa44ff',
        backgroundColor: 'rgba(170, 68, 255, 0.2)',
        fontSize: '14px'
    }
};
```

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-09 | 初始版本 | Spec Writer Agent |
