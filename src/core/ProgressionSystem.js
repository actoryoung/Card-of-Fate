/**
 * ProgressionSystem - 角色成长系统
 *
 * 负责卡牌升级、删卡系统、永久属性提升等角色成长功能
 * 与 CardManager、GameState 等系统集成
 *
 * @class
 */
export class ProgressionSystem {
  /**
   * 创建 ProgressionSystem 实例
   * @param {Object} dependencies - 依赖对象
   * @param {CardManager} dependencies.cardManager - 卡牌管理器
   * @param {GameState} dependencies.gameState - 游戏状态管理器
   */
  constructor({ cardManager, gameState }) {
    if (!cardManager) {
      throw new Error('ERR_MISSING_DEPENDENCY: cardManager is required');
    }
    if (!gameState) {
      throw new Error('ERR_MISSING_DEPENDENCY: gameState is required');
    }

    this.cardManager = cardManager;
    this.gameState = gameState;

    // 删卡系统配置
    this.cardRemovalConfig = {
      baseCost: 75,
      costMultiplier: 1.25,
      maxCost: 300
    };

    // 卡牌升级配置
    this.cardUpgradeConfig = {
      free: true,
      damageBonus: 3,
      costReduction: 1,
      armorBonus: 3
    };

    // 属性提升配置
    this.statBoostConfig = {
      healPercent: 0.3,
      maxHpIncrease: 6,
      maxHpCap: 999
    };

    // 追踪统计
    this.stats = {
      cardsRemoved: 0,
      cardsUpgraded: 0,
      maxHpIncreases: 0,
      restHeals: 0
    };
  }

  /**
   * 升级卡牌
   * 在休息处可以升级卡牌，提升效果
   *
   * @param {string} cardId - 要升级的卡牌ID
   * @returns {Promise<{success: boolean, card?: Object, message?: string}>} - 操作结果
   */
  async upgradeCard(cardId) {
    // 查找卡组中的卡牌
    const cardInDeck = this.cardManager.deck.find(c => c.id === cardId);
    if (!cardInDeck) {
      return {
        success: false,
        message: 'ERR_CARD_NOT_FOUND: 卡牌不在卡组中'
      };
    }

    // 检查是否已升级
    if (cardInDeck.upgraded) {
      return {
        success: false,
        message: 'ERR_CARD_ALREADY_UPGRADED: 卡牌已经升级过'
      };
    }

    // 创建升级后的卡牌副本
    const upgradedCard = { ...cardInDeck };
    upgradedCard.upgraded = true;

    // 应用升级效果（优先级：攻击伤害 > 费用减少 > 护甲/效果增强）
    if (upgradedCard.type === 'attack') {
      // 攻击卡优先增加伤害
      if (upgradedCard.effect.type === 'damage') {
        upgradedCard.effect.value += this.cardUpgradeConfig.damageBonus;
        upgradedCard.description = upgradedCard.description.replace(
          /造成 (\d+) 点伤害/,
          (_, dmg) => `造成 ${parseInt(dmg) + this.cardUpgradeConfig.damageBonus} 点伤害`
        );
      } else if (upgradedCard.effect.type === 'damage_multi') {
        upgradedCard.effect.value += this.cardUpgradeConfig.damageBonus;
        upgradedCard.description = upgradedCard.description.replace(
          /造成 (\d+) 点伤害(\d*)次/,
          (_, dmg, count) => `造成 ${parseInt(dmg) + this.cardUpgradeConfig.damageBonus} 点伤害${count}次`
        );
      }
    } else if (upgradedCard.cost > 0) {
      // 非攻击卡可以减少费用
      const newCost = Math.max(0, upgradedCard.cost - this.cardUpgradeConfig.costReduction);
      upgradedCard.cost = newCost;
      upgradedCard.description = upgradedCard.description.replace(
        /费用 (\d+)/,
        `费用 ${newCost}`
      );
    } else {
      // 0费卡增加效果值
      if (upgradedCard.effect.value !== undefined) {
        upgradedCard.effect.value += this.cardUpgradeConfig.armorBonus;
        if (upgradedCard.type === 'defense') {
          upgradedCard.description = upgradedCard.description.replace(
            /获得 (\d+) 点护甲/,
            (_, armor) => `获得 ${parseInt(armor) + this.cardUpgradeConfig.armorBonus} 点护甲`
          );
        }
      }
    }

    // 更新卡牌名称
    upgradedCard.name = upgradedCard.name.replace(' \+', '') + ' +';

    // 更新卡组中的卡牌
    const deckIndex = this.cardManager.deck.findIndex(c => c.id === cardId);
    if (deckIndex !== -1) {
      this.cardManager.deck[deckIndex] = upgradedCard;
    }

    // 同步更新抽牌堆中的卡牌
    const drawPileIndex = this.cardManager.drawPile.findIndex(c => c.id === cardId);
    if (drawPileIndex !== -1) {
      this.cardManager.drawPile[drawPileIndex] = upgradedCard;
    }

    // 更新统计
    this.stats.cardsUpgraded++;

    // 更新游戏状态
    this.gameState.updatePlayerState({
      deck: [...this.cardManager.deck]
    });

    return {
      success: true,
      card: upgradedCard,
      message: `卡牌 "${upgradedCard.name}" 升级成功`
    };
  }

