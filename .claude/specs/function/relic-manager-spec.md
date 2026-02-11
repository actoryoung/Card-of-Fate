# Function Spec: RelicManager 遗物管理系统

> **版本**: 1.0
> **创建日期**: 2026-02-09
> **作者**: Spec Writer Agent
> **状态**: Draft

## Description

RelicManager 是游戏中的遗物管理核心类，负责：
- 加载和缓存所有遗物数据
- 管理玩家拥有的遗物集合
- 执行遗物效果触发（战斗开始、回合结束、卡牌使用等）
- 实现流派引导算法（根据卡组构成调整遗物掉落权重）
- 处理遗物的授予、移除和查询

## Class Structure

```javascript
class RelicManager {
    // 私有属性
    #allRelics: Map<string, Relic>           // 所有遗物数据缓存
    #ownedRelics: Set<string>                // 玩家拥有的遗物ID集合
    #archetypeWeights: Map<string, number>   // 流派权重缓存

    // 公共方法
    loadRelics(): Promise<void>
    grantRelic(relicId: string): Promise<boolean>
    removeRelic(relicId: string): boolean
    hasRelic(relicId: string): boolean
    getOwnedRelics(): Relic[]
    getRelicById(relicId: string): Relic | null
    getRelicsByPool(pool: string): Relic[]
    getRelicsByRarity(rarity: string): Relic[]
    triggerRelicEffect(trigger: string, context: object): void
    adjustPoolByArchetype(deck: Card[]): Map<string, number>
    generateRelicReward(poolType: string, count: number, deck?: Card[]): Relic[]
}

interface Relic {
    id: string              // 唯一标识符，格式: "relic_XXX"
    name: string            // 遗物名称
    description: string     // 效果描述
    rarity: string          // 稀有度: "common" | "rare" | "legendary"
    pool: string            // 遗物池: "all" | "character" | "boss" | "shop"
    icon: string            // 图标（emoji）
    effect: RelicEffect     // 遗物效果定义
}

interface RelicEffect {
    trigger: string         // 触发时机
    type: string            // 效果类型
    value: number | object  // 效果数值
    condition?: function    // 触发条件（可选）
}
```

## Inputs

### loadRelics()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| - | - | - | - | 无参数 |

### grantRelic()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| relicId | string | Yes | Format: "relic_XXX", must exist | 要授予的遗物ID |

### removeRelic()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| relicId | string | Yes | Must be owned | 要移除的遗物ID |

### hasRelic()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| relicId | string | Yes | - | 要检查的遗物ID |

### getOwnedRelics()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| - | - | - | - | 无参数 |

### getRelicById()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| relicId | string | Yes | - | 要查询的遗物ID |

### getRelicsByPool()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| pool | string | Yes | Values: "all" | "character" | "boss" | "shop" | 遗物池类型 |

### getRelicsByRarity()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| rarity | string | Yes | Values: "common" | "rare" | "legendary" | 稀有度类型 |

### triggerRelicEffect()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| trigger | string | Yes | Values: see Triggers section | 触发时机 |
| context | object | No | - | 上下文对象（包含玩家、敌人、卡牌等） |

### adjustPoolByArchetype()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| deck | Card[] | Yes | Min: 0 cards | 当前玩家卡组 |

### generateRelicReward()

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| poolType | string | Yes | Values: "all" | "character" | "boss" | 奖励池类型 |
| count | number | Yes | Range: 1-3 | 要生成的遗物数量 |
| deck | Card[] | No | - | 当前卡组（用于流派引导） |

## Outputs

### loadRelics()

| Field | Type | Description |
|-------|------|-------------|
| - | Promise\<void\> | 加载完成 |

### grantRelic()

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | true=成功授予, false=已拥有或不存在 |

### removeRelic()

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | true=成功移除, false=未拥有 |

### hasRelic()

| Field | Type | Description |
|-------|------|-------------|
| owned | boolean | true=拥有此遗物 |

### getOwnedRelics()

| Field | Type | Description |
|-------|------|-------------|
| relics | Relic[] | 玩家拥有的所有遗物数组 |

### getRelicById()

| Field | Type | Description |
|-------|------|-------------|
| relic | Relic \| null | 遗物对象，不存在返回null |

