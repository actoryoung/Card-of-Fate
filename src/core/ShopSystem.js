/**
 * ShopSystem - 商店管理系统
 *
 * 负责商店商品生成、价格计算、卡牌/遗物交易、删卡服务等功能
 * 与 CardManager、RelicManager、GameState 等系统协同工作
 *
 * @class
 */
export class ShopSystem {
  /**
   * 构造函数
   * @param {Object} gameState - 游戏状态管理器
   * @param {Object} cardManager - 卡牌管理器
   * @param {Object} relicManager - 遗物管理器
   */
  constructor(gameState = null, cardManager = null, relicManager = null) {
    this.gameState = gameState;
    this.cardManager = cardManager;
    this.relicManager = relicManager;

    // 商店配置
    this.config = {
      // 商品数量
      cardCount: 5,
      relicCount: 3,
      potionCount: 2,

      // 价格基础值
      basePrices: {
        common: 50,
        rare: 100,
        epic: 200
      },

      // 遗物价格
      relicPrices: {
        common: 150,
        rare: 300,
        legendary: 500
      },

      // 删卡服务价格
      removeCardPrice: 100,

      // 价格波动范围 (±)
      priceFluctuation: 0.2,

      // 折扣配置
      discountChance: 0.3,
      discountAmounts: [0.1, 0.2, 0.25]
    };

    // 当前商店商品
    this.currentProducts = {
      cards: [],
      relics: [],
      potions: []
    };

    // 初始化状态
    this.isInitialized = false;
  }

  /**
   * 初始化商店系统
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.gameState) {
      throw new Error('ERR_SHOP_NO_STATE: 游戏状态管理器未提供');
    }
    this.isInitialized = true;
  }

  /**
   * 生成商店商品
   * @param {Object} options - 生成选项
   * @param {number} options.level - 当前关卡难度
   * @param {boolean} options.includeRelics - 是否包含遗物
   * @param {boolean} options.includePotions - 是否包含药水
   * @returns {Promise<Object>} 生成的商品列表
   */
  async generateShopProducts(options = {}) {
    const {
      level = 1,
      includeRelics = true,
      includePotions = true
    } = options;

    if (!this.isInitialized) {
      await this.initialize();
    }

    // 生成卡牌商品
    const cards = await this._generateCardProducts(level);

    // 生成遗物商品
    const relics = includeRelics ? await this._generateRelicProducts(level) : [];

    // 生成药水商品（预留）
    const potions = includePotions ? await this._generatePotionProducts(level) : [];

    this.currentProducts = { cards, relics, potions };

    console.log(`[ShopSystem] 生成商店商品: ${cards.length}张卡牌, ${relics.length}个遗物, ${potions.length}瓶药水`);

    return {
      cards: cards.map(p => this._formatProductForDisplay(p)),
      relics: relics.map(p => this._formatProductForDisplay(p)),
      potions: potions.map(p => this._formatProductForDisplay(p))
    };
  }

  /**
   * 购买卡牌
   * @param {string} cardId - 卡牌ID
   * @returns {Promise<{success: boolean, card?: Object, message?: string}>} 购买结果
   */
  async buyCard(cardId) {
    // 查找商品
    const product = this.currentProducts.cards.find(p => p.card.id === cardId);
    if (!product) {
      return {
        success: false,
        message: 'ERR_SHOP_CARD_NOT_AVAILABLE: 该卡牌不在商店中'
      };
    }

    if (product.sold) {
      return {
        success: false,
        message: 'ERR_SHOP_CARD_SOLD: 该卡牌已售出'
      };
    }

    // 检查金币
    if (this.gameState.playerState.gold < product.price) {
      return {
        success: false,
        message: `ERR_SHOP_INSUFFICIENT_GOLD: 金币不足（需要 ${product.price}，当前 ${this.gameState.playerState.gold}）`
      };
    }

    // 检查卡组是否已满
    if (this.cardManager && this.cardManager.deck.length >= this.cardManager.maxDeckSize) {
      return {
        success: false,
        message: 'ERR_SHOP_DECK_FULL: 卡组已满，无法购买'
      };
    }

    // 执行购买
    this.gameState.playerState.gold -= product.price;
    product.sold = true;

    // 添加卡牌到卡组
    if (this.cardManager) {
      const result = this.cardManager.addCardToDeck(cardId);
      if (!result.success) {
        // 回滚金币
        this.gameState.playerState.gold += product.price;
        product.sold = false;
        return result;
      }
    }

    console.log(`[ShopSystem] 购买卡牌: ${product.card.name}, 价格: ${product.price}`);

    return {
      success: true,
      card: product.card,
      message: `成功购买 ${product.card.name}`
    };
  }

