/**
 * UI 渲染器
 * 使用纯 DOM/CSS 渲染游戏界面
 */

class Renderer {
  constructor(container) {
    this.container = container;
  }

  renderCard(card) {
    return `
      <div class="card" data-id="${card.id}">
        <div class="card-cost">${card.cost}</div>
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-rarity ${card.rarity}"></div>
      </div>
    `;
  }

  renderHand(hand) {
    return `
      <div class="hand">
        ${hand.map(card => this.renderCard(card)).join('')}
      </div>
    `;
  }

  renderPlayer(player) {
    return `
      <div class="player-status">
        <div class="hp-bar">
          <div class="hp-fill" style="width: ${player.hp / player.maxHp * 100}%"></div>
          <span>${player.hp}/${player.maxHp}</span>
        </div>
        <div class="energy">${player.energy}⚡</div>
        <div class="armor">${player.armor}🛡️</div>
        <div class="gold">${player.gold}💰</div>
      </div>
    `;
  }

  renderEnemy(enemy) {
    const intent = enemy.getCurrentIntent();
    return `
      <div class="enemy" data-id="${enemy.id}">
        <div class="enemy-icon">${enemy.icon}</div>
        <div class="enemy-name">${enemy.name}</div>
        <div class="enemy-hp">${enemy.hp}</div>
        <div class="enemy-intent">${intent}</div>
      </div>
    `;
  }

  renderCombatView(player, enemies, hand) {
    return `
      <div class="combat-view">
        ${this.renderPlayer(player)}
        <div class="enemies">
          ${enemies.map(e => this.renderEnemy(e)).join('')}
        </div>
        ${this.renderHand(hand)}
      </div>
    `;
  }
}