  /**
   * 删除卡牌
   * 在休息处可以删除卡组中的卡牌，费用随删除次数增加
   *
   * @param {string} cardId - 要删除的卡牌ID
   * @param {number} cost - 删除费用
   * @returns {Promise<{success: boolean, message?: string, newCost?: number}>} - 操作结果
   */
  async removeCard(cardId, cost) {
    // 验证费用
    const currentCost = this.getCardRemovalCost();
    if (cost !== currentCost) {
      return {
        success: false,
        message: `ERR_INVALID_COST: 费用不匹配，当前费用: ${currentCost}`
      };
    }

    // 检查玩家金币
    if (this.gameState.playerState.gold < cost) {
      return {
        success: false,
        message: `ERR_INSUFFICIENT_GOLD: 金币不足（需要 ${cost}，当前 ${this.gameState.playerState.gold}）`
      };
    }

    // 检查卡牌是否在卡组中
    const cardInDeck = this.cardManager.deck.find(c => c.id === cardId);
    if (!cardInDeck) {
      return {
        success: false,
        message: 'ERR_CARD_NOT_FOUND: 卡牌不在卡组中'
      };
    }

    // 检查卡组最小数量限制（至少保留5张卡）
    const minDeckSize = 5;
    if (this.cardManager.deck.length <= minDeckSize) {
      return {
        success: false,
        message: `ERR_MIN_DECK_SIZE: 卡组至少需要保留 ${minDeckSize} 张卡牌`
      };
    }

    // 从卡组中移除
    const result = this.cardManager.removeCardFromDeck(cardId);
    if (!result.success) {
      return result;
    }

    // 扣除金币
    this.gameState.updatePlayerState({
      gold: this.gameState.playerState.gold - cost
    });

    // 更新统计
    this.stats.cardsRemoved++;

    // 计算下一次删除费用
    const newCost = this.getCardRemovalCost();

    return {
      success: true,
      message: `已删除卡牌 "${cardInDeck.name}"`,
      newCost: newCost
    };
  }

  /**
   * 获取当前删除卡牌的费用
   * 费用随删除次数增加：75 → 100 → 150...
   *
   * @returns {number} - 当前删除费用
   */
  getCardRemovalCost() {
    const removalCount = this.stats.cardsRemoved;
    let cost = this.cardRemovalConfig.baseCost;

    // 费用随次数指数增长
    for (let i = 0; i < removalCount; i++) {
      cost = Math.floor(cost * this.cardRemovalConfig.costMultiplier);
      cost = Math.min(cost, this.cardRemovalConfig.maxCost);
    }

    return cost;
  }

  /**
   * 增加最大生命值
   * 通过事件奖励或休息处选择获得永久生命值提升
   *
   * @param {number} amount - 增加的生命值数量
   * @returns {Promise<{success: boolean, maxHp?: number, message?: string}>} - 操作结果
   */
  async increaseMaxHp(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      return {
        success: false,
        message: 'ERR_INVALID_AMOUNT: 生命值提升数量必须为正数'
      };
    }