  /**
   * 出售卡牌
   * @param {string} cardId - 卡牌ID
   * @returns {Promise<{success: boolean, gold?: number, message?: string}>} 出售结果
   */
  async sellCard(cardId) {
    if (!this.cardManager) {
      return {
        success: false,
        message: 'ERR_SHOP_NO_CARD_MANAGER: 卡牌管理器未初始化'
      };
    }

    // 检查卡牌是否在卡组中
    const card = this.cardManager.deck.find(c => c.id === cardId);
    if (!card) {
      return {
        success: false,
        message: 'ERR_SHOP_CARD_NOT_IN_DECK: 卡牌不在卡组中'
      };
    }

    // 计算出售价格（基础价格的50%）
    const basePrice = this.config.basePrices[card.rarity] || this.config.basePrices.common;
    const sellPrice = Math.floor(basePrice * 0.5);

    // 移除卡牌
    const removeResult = this.cardManager.removeCardFromDeck(cardId);
    if (!removeResult.success) {
      return removeResult;
    }

    // 增加金币
    this.gameState.playerState.gold += sellPrice;

    console.log(`[ShopSystem] 出售卡牌: ${card.name}, 获得: ${sellPrice} 金币`);

    return {
      success: true,
      gold: sellPrice,
      message: `成功出售 ${card.name}，获得 ${sellPrice} 金币`
    };
  }

  /**
   * 删除卡牌（付费服务）
   * @param {string} cardId - 卡牌ID
   * @returns {Promise<{success: boolean, message?: string}>} 删除结果
   */
  async removeCard(cardId) {
    if (!this.cardManager) {
      return {
        success: false,
        message: 'ERR_SHOP_NO_CARD_MANAGER: 卡牌管理器未初始化'
      };
    }

    // 检查卡牌是否在卡组中
    const card = this.cardManager.deck.find(c => c.id === cardId);
    if (!card) {
      return {
        success: false,
        message: 'ERR_SHOP_CARD_NOT_IN_DECK: 卡牌不在卡组中'
      };
    }

    // 检查金币
    const removePrice = this.config.removeCardPrice;
    if (this.gameState.playerState.gold < removePrice) {
      return {
        success: false,
        message: `ERR_SHOP_INSUFFICIENT_GOLD: 金币不足（需要 ${removePrice}，当前 ${this.gameState.playerState.gold}）`
      };
    }

    // 检查卡组最小数量（至少保留10张卡）
    if (this.cardManager.deck.length <= 10) {
      return {
        success: false,
        message: 'ERR_SHOP_DECK_TOO_SMALL: 卡组不能少于10张卡'
      };
    }

    // 扣除金币
    this.gameState.playerState.gold -= removePrice;

    // 移除卡牌
    const removeResult = this.cardManager.removeCardFromDeck(cardId);
    if (!removeResult.success) {
      // 回滚金币
      this.gameState.playerState.gold += removePrice;
      return removeResult;
    }

    console.log(`[ShopSystem] 删除卡牌: ${card.name}, 费用: ${removePrice}`);

    return {
      success: true,
      message: `成功删除 ${card.name}，花费 ${removePrice} 金币`
    };
  }