### getRelicsByPool()

| Field | Type | Description |
|-------|------|-------------|
| relics | Relic[] | 指定池中的所有遗物 |

### getRelicsByRarity()

| Field | Type | Description |
|-------|------|-------------|
| relics | Relic[] | 指定稀有度的所有遗物 |

### triggerRelicEffect()

| Field | Type | Description |
|-------|------|-------------|
| - | void | 直接执行效果，修改游戏状态 |

### adjustPoolByArchetype()

| Field | Type | Description |
|-------|------|-------------|
| weights | Map\<string, number\> | 遗物ID到权重的映射 |

### generateRelicReward()

| Field | Type | Description |
|-------|------|-------------|
| rewards | Relic[] | 可供选择的遗物数组（1-3个） |

## Business Rules

### BR-001: 遗物唯一性规则
- 每个遗物ID在同一局游戏中只能获得一次
- 尝试授予已拥有的遗物返回 false
- 角色专属遗物只能在对应角色时获得

### BR-002: 遗物池分配规则
| 池类型 | 说明 | 包含的遗物 |
|--------|------|-------------|
| all | 通用池 | 所有非专属、非Boss遗物 |
| character | 角色专属 | 特定角色的专属遗物 |
| boss | Boss掉落 | 稀有和传说遗物 |
| shop | 商店 | 通用和稀有遗物 |

### BR-003: 遗物稀有度规则
- 普通遗物 (common): 基础效果，权重100
- 稀有遗物 (rare): 强化效果，权重40
- 传说遗物 (legendary): 强力效果，权重10

### BR-004: 流派引导规则
流派引导算法根据卡组中卡牌类型的占比调整遗物权重：

```javascript
// 流派定义
const ARCHETYPES = {
    ATTACK: { type: 'attack', threshold: 0.4 },   // 攻击牌占比>40%
    DEFENSE: { type: 'defense', threshold: 0.3 }, // 防御牌占比>30%
    SKILL: { type: 'skill', threshold: 0.3 },     // 技能牌占比>30%
    POISON: { keywords: ['poison', '中毒'], threshold: 2 },  // 中毒卡>=2张
    DRAW: { keywords: ['draw', '抽牌'], threshold: 2 },      // 抽牌卡>=2张
    ENERGY: { keywords: ['energy', '能量'], threshold: 2 },  // 能量卡>=2张
};

// 流派与遗物关联
const ARCHETYPE_RELICS = {
    ATTACK: ['relic_berserker_globe', 'relic_paper_kraken'],
    DEFENSE: ['relic_anchor', 'relic_calipers'],
    SKILL: ['relic_bag_of_preparation', 'relic_odd_mushroom'],
    POISON: ['relic_busted_crown', 'relic_toxic_eagle'],
    DRAW: ['relic_bag_of_preparation', 'relic_snecko_skull'],
    ENERGY: ['relic_energy_egg', 'relic_frozen_egg'],
};
```

### BR-005: 遗物效果触发规则

| 触发时机 | 描述 | 示例遗物 |
|----------|------|----------|
| combat_start | 每次战斗开始时 | 战术手册（每场战斗获得1张随机攻击牌） |
| turn_start | 每回合开始时 | 符文金字塔（每回合获得1点能量） |
| turn_end | 每回合结束时 | 橡皮擦（回合结束时失去1点力量） |
| card_played | 打出卡牌时 | 符文杯子（打出攻击牌获得2点格挡） |
| enemy_defeated | 击败敌人时 | 吞噬者之戒（击败敌人回复3点生命） |
| player_hurt | 玩家受伤时 | 刺痛指环（受到伤害时对攻击者造成3点伤害） |

### BR-006: 奖励生成规则
- 普通战斗奖励: 1个遗物（低概率），通常只给卡牌
- 精英战斗奖励: 1个遗物（必定），从 all 池选择
- Boss战奖励: 1个稀有或传说遗物（必定），从 boss 池选择
- 奖励选项数量: 3个遗物供玩家选择

## Edge Cases