    const currentMaxHp = this.gameState.playerState.maxHp;
    const currentHp = this.gameState.playerState.hp;

    // 检查上限
    if (currentMaxHp >= this.statBoostConfig.maxHpCap) {
      return {
        success: false,
        message: `ERR_MAX_HP_CAP: 已达到最大生命值上限 (${this.statBoostConfig.maxHpCap})`
      };
    }

    // 增加最大生命值
    const newMaxHp = Math.min(currentMaxHp + amount, this.statBoostConfig.maxHpCap);
    const hpIncrease = newMaxHp - currentMaxHp;

    // 同时增加当前生命值
    const newHp = Math.min(currentHp + hpIncrease, newMaxHp);

    // 更新游戏状态
    this.gameState.updatePlayerState({
      maxHp: newMaxHp,
      hp: newHp
    });

    // 更新统计
    this.stats.maxHpIncreases++;

    return {
      success: true,
      maxHp: newMaxHp,
      hp: newHp,
      message: `最大生命值 +${hpIncrease}（${currentMaxHp} → ${newMaxHp}）`
    };
  }

  /**
   * 在休息处回复生命值
   * 回复当前生命值的 30%
   *
   * @returns {Promise<{success: boolean, healed?: number, message?: string}>} - 操作结果
   */
  async healAtRest() {
    const currentHp = this.gameState.playerState.hp;
    const maxHp = this.gameState.playerState.maxHp;

    if (currentHp >= maxHp) {
      return {
        success: false,
        message: 'ERR_FULL_HP: 生命值已满，无需恢复'
      };
    }

    // 计算回复量
    const missingHp = maxHp - currentHp;
    const healAmount = Math.ceil(missingHp * this.statBoostConfig.healPercent);
    const newHp = Math.min(currentHp + healAmount, maxHp);

    // 更新游戏状态
    this.gameState.updatePlayerState({
      hp: newHp
    });

    // 更新统计
    this.stats.restHeals++;

    return {
      success: true,
      healed: newHp - currentHp,
      message: `恢复 ${newHp - currentHp} 点生命值（${currentHp} → ${newHp}/${maxHp}）`
    };
  }

  /**
   * 获取休息处可用选项
   * 玩家可以选择：回血30%、最大生命+6、升级卡牌
   *
   * @returns {Array<Object>} - 休息选项数组
   */
  getRestOptions() {
    const options = [];

    // 选项1：回复生命值
    const currentHp = this.gameState.playerState.hp;
    const maxHp = this.gameState.playerState.maxHp;
    const missingHp = maxHp - currentHp;
    const healAmount = Math.ceil(missingHp * this.statBoostConfig.healPercent);

    options.push({
      id: 'heal',
      name: '营地休息',
      description: `恢复 ${healAmount} 点生命值（${currentHp} → ${Math.min(currentHp + healAmount, maxHp)}/${maxHp}）`,
      icon: '❤️',
      available: currentHp < maxHp,
      action: async () => this.healAtRest()
    });

    // 选项2：增加最大生命值
    const canIncreaseHp = this.gameState.playerState.maxHp < this.statBoostConfig.maxHpCap;
    options.push({
      id: 'max_hp',
      name: '强化体魄',
      description: `最大生命值 +${this.statBoostConfig.maxHpIncrease}（当前: ${this.gameState.playerState.maxHp}/${this.statBoostConfig.maxHpCap}）`,
      icon: '💪',
      available: canIncreaseHp,
      action: async () => this.increaseMaxHp(this.statBoostConfig.maxHpIncrease)
    });

    // 选项3：升级卡牌
    const upgradableCards = this.cardManager.deck.filter(c => !c.upgraded);
    options.push({
      id: 'upgrade_card',
      name: '磨砺技艺',
      description: `升级一张卡牌（可升级: ${upgradableCards.length} 张）`,
      icon: '⬆️',
      available: upgradableCards.length > 0,
      action: async (cardId) => this.upgradeCard(cardId),
      requiresCard: true,
      availableCards: upgradableCards
    });

    // 选项4：删除卡牌
    const removalCost = this.getCardRemovalCost();
    const hasGold = this.gameState.playerState.gold >= removalCost;
    const canRemoveCard = this.cardManager.deck.length > 5;

    options.push({
      id: 'remove_card',
      name: '精简卡组',
      description: `删除一张卡牌（费用: ${removalCost} 金币）`,
      icon: '🗑️',
      available: canRemoveCard && hasGold,
      action: async (cardId) => this.removeCard(cardId, removalCost),
      requiresCard: true,
      availableCards: this.cardManager.deck,
      cost: removalCost
    });

    return options;
  }

  /**
   * 获取可升级的卡牌列表
   *
   * @returns {Array<Object>} - 可升级的卡牌数组
   */
  getUpgradableCards() {
    return this.cardManager.deck.filter(card => !card.upgraded);
  }

  /**
   * 获取可删除的卡牌列表
   *
   * @returns {Array<Object>} - 可删除的卡牌数组
   */
  getRemovableCards() {
    const minDeckSize = 5;
    if (this.cardManager.deck.length <= minDeckSize) {
      return [];
    }
    return [...this.cardManager.deck];
  }

  /**
   * 重置成长系统统计（用于新游戏）
   */
  resetStats() {
    this.stats = {
      cardsRemoved: 0,
      cardsUpgraded: 0,
      maxHpIncreases: 0,
      restHeals: 0
    };
  }

  /**
   * 获取成长系统统计信息
   *
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      currentRemovalCost: this.getCardRemovalCost(),
      upgradableCardsCount: this.getUpgradableCards().length,
      removableCardsCount: this.getRemovableCards().length
    };
  }

  /**
   * 导出系统状态（用于存档）
   *
   * @returns {Object} - 系统状态
   */
  exportState() {
    return {
      stats: { ...this.stats },
      config: {
        cardRemovalConfig: { ...this.cardRemovalConfig },
        cardUpgradeConfig: { ...this.cardUpgradeConfig },
        statBoostConfig: { ...this.statBoostConfig }
      }
    };
  }

  /**
   * 导入系统状态（用于读档）
   *
   * @param {Object} state - 系统状态
   */
  importState(state) {
    if (!state || !state.stats) {
      console.warn('ProgressionSystem: Invalid state for import');
      return;
    }

    this.stats = { ...state.stats };

    if (state.config) {
      Object.assign(this.cardRemovalConfig, state.config.cardRemovalConfig || {});
      Object.assign(this.cardUpgradeConfig, state.config.cardUpgradeConfig || {});
      Object.assign(this.statBoostConfig, state.config.statBoostConfig || {});
    }
  }
}