  /**
   * 购买遗物
   * @param {string} relicId - 遗物ID
   * @returns {Promise<{success: boolean, relic?: Object, message?: string}>} 购买结果
   */
  async buyRelic(relicId) {
    if (!this.relicManager) {
      return {
        success: false,
        message: 'ERR_SHOP_NO_RELIC_MANAGER: 遗物管理器未初始化'
      };
    }

    // 查找商品
    const product = this.currentProducts.relics.find(p => p.relic.id === relicId);
    if (!product) {
      return {
        success: false,
        message: 'ERR_SHOP_RELIC_NOT_AVAILABLE: 该遗物不在商店中'
      };
    }

    if (product.sold) {
      return {
        success: false,
        message: 'ERR_SHOP_RELIC_SOLD: 该遗物已售出'
      };
    }

    // 检查是否已拥有
    if (this.relicManager.hasRelic(relicId)) {
      return {
        success: false,
        message: 'ERR_SHOP_RELIC_OWNED: 已拥有该遗物'
      };
    }

    // 检查金币
    if (this.gameState.playerState.gold < product.price) {
      return {
        success: false,
        message: `ERR_SHOP_INSUFFICIENT_GOLD: 金币不足（需要 ${product.price}，当前 ${this.gameState.playerState.gold}）`
      };
    }

    // 执行购买
    this.gameState.playerState.gold -= product.price;
    product.sold = true;

    // 添加遗物
    const granted = this.relicManager.grantRelic(relicId);
    if (!granted) {
      // 回滚金币
      this.gameState.playerState.gold += product.price;
      product.sold = false;
      return {
        success: false,
        message: 'ERR_SHOP_RELIC_GRANT_FAILED: 遗物授予失败'
      };
    }

    console.log(`[ShopSystem] 购买遗物: ${product.relic.name}, 价格: ${product.price}`);

    return {
      success: true,
      relic: product.relic,
      message: `成功购买 ${product.relic.name}`
    };
  }

  /**
   * 计算商品价格
   * @param {Object} item - 商品对象
   * @param {string} type - 商品类型 (card/relic)
   * @param {number} level - 当前关卡难度
   * @returns {number} 计算后的价格
   */
  calculatePrice(item, type, level = 1) {
    // 获取基础价格
    let basePrice;
    if (type === 'card') {
      basePrice = this.config.basePrices[item.rarity] || this.config.basePrices.common;
    } else if (type === 'relic') {
      basePrice = this.config.relicPrices[item.rarity] || this.config.relicPrices.common;
    } else {
      basePrice = 50;
    }

    // 应用关卡难度调整（每级增加5%）
    const levelModifier = 1 + (level - 1) * 0.05;

    // 应用价格波动
    const fluctuation = (Math.random() - 0.5) * 2 * this.config.priceFluctuation;

    // 计算最终价格
    let finalPrice = Math.floor(basePrice * levelModifier * (1 + fluctuation));

    // 确保价格不低于基础价格的50%
    finalPrice = Math.max(finalPrice, Math.floor(basePrice * 0.5));

    return finalPrice;
  }

  /**
   * 应用折扣到商品
   * @param {Object} product - 商品对象
   * @returns {Object} 折扣后的商品
   */
  _applyDiscount(product) {
    // 随机决定是否应用折扣
    if (Math.random() < this.config.discountChance) {
      const discount = this.config.discountAmounts[
        Math.floor(Math.random() * this.config.discountAmounts.length)
      ];
      product.discount = discount;
      product.originalPrice = product.price;
      product.price = Math.floor(product.price * (1 - discount));
      product.hasDiscount = true;
    }
    return product;
  }

  /**
   * 生成卡牌商品
   * @param {number} level - 当前关卡难度
   * @returns {Promise<Array>} 卡牌商品列表
   * @private
   */
  async _generateCardProducts(level) {
    if (!this.cardManager || !this.cardManager.allCards) {
      return [];
    }

    const products = [];
    const availableCards = [...this.cardManager.allCards];

    // 确保至少有1张稀有卡
    const rareCards = availableCards.filter(c => c.rarity === 'rare');
    const commonCards = availableCards.filter(c => c.rarity === 'common');

    // 随机选择卡牌
    const selectedCards = [];

    // 添加1张稀有卡（如果有）
    if (rareCards.length > 0) {
      const randomRare = rareCards[Math.floor(Math.random() * rareCards.length)];
      selectedCards.push(randomRare);
    }

    // 添加普通卡
    while (selectedCards.length < this.config.cardCount && commonCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * commonCards.length);
      const card = commonCards.splice(randomIndex, 1)[0];

      // 避免重复
      if (!selectedCards.some(c => c.id === card.id)) {
        selectedCards.push(card);
      }
    }