| Case | Input | Expected Output | Notes |
|------|-------|-----------------|-------|
| 授予不存在的遗物 | "relic_invalid_id" | false, 记录警告 | 遗物ID不存在 |
| 授予已拥有的遗物 | "relic_001" (已拥有) | false | 不重复授予 |
| 移除不拥有的遗物 | "relic_002" (未拥有) | false | 无法移除 |
| 空卡组流派分析 | [] | 默认权重 | 无流派偏向 |
| 生成奖励时池为空 | pool: "empty" | [] | 返回空数组 |
| 遗物效果执行失败 | invalid effect | 记录错误，跳过 | 不中断游戏 |
| 多个流派同时满足 | attack+defense | 组合流派权重 | 权重叠加 |

## Error Handling

| Error Code | Error Message | Condition | Resolution |
|------------|---------------|-----------|------------|
| ERR_RELIC_NOT_FOUND | "遗物未找到: {relicId}" | 遗物ID不存在 | 检查遗物数据文件 |
| ERR_RELIC_ALREADY_OWNED | "已拥有该遗物: {relicId}" | 尝试授予已拥有的遗物 | 检查拥有状态 |
| ERR_RELIC_FILE_INVALID | "遗物数据文件无效" | relics.json 解析失败 | 检查JSON格式 |
| ERR_RElic_POOL_EMPTY | "遗物池为空: {pool}" | 指定池无可用遗物 | 检查遗物池配置 |
| ERR_RELIC_EFFECT_FAILED | "遗物效果执行失败: {relicId}, {error}" | 效果函数异常 | 记录错误，继续执行 |

### Exception Behavior

```javascript
// 授予遗物错误处理示例
async grantRelic(relicId) {
    if (!this.#allRelics.has(relicId)) {
        console.warn(`[RelicManager] 遗物未找到: ${relicId}`);
        return false;
    }
    if (this.#ownedRelics.has(relicId)) {
        console.warn(`[RelicManager] 已拥有该遗物: ${relicId}`);
        return false;
    }
    // 正常授予逻辑...
    return true;
}
```

## Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| relics.json | Internal | 遗物数据源 |
| GameState | Internal | 游戏状态管理 |
| CardManager | Internal | 卡组查询（流派分析） |
| CombatSystem | Internal | 战斗触发点调用 |

## Performance Requirements

| Metric | Requirement |
|--------|-------------|
| 遗物加载时间 | < 100ms (100个遗物) |
| 流派分析时间 | < 10ms (20张卡牌) |
| 奖励生成时间 | < 50ms |
| 效果触发时间 | < 5ms per relic |
| 内存占用 | < 5MB (含缓存) |

## Test Cases

### Unit Tests