/**
 * 错误代码常量
 */
export const PROGRESSION_ERROR_CODES = {
  CARD_NOT_FOUND: 'ERR_CARD_NOT_FOUND',
  CARD_ALREADY_UPGRADED: 'ERR_CARD_ALREADY_UPGRADED',
  INSUFFICIENT_GOLD: 'ERR_INSUFFICIENT_GOLD',
  INVALID_COST: 'ERR_INVALID_COST',
  MIN_DECK_SIZE: 'ERR_MIN_DECK_SIZE',
  INVALID_AMOUNT: 'ERR_INVALID_AMOUNT',
  MAX_HP_CAP: 'ERR_MAX_HP_CAP',
  FULL_HP: 'ERR_FULL_HP',
  MISSING_DEPENDENCY: 'ERR_MISSING_DEPENDENCY'
};

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  CARD_REMOVAL: {
    BASE_COST: 75,
    COST_MULTIPLIER: 1.25,
    MAX_COST: 300
  },
  CARD_UPGRADE: {
    FREE: true,
    DAMAGE_BONUS: 3,
    COST_REDUCTION: 1,
    ARMOR_BONUS: 3
  },
  STAT_BOOST: {
    HEAL_PERCENT: 0.3,
    MAX_HP_INCREASE: 6,
    MAX_HP_CAP: 999
  },
  MIN_DECK_SIZE: 5
};