    // 创建商品对象
    for (const card of selectedCards) {
      const price = this.calculatePrice(card, 'card', level);
      let product = {
        card: {...card},
        price,
        sold: false,
        hasDiscount: false
      };

      // 应用折扣
      product = this._applyDiscount(product);
      products.push(product);
    }

    return products;
  }

  /**
   * 生成遗物商品
   * @param {number} level - 当前关卡难度
   * @returns {Promise<Array>} 遗物商品列表
   * @private
   */
  async _generateRelicProducts(level) {
    if (!this.relicManager) {
      return [];
    }

    const products = [];

    // 从商店池获取遗物
    const shopRelics = this.relicManager.getRelicsByPool('shop');

    // 如果商店池为空，使用通用池
    const availableRelics = shopRelics.length > 0
      ? shopRelics.filter(r => !this.relicManager.hasRelic(r.id))
      : this.relicManager.allRelics.filter(r =>
          r.pool === 'all' && !this.relicManager.hasRelic(r.id)
        );

    // 随机选择遗物
    const selectedRelics = [];
    const shuffled = [...availableRelics].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(this.config.relicCount, shuffled.length); i++) {
      selectedRelics.push(shuffled[i]);
    }

    // 创建商品对象
    for (const relic of selectedRelics) {
      const price = this.calculatePrice(relic, 'relic', level);
      let product = {
        relic: {...relic},
        price,
        sold: false,
        hasDiscount: false
      };

      // 应用折扣
      product = this._applyDiscount(product);
      products.push(product);
    }

    return products;
  }

  /**
   * 生成药水商品（预留）
   * @param {number} level - 当前关卡难度
   * @returns {Promise<Array>} 药水商品列表
   * @private
   */
  async _generatePotionProducts(level) {
    // 药水系统预留，待后续实现
    const potions = [
      {
        id: 'potion_health',
        name: '生命药水',
        description: '恢复20点生命值',
        icon: '🧪',
        effect: { type: 'heal', value: 20 },
        price: 50
      },
      {
        id: 'potion_energy',
        name: '能量药水',
        description: '战斗中获得2点额外能量',
        icon: '⚡',
        effect: { type: 'energy', value: 2 },
        price: 75
      },
      {
        id: 'potion_strength',
        name: '力量药水',
        description: '战斗中获得2点力量',
        icon: '💪',
        effect: { type: 'strength', value: 2 },
        price: 100
      },
      {
        id: 'potion_block',
        name: '护甲药水',
        description: '获得12点护甲',
        icon: '🛡️',
        effect: { type: 'armor', value: 12 },
        price: 50
      },
      {
        id: 'potion_explosion',
        name: '爆炸药水',
        description: '对所有敌人造成20点伤害',
        icon: '💥',
        effect: { type: 'damage', value: 20 },
        price: 80
      }
    ];

    const products = [];
    const shuffled = [...potions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(this.config.potionCount, shuffled.length); i++) {
      const potion = shuffled[i];
      products.push({
        potion: {...potion},
        price: potion.price,
        sold: false,
        hasDiscount: false
      });
    }

    return products;
  }

  /**
   * 格式化商品用于显示
   * @param {Object} product - 商品对象
   * @returns {Object} 格式化后的商品
   * @private
   */
  _formatProductForDisplay(product) {
    const display = {
      price: product.price,
      sold: product.sold
    };

    if (product.hasDiscount) {
      display.originalPrice = product.originalPrice;
      display.discount = product.discount;
      display.discountPercent = Math.round(product.discount * 100);
    }

    if (product.card) {
      display.type = 'card';
      display.id = product.card.id;
      display.name = product.card.name;
      display.description = product.card.description;
      display.icon = product.card.icon;
      display.rarity = product.card.rarity;
    }

    if (product.relic) {
      display.type = 'relic';
      display.id = product.relic.id;
      display.name = product.relic.name;
      display.description = product.relic.description;
      display.icon = product.relic.icon;
      display.rarity = product.relic.rarity;
    }

    if (product.potion) {
      display.type = 'potion';
      display.id = product.potion.id;
      display.name = product.potion.name;
      display.description = product.potion.description;
      display.icon = product.potion.icon;
    }

    return display;
  }

  /**
   * 获取当前商店商品
   * @returns {Object} 当前商品列表
   */
  getCurrentProducts() {
    return {
      cards: this.currentProducts.cards.map(p => this._formatProductForDisplay(p)),
      relics: this.currentProducts.relics.map(p => this._formatProductForDisplay(p)),
      potions: this.currentProducts.potions.map(p => this._formatProductForDisplay(p))
    };
  }

  /**
   * 刷新商店（生成新商品）
   * @param {Object} options - 刷新选项
   * @param {number} options.cost - 刷新费用
   * @param {number} options.level - 当前关卡难度
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshShop(options = {}) {
    const { cost = 50, level = 1 } = options;

    // 检查金币
    if (this.gameState.playerState.gold < cost) {
      return {
        success: false,
        message: `ERR_SHOP_INSUFFICIENT_GOLD: 金币不足（需要 ${cost}，当前 ${this.gameState.playerState.gold}）`
      };
    }

    // 扣除刷新费用
    this.gameState.playerState.gold -= cost;

    // 生成新商品
    const products = await this.generateShopProducts({ level });

    console.log(`[ShopSystem] 刷新商店，花费: ${cost}`);

    return {
      success: true,
      products,
      message: `商店已刷新，花费 ${cost} 金币`
    };
  }

  /**
   * 获取玩家卡组中可出售的卡牌
   * @returns {Array} 可出售的卡牌列表
   */
  getSellableCards() {
    if (!this.cardManager || !this.cardManager.deck) {
      return [];
    }

    return this.cardManager.deck.map(card => ({
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      icon: card.icon,
      sellPrice: Math.floor((this.config.basePrices[card.rarity] || this.config.basePrices.common) * 0.5)
    }));
  }

  /**
   * 获取玩家卡组中可删除的卡牌
   * @returns {Array} 可删除的卡牌列表
   */
  getRemovableCards() {
    if (!this.cardManager || !this.cardManager.deck) {
      return [];
    }

    // 至少保留10张卡
    if (this.cardManager.deck.length <= 10) {
      return [];
    }

    return this.cardManager.deck.map(card => ({
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      icon: card.icon,
      removePrice: this.config.removeCardPrice
    }));
  }

  /**
   * 获取商店配置
   * @returns {Object} 商店配置
   */
  getConfig() {
    return {...this.config};
  }

  /**
   * 更新商店配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * 获取商店状态
   * @returns {Object} 商店状态
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentGold: this.gameState?.playerState?.gold || 0,
      products: this.getCurrentProducts(),
      config: this.getConfig()
    };
  }
}

// 导出常量
export const SHOP_ERROR_CODES = {
  NO_STATE: 'ERR_SHOP_NO_STATE',
  NO_CARD_MANAGER: 'ERR_SHOP_NO_CARD_MANAGER',
  NO_RELIC_MANAGER: 'ERR_SHOP_NO_RELIC_MANAGER',
  CARD_NOT_AVAILABLE: 'ERR_SHOP_CARD_NOT_AVAILABLE',
  CARD_SOLD: 'ERR_SHOP_CARD_SOLD',
  CARD_NOT_IN_DECK: 'ERR_SHOP_CARD_NOT_IN_DECK',
  DECK_FULL: 'ERR_SHOP_DECK_FULL',
  DECK_TOO_SMALL: 'ERR_SHOP_DECK_TOO_SMALL',
  RELIC_NOT_AVAILABLE: 'ERR_SHOP_RELIC_NOT_AVAILABLE',
  RELIC_SOLD: 'ERR_SHOP_RELIC_SOLD',
  RELIC_OWNED: 'ERR_SHOP_RELIC_OWNED',
  RELIC_GRANT_FAILED: 'ERR_SHOP_RELIC_GRANT_FAILED',
  INSUFFICIENT_GOLD: 'ERR_SHOP_INSUFFICIENT_GOLD'
};

export const SHOP_PRODUCT_TYPES = {
  CARD: 'card',
  RELIC: 'relic',
  POTION: 'potion'
};

export default ShopSystem;