```javascript
// TC-REL-001: 加载遗物数据
test('loadRelics should load all relics from JSON', async () => {
    await relicManager.loadRelics();
    expect(relicManager.getRelicsByPool('all').length).toBeGreaterThan(0);
});

// TC-REL-002: 授予新遗物
test('grantRelic should add relic to owned set', async () => {
    await relicManager.loadRelics();
    const result = await relicManager.grantRelic('relic_burning_blood');
    expect(result).toBe(true);
    expect(relicManager.hasRelic('relic_burning_blood')).toBe(true);
});

// TC-REL-003: 重复授予遗物
test('grantRelic should return false for already owned relic', async () => {
    await relicManager.loadRelics();
    await relicManager.grantRelic('relic_burning_blood');
    const result = await relicManager.grantRelic('relic_burning_blood');
    expect(result).toBe(false);
});

// TC-REL-004: 授予不存在的遗物
test('grantRelic should return false for non-existent relic', async () => {
    await relicManager.loadRelics();
    const result = await relicManager.grantRelic('relic_invalid');
    expect(result).toBe(false);
});

// TC-REL-005: 移除已拥有的遗物
test('removeRelic should remove owned relic', async () => {
    await relicManager.loadRelics();
    await relicManager.grantRelic('relic_burning_blood');
    const result = relicManager.removeRelic('relic_burning_blood');
    expect(result).toBe(true);
    expect(relicManager.hasRelic('relic_burning_blood')).toBe(false);
});

// TC-REL-006: 移除不拥有的遗物
test('removeRelic should return false for unowned relic', () => {
    const result = relicManager.removeRelic('relic_burning_blood');
    expect(result).toBe(false);
});

// TC-REL-007: 按池查询遗物
test('getRelicsByPool should return correct relics', async () => {
    await relicManager.loadRelics();
    const bossRelics = relicManager.getRelicsByPool('boss');
    bossRelics.forEach(relic => {
        expect(relic.pool).toBe('boss');
    });
});

// TC-REL-008: 按稀有度查询遗物
test('getRelicsByRarity should return correct relics', async () => {
    await relicManager.loadRelics();
    const rareRelics = relicManager.getRelicsByRarity('rare');
    rareRelics.forEach(relic => {
        expect(relic.rarity).toBe('rare');
    });
});

// TC-REL-009: 流派引导-攻击流派
test('adjustPoolByArchetype should boost attack relics for attack-heavy deck', () => {
    const attackDeck = Array(10).fill({ type: 'attack' });
    const weights = relicManager.adjustPoolByArchetype(attackDeck);
    expect(weights.get('relic_berserker_globe')).toBeGreaterThan(100);
});

// TC-REL-010: 流派引导-防御流派
test('adjustPoolByArchetype should boost defense relics for defense-heavy deck', () => {
    const defenseDeck = Array(10).fill({ type: 'defense' });
    const weights = relicManager.adjustPoolByArchetype(defenseDeck);
    expect(weights.get('relic_anchor')).toBeGreaterThan(100);
});

// TC-REL-011: 流派引导-技能流派
test('adjustPoolByArchetype should boost skill relics for skill-heavy deck', () => {
    const skillDeck = Array(10).fill({ type: 'skill' });
    const weights = relicManager.adjustPoolByArchetype(skillDeck);
    expect(weights.get('relic_bag_of_preparation')).toBeGreaterThan(100);
});

// TC-REL-012: 生成奖励选项
test('generateRelicReward should return correct number of options', async () => {
    await relicManager.loadRelics();
    const rewards = relicManager.generateRelicReward('all', 3);
    expect(rewards.length).toBe(3);
    expect(new Set(rewards.map(r => r.id)).size).toBe(3); // 无重复
});

// TC-REL-013: Boss奖励稀有度
test('generateRelicReward with boss pool should only return rare/legendary', async () => {
    await relicManager.loadRelics();
    const rewards = relicManager.generateRelicReward('boss', 3);
    rewards.forEach(relic => {
        expect(['rare', 'legendary'].includes(relic.rarity)).toBe(true);
    });
});

// TC-REL-014: 战斗开始触发
test('triggerRelicEffect should execute combat_start relics', async () => {
    await relicManager.loadRelics();
    await relicManager.grantRelic('relic_burning_blood');
    const context = { player: { hp: 70 } };
    relicManager.triggerRelicEffect('combat_start', context);
    // 验证效果已执行
    expect(context.player.hp).toBe(73); // 假设燃烧之血回复3点
});

// TC-REL-015: 多遗物同时触发
test('multiple relics should trigger simultaneously', async () => {
    await relicManager.loadRelics();
    await relicManager.grantRelic('relic_burning_blood');
    await relicManager.grantRelic('relic_anchor');
    const context = { player: { hp: 70, block: 0 } };
    relicManager.triggerRelicEffect('combat_start', context);
    // 验证两个遗物效果都生效
});
```

## Data Structures

### relics.json 格式

```json
{
  "relics": [
    {
      "id": "relic_burning_blood",
      "name": "燃烧之血",
      "description": "每次战斗开始时，回复3点生命值",
      "rarity": "common",
      "pool": "all",
      "icon": "🔥",
      "effect": {
        "trigger": "combat_start",
        "type": "heal",
        "value": 3
      }
    },
    {
      "id": "relic_berserker_globe",
      "name": "狂战士之球",
      "description": "如果你卡组中有10张或更多攻击牌，每场战斗获得2点力量",
      "rarity": "rare",
      "pool": "all",
      "icon": "💢",
      "effect": {
        "trigger": "combat_start",
        "type": "strength",
        "value": 2,
        "condition": "attack_count >= 10"
      }
    },
    {
      "id": "relic_anchor",
      "name": "锚",
      "description": "每场战斗开始时获得10点格挡",
      "rarity": "rare",
      "pool": "all",
      "icon": "⚓",
      "effect": {
        "trigger": "combat_start",
        "type": "block",
        "value": 10
      }
    },
    {
      "id": "relic_runic_pyramid",
      "name": "符文金字塔",
      "description": "每回合开始时，保留手牌直到你打出3张牌",
      "rarity": "rare",
      "pool": "character",
      "character": "ironclad",
      "icon": "🔺",
      "effect": {
        "trigger": "turn_start",
        "type": "retain_cards",
        "limit": 3
      }
    },
    {
      "id": "relic_snecko_skull",
      "name": "斯内克之眼",
      "description": "每回合开始时，抽2张额外的牌",
      "rarity": "legendary",
      "pool": "boss",
      "icon": "👁️",
      "effect": {
        "trigger": "turn_start",
        "type": "draw",
        "value": 2
      }
    }
  ],
  "archetype_weights": {
    "relic_berserker_globe": ["attack"],
    "relic_anchor": ["defense"],
    "relic_bag_of_preparation": ["skill", "draw"],
    "relic_busted_crown": ["poison"],
    "relic_energy_egg": ["energy"]
  }
}
```

