/**
 * 战斗系统核心
 * 处理战斗回合、卡牌效果、伤害计算
 */

class Combat {
  constructor(player, enemies) {
    this.player = player;
    this.enemies = enemies;
    this.turn = 0;
    this.round = 1;
  }

  startTurn() {
    // 回合开始：抽牌、重置能量
    this.playerDrawCards();
    this.player.energy = this.player.maxEnergy;
  }

  endTurn() {
    // 回合结束：弃牌、触发状态效果
    this.playerDiscardHand();
    this.enemyTurn();
  }

  playCard(cardId, targetId) {
    // 打出卡牌
    const card = this.getCard(cardId);
    if (this.canPlayCard(card)) {
      this.player.energy -= card.cost;
      this.executeCardEffect(card, targetId);
      this.player.hand = this.player.hand.filter(c => c.id !== cardId);
      this.player.discard.push(cardId);
    }
  }

  canPlayCard(card) {
    return this.player.energy >= card.cost;
  }

  executeCardEffect(card, targetId) {
    const target = this.getTarget(targetId);
    const effect = card.effect;

    switch (effect.type) {
      case 'damage':
        this.dealDamage(target, effect.value);
        break;
      case 'damage_multi':
        for (let i = 0; i < effect.count; i++) {
          this.dealDamage(target, effect.value);
        }
        break;
      case 'armor':
        this.player.armor += effect.value;
        break;
      case 'draw':
        this.playerDrawCards(effect.value);
        break;
      case 'energy':
        this.player.energy += effect.value;
        break;
      // ... 更多效果类型
    }
  }

  dealDamage(target, damage) {
    const actualDamage = Math.max(1, damage - target.armor);
    target.hp -= actualDamage;
    target.armor = Math.max(0, target.armor - damage);
  }

  enemyTurn() {
    // 敌人行动
    this.enemies.forEach(enemy => {
      const action = enemy.getNextAction();
      this.executeEnemyAction(enemy, action);
    });
  }
}