## Implementation Notes

### 1. 遗物效果执行策略

```javascript
// 效果触发器注册表
const EFFECT_HANDLERS = {
    heal: (value, context) => {
        context.player.hp = Math.min(context.player.hp + value, context.player.maxHp);
    },
    strength: (value, context) => {
        context.player.statusEffects.add('strength', value);
    },
    block: (value, context) => {
        context.player.block += value;
    },
    draw: (value, context) => {
        context.cardManager.drawCards(value);
    },
    energy: (value, context) => {
        context.player.energy += value;
    },
    retain_cards: (limit, context) => {
        context.player.retainLimit = limit;
    },
};
```

### 2. 流派引导实现

```javascript
adjustPoolByArchetype(deck) {
    const weights = new Map();
    const typeCounts = { attack: 0, defense: 0, skill: 0 };
    const keywordCounts = {};

    // 统计卡牌类型
    deck.forEach(card => {
        typeCounts[card.type]++;
        // 统计关键词
        if (card.keywords) {
            card.keywords.forEach(kw => {
                keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
            });
        }
    });

    const total = deck.length || 1;

    // 检测流派
    const archetypes = [];
    if (typeCounts.attack / total >= 0.4) archetypes.push('attack');
    if (typeCounts.defense / total >= 0.3) archetypes.push('defense');
    if (typeCounts.skill / total >= 0.3) archetypes.push('skill');
    if (keywordCounts['poison'] >= 2) archetypes.push('poison');
    if (keywordCounts['draw'] >= 2) archetypes.push('draw');
    if (keywordCounts['energy'] >= 2) archetypes.push('energy');

    // 应用流派权重
    this.#allRelics.forEach((relic, id) => {
        const baseWeight = RELIC_RARITY_WEIGHTS[relic.rarity];
        weights.set(id, baseWeight);

        // 流派加成
        if (this.#archetypeWeights.has(id)) {
            const relicArchetypes = this.#archetypeWeights.get(id);
            const matchCount = relicArchetypes.filter(a => archetypes.includes(a)).length;
            if (matchCount > 0) {
                weights.set(id, baseWeight * (1 + matchCount * 0.5));
            }
        }
    });

    return weights;
}
```

### 3. 奖励生成算法

```javascript
generateRelicReward(poolType, count, deck) {
    const pool = this.getRelicsByPool(poolType)
        .filter(r => !this.#ownedRelics.has(r.id));

    let weights;
    if (deck) {
        weights = this.adjustPoolByArchetype(deck);
    } else {
        weights = new Map();
        pool.forEach(r => weights.set(r.id, RELIC_RARITY_WEIGHTS[r.rarity]));
    }

    // 加权随机选择
    const selected = [];
    const available = [...pool];

    for (let i = 0; i < Math.min(count, available.length); i++) {
        const totalWeight = available.reduce((sum, r) => sum + (weights.get(r.id) || 100), 0);
        let random = Math.random() * totalWeight;

        for (const relic of available) {
            random -= (weights.get(relic.id) || 100);
            if (random <= 0) {
                selected.push(relic);
                available.splice(available.indexOf(relic), 1);
                break;
            }
        }
    }

    return selected;
}
```

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-09 | 初始版本 | Spec Writer Agent |
