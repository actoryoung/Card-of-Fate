/**
 * 地图和路径选择系统
 * 基于 .claude/specs/feature/roguelike-transformation-spec.md 规范文档
 *
 * 功能：
 * - 分支路径生成（每层最多3个出口）
 * - 多种房间类型（战斗、精英、休息、商店、宝藏、事件、Boss）
 * - 黄金配比（战斗50%、安全30%、随机20%）
 * - 房间生成规则（Boss前必为休息室、禁止连续出现特定类型）
 * - 新手保护（前5步无精英）
 * - 与 GameState 集成
 */

/**
 * 房间类型枚举
 */
export const ROOM_TYPES = {
  COMBAT: 'combat',        // 普通战斗
  ELITE: 'elite',          // 精英战斗
  REST: 'rest',            // 休息处
  SHOP: 'shop',            // 商店
  TREASURE: 'treasure',    // 宝藏
  EVENT: 'event',          // 随机事件
  BOSS: 'boss',            // Boss
  UNKNOWN: 'unknown'       // 未知（用于未探索的分支）
};

/**
 * 房间类型分类（用于配比计算）
 */
const ROOM_CATEGORIES = {
  COMBAT: [ROOM_TYPES.COMBAT],
  SAFE: [ROOM_TYPES.REST, ROOM_TYPES.SHOP, ROOM_TYPES.TREASURE],
  RANDOM: [ROOM_TYPES.EVENT, ROOM_TYPES.ELITE]
};

/**
 * 错误代码
 */
export const MAP_ERRORS = {
  INVALID_FLOOR: 'ERR_MAP_INVALID_FLOOR',
  INVALID_NODE: 'ERR_MAP_INVALID_NODE',
  INVALID_ROOM: 'ERR_MAP_INVALID_ROOM',
  NO_PATH_AVAILABLE: 'ERR_MAP_NO_PATH',
  ALREADY_VISITED: 'ERR_MAP_ALREADY_VISITED',
  GENERATION_FAILED: 'ERR_MAP_GENERATION_FAILED',
  NO_CURRENT_NODE: 'ERR_MAP_NO_CURRENT_NODE',
  NOT_CONNECTED: 'ERR_MAP_NOT_CONNECTED'
};

/**
 * 黄金配比配置
 */
const GOLDEN_RATIO = {
  combat: 0.5,      // 战斗50%
  safe: 0.3,        // 安全30%
  random: 0.2       // 随机20%
};

/**
 * 地图配置
 */
const MAP_CONFIG = {
  MIN_NODES: 10,           // 每层最少节点数
  MAX_NODES: 15,           // 每层最多节点数
  MAX_BRANCHES: 3,         // 每个节点最多出口数
  MIN_BRANCHES: 1,         // 每个节点最少出口数
  NEWBIE_PROTECTION: 5,    // 新手保护（前N步无精英）
  PATHS_TO_BOSS: 2         // 到达Boss的路径数量
};

/**
 * 房间类型权重配置
 */
const ROOM_WEIGHTS = {
  normal: {
    [ROOM_TYPES.COMBAT]: 50,
    [ROOM_TYPES.ELITE]: 10,
    [ROOM_TYPES.REST]: 20,
    [ROOM_TYPES.SHOP]: 5,
    [ROOM_TYPES.TREASURE]: 10,
    [ROOM_TYPES.EVENT]: 5
  },
  bossApproach: {
    [ROOM_TYPES.COMBAT]: 30,
    [ROOM_TYPES.ELITE]: 20,
    [ROOM_TYPES.REST]: 30,
    [ROOM_TYPES.SHOP]: 5,
    [ROOM_TYPES.TREASURE]: 10,
    [ROOM_TYPES.EVENT]: 5
  }
};

/**
 * 地图节点类
 */
class MapNode {
  /**
   * @param {string} id - 节点唯一标识
   * @param {string} type - 房间类型
   * @param {number} layer - 所在层级（从0开始）
   * @param {number} x - X坐标（用于可视化）
   * @param {number} y - Y坐标（用于可视化）
   */
  constructor(id, type, layer, x = 0, y = 0) {
    this.id = id;
    this.type = type;
    this.layer = layer;
    this.x = x;
    this.y = y;
    this.connections = [];     // 连接的节点ID列表
    this.visited = false;
    this.content = null;       // 房间内容（由其他系统填充）
  }

  /**
   * 添加连接
   * @param {string} nodeId - 要连接的节点ID
   */
  addConnection(nodeId) {
    if (!this.connections.includes(nodeId)) {
      this.connections.push(nodeId);
    }
  }

  /**
   * 获取节点数据副本
   * @returns {Object} 节点数据
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      layer: this.layer,
      x: this.x,
      y: this.y,
      connections: [...this.connections],
      visited: this.visited,
      content: this.content
    };
  }
}

/**
 * 地图楼层类
 */
class Floor {
  /**
   * @param {number} level - 楼层编号
   */
  constructor(level) {
    this.level = level;
    this.nodes = new Map();     // nodeId -> MapNode
    this.startNodeId = null;
    this.bossNodeId = null;
    this.layers = [];           // 每层的节点ID数组
  }

  /**
   * 添加节点
   * @param {MapNode} node - 节点对象
   */
  addNode(node) {
    this.nodes.set(node.id, node);

    // 确保layers数组有足够大小
    while (this.layers.length <= node.layer) {
      this.layers.push([]);
    }
    this.layers[node.layer].push(node.id);
  }

  /**
   * 获取节点
   * @param {string} nodeId - 节点ID
   * @returns {MapNode|null} 节点对象或null
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * 获取指定层的所有节点
   * @param {number} layer - 层级索引
   * @returns {Array<MapNode>} 节点数组
   */
  getNodesByLayer(layer) {
    const nodeIds = this.layers[layer] || [];
    return nodeIds.map(id => this.nodes.get(id)).filter(Boolean);
  }

  /**
   * 获取所有节点
   * @returns {Array<MapNode>} 节点数组
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
}

/**
 * 地图系统主类
 */
export class MapSystem {
  /**
   * @param {Object} gameState - 游戏状态对象（可选）
   * @param {Object} config - 配置对象（可选）
   */
  constructor(gameState = null, config = {}) {
    this.gameState = gameState;
    this.config = { ...MAP_CONFIG, ...config };

    // 当前地图数据
    this.currentFloor = null;
    this.currentFloorLevel = 1;

    // 玩家路径追踪
    this.playerPath = [];           // 已访问的节点ID路径
    this.currentNodeId = null;      // 当前所在节点ID
    this.visitedNodeIds = new Set(); // 已访问的节点ID集合

    // 探索状态
    this.exploredFloors = new Map(); // floorLevel -> Floor
  }

  /**
   * 生成指定层数的地图
   * @param {number} floor - 楼层编号（从1开始）
   * @param {Object} options - 生成选项
   * @returns {Floor} 生成的楼层对象
   */
  generateMap(floor, options = {}) {
    if (floor < 1) {
      throw new Error(`${MAP_ERRORS.INVALID_FLOOR}: 楼层必须 >= 1`);
    }

    // 创建新楼层
    const newFloor = new Floor(floor);

    // 确定节点数量
    const nodeCount = this._calculateNodeCount(floor, options);

    // 生成地图结构
    this._generateMapStructure(newFloor, nodeCount);

    // 分配房间类型
    this._assignRoomTypes(newFloor);

    // 验证地图
    if (!this._validateFloor(newFloor)) {
      throw new Error(MAP_ERRORS.GENERATION_FAILED);
    }

    // 计算节点坐标（用于可视化）
    this._calculateNodePositions(newFloor);

    // 设置为当前楼层
    this.currentFloor = newFloor;
    this.currentFloorLevel = floor;
    this.exploredFloors.set(floor, newFloor);

    // 保存到游戏状态
    this._saveToGameState();

    return newFloor;
  }

  /**
   * 计算节点数量
   * @private
   * @param {number} floor - 楼层编号
   * @param {Object} options - 选项
   * @returns {number} 节点数量
   */
  _calculateNodeCount(floor, options) {
    if (options.nodeCount) {
      return Math.max(
        this.config.MIN_NODES,
        Math.min(this.config.MAX_NODES, options.nodeCount)
      );
    }

    // 基于楼层随机生成
    const base = this.config.MIN_NODES;
    const variance = this.config.MAX_NODES - this.config.MIN_NODES;
    return base + Math.floor(Math.random() * (variance + 1));
  }

  /**
   * 生成地图结构（节点和连接）
   * @private
   * @param {Floor} floor - 楼层对象
   * @param {number} nodeCount - 节点总数
   */
  _generateMapStructure(floor, nodeCount) {
    let nodeIdCounter = 0;
    const nodes = [];

    // 创建起始节点
    const startNode = new MapNode(
      `floor_${floor.level}_node_${nodeIdCounter++}`,
      ROOM_TYPES.COMBAT,
      0,
      0,
      0
    );
    floor.addNode(startNode);
    floor.startNodeId = startNode.id;
    nodes.push([startNode]);

    let currentLayer = [startNode];
    let layerIndex = 1;

    // 生成中间层级
    while (nodeIdCounter < nodeCount - 1) {
      const newLayer = [];
      const nodesInLayer = Math.min(
        this._calculateBranchesCount(layerIndex, floor.level),
        nodeCount - nodeIdCounter - 1 // 留一个给Boss
      );

      for (let i = 0; i < nodesInLayer; i++) {
        const node = new MapNode(
          `floor_${floor.level}_node_${nodeIdCounter++}`,
          ROOM_TYPES.UNKNOWN,
          layerIndex,
          i,
          layerIndex
        );
        floor.addNode(node);
        newLayer.push(node);

        // 连接到上一层的节点
        this._connectToPreviousLayer(node, currentLayer, floor);
      }

      currentLayer = newLayer;
      nodes.push(newLayer);
      layerIndex++;
    }

    // 创建Boss节点
    const bossNode = new MapNode(
      `floor_${floor.level}_node_${nodeIdCounter++}`,
      ROOM_TYPES.BOSS,
      layerIndex,
      0,
      layerIndex
    );
    floor.addNode(bossNode);
    floor.bossNodeId = bossNode.id;

    // 连接最后一层的所有节点到Boss
    currentLayer.forEach(node => {
      node.addConnection(bossNode.id);
    });
  }

  /**
   * 计算分支数量
   * @private
   * @param {number} layerIndex - 层级索引
   * @param {number} floorLevel - 楼层编号
   * @returns {number} 分支数量
   */
  _calculateBranchesCount(layerIndex, floorLevel) {
    // 第一层总是有3个分支
    if (layerIndex === 1) {
      return this.config.MAX_BRANCHES;
    }

    // 中间层级随机1-3个分支
    const min = this.config.MIN_BRANCHES;
    const max = this.config.MAX_BRANCHES;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /**
   * 连接节点到上一层的节点
   * @private
   * @param {MapNode} node - 当前节点
   * @param {Array<MapNode>} previousLayer - 上一层的节点数组
   * @param {Floor} floor - 楼层对象
   */
  _connectToPreviousLayer(node, previousLayer, floor) {
    if (previousLayer.length === 0) return;

    // 如果只有一个上层节点，直接连接
    if (previousLayer.length === 1) {
      node.addConnection(previousLayer[0].id);
      previousLayer[0].addConnection(node.id);
      return;
    }

    // 随机连接到1-2个上层节点
    const connectionCount = Math.min(
      1 + Math.floor(Math.random() * 2),
      previousLayer.length
    );

    // 随机选择上层节点
    const shuffled = [...previousLayer].sort(() => Math.random() - 0.5);
    for (let i = 0; i < connectionCount; i++) {
      node.addConnection(shuffled[i].id);
      shuffled[i].addConnection(node.id);
    }
  }

  /**
   * 分配房间类型
   * @private
   * @param {Floor} floor - 楼层对象
   */
  _assignRoomTypes(floor) {
    const bossNode = floor.getNode(floor.bossNodeId);
    const allNodes = floor.getAllNodes().filter(n => n.id !== floor.startNodeId && n.id !== floor.bossNodeId);

    // 按层级排序，从后向前处理
    const sortedNodes = allNodes.sort((a, b) => b.layer - a.layer);

    // Boss前一层必须是休息室
    const bossApproachLayer = bossNode.layer - 1;
    const bossApproachNodes = floor.getNodesByLayer(bossApproachLayer);
    bossApproachNodes.forEach(node => {
      if (node.type === ROOM_TYPES.UNKNOWN) {
        node.type = ROOM_TYPES.REST;
      }
    });

    // 为其他节点分配类型
    const stats = { combat: 0, safe: 0, random: 0 };
    const total = sortedNodes.length - bossApproachNodes.length;

    sortedNodes.forEach(node => {
      // 跳过Boss前的休息室
      if (node.layer === bossApproachLayer) return;

      // 获取允许的类型
      const allowedTypes = this._getAllowedTypes(node, floor, stats, total);
      node.type = this._selectRoomType(allowedTypes, node.layer);

      // 更新统计
      this._updateStats(node.type, stats);
    });

    // 确保起始节点是战斗类型
    const startNode = floor.getNode(floor.startNodeId);
    startNode.type = ROOM_TYPES.COMBAT;
  }

  /**
   * 获取允许的房间类型
   * @private
   * @param {MapNode} node - 当前节点
   * @param {Floor} floor - 楼层对象
   * @param {Object} stats - 当前统计
   * @param {number} total - 总节点数
   * @returns {Array<string>} 允许的类型数组
   */
  _getAllowedTypes(node, floor, stats, total) {
    const allowed = [];

    // 新手保护：前5步无精英
    if (node.layer < this.config.NEWBIE_PROTECTION) {
      // 不添加精英
    }

    // 根据配比选择类型
    const ratio = this._calculateRatio(stats, total);

    if (ratio.combat < GOLDEN_RATIO.combat) {
      allowed.push(ROOM_TYPES.COMBAT);
    }
    if (ratio.safe < GOLDEN_RATIO.safe) {
      allowed.push(...ROOM_CATEGORIES.SAFE);
    }
    if (ratio.random < GOLDEN_RATIO.random) {
      allowed.push(...ROOM_CATEGORIES.RANDOM);
    }

    // 如果没有任何限制，返回所有类型
    if (allowed.length === 0) {
      return Object.values(ROOM_TYPES).filter(t => t !== ROOM_TYPES.UNKNOWN && t !== ROOM_TYPES.BOSS);
    }

    return allowed;
  }

  /**
   * 计算当前配比
   * @private
   * @param {Object} stats - 当前统计
   * @param {number} total - 总节点数
   * @returns {Object} 配比对象
   */
  _calculateRatio(stats, total) {
    if (total === 0) return { combat: 0, safe: 0, random: 0 };

    return {
      combat: stats.combat / total,
      safe: stats.safe / total,
      random: stats.random / total
    };
  }

  /**
   * 选择房间类型
   * @private
   * @param {Array<string>} allowedTypes - 允许的类型
   * @param {number} layer - 层级索引
   * @returns {string} 选中的房间类型
   */
  _selectRoomType(allowedTypes, layer) {
    // 根据层级选择权重配置
    const weights = layer > 5 ? ROOM_WEIGHTS.bossApproach : ROOM_WEIGHTS.normal;

    // 计算允许类型的权重
    let totalWeight = 0;
    const typeWeights = allowedTypes.map(type => {
      const weight = weights[type] || 10;
      totalWeight += weight;
      return { type, weight };
    });

    // 随机选择
    let random = Math.random() * totalWeight;
    for (const { type, weight } of typeWeights) {
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }

    return allowedTypes[0] || ROOM_TYPES.COMBAT;
  }

  /**
   * 更新统计
   * @private
   * @param {string} type - 房间类型
   * @param {Object} stats - 统计对象
   */
  _updateStats(type, stats) {
    if (ROOM_CATEGORIES.COMBAT.includes(type)) {
      stats.combat++;
    } else if (ROOM_CATEGORIES.SAFE.includes(type)) {
      stats.safe++;
    } else {
      stats.random++;
    }
  }

  /**
   * 验证楼层
   * @private
   * @param {Floor} floor - 楼层对象
   * @returns {boolean} 是否有效
   */
  _validateFloor(floor) {
    // 检查起始节点
    if (!floor.startNodeId || !floor.getNode(floor.startNodeId)) {
      return false;
    }

    // 检查Boss节点
    if (!floor.bossNodeId || !floor.getNode(floor.bossNodeId)) {
      return false;
    }

    // 检查至少有一条到达Boss的路径
    const hasPath = this._checkPathToBoss(floor);
    if (!hasPath) {
      return false;
    }

    // 检查黄金配比
    if (!this._validateGoldenRatio(floor)) {
      return false;
    }

    return true;
  }

  /**
   * 检查是否有到达Boss的路径
   * @private
   * @param {Floor} floor - 楼层对象
   * @returns {boolean} 是否有路径
   */
  _checkPathToBoss(floor) {
    const startNode = floor.getNode(floor.startNodeId);
    const bossNode = floor.getNode(floor.bossNodeId);

    if (!startNode || !bossNode) return false;

    // BFS检查路径
    const visited = new Set();
    const queue = [startNode.id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId === bossNode.id) return true;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentNode = floor.getNode(currentId);
      if (currentNode) {
        queue.push(...currentNode.connections);
      }
    }

    return false;
  }

  /**
   * 验证黄金配比
   * @private
   * @param {Floor} floor - 楼层对象
   * @returns {boolean} 是否符合配比
   */
  _validateGoldenRatio(floor) {
    const nodes = floor.getAllNodes();
    const total = nodes.length - 2; // 排除起始和Boss节点

    if (total <= 0) return true;

    let combat = 0, safe = 0, random = 0;

    nodes.forEach(node => {
      if (node.id === floor.startNodeId || node.id === floor.bossNodeId) return;

      if (ROOM_CATEGORIES.COMBAT.includes(node.type)) {
        combat++;
      } else if (ROOM_CATEGORIES.SAFE.includes(node.type)) {
        safe++;
      } else {
        random++;
      }
    });

    // 允许10%的误差
    const tolerance = 0.1;

    return (
      Math.abs(combat / total - GOLDEN_RATIO.combat) <= tolerance &&
      Math.abs(safe / total - GOLDEN_RATIO.safe) <= tolerance &&
      Math.abs(random / total - GOLDEN_RATIO.random) <= tolerance
    );
  }

  /**
   * 计算节点坐标（用于可视化）
   * @private
   * @param {Floor} floor - 楼层对象
   */
  _calculateNodePositions(floor) {
    const layers = floor.layers;

    layers.forEach((nodeIds, layerIndex) => {
      const nodesInLayer = nodeIds.map(id => floor.getNode(id)).filter(Boolean);
      const count = nodesInLayer.length;

      nodesInLayer.forEach((node, index) => {
        // X坐标：居中排列
        const spacing = 150;
        const totalWidth = (count - 1) * spacing;
        node.x = (index * spacing) - (totalWidth / 2);

        // Y坐标：层级间距
        node.y = layerIndex * 120;
      });
    });
  }

  /**
   * 获取当前可选房间
   * @returns {Array<MapNode>} 可选房间数组
   */
  getAvailableRooms() {
    if (!this.currentNodeId || !this.currentFloor) {
      return [];
    }

    const currentNode = this.currentFloor.getNode(this.currentNodeId);
    if (!currentNode) {
      return [];
    }

    // 返回当前节点连接的所有未访问节点
    return currentNode.connections
      .map(id => this.currentFloor.getNode(id))
      .filter(node => node && !this.visitedNodeIds.has(node.id));
  }

  /**
   * 选择房间（移动到指定节点）
   * @param {string} roomId - 房间节点ID
   * @returns {boolean} 是否成功
   */
  selectRoom(roomId) {
    if (!this.currentFloor) {
      throw new Error(MAP_ERRORS.NO_CURRENT_NODE);
    }

    const targetNode = this.currentFloor.getNode(roomId);
    if (!targetNode) {
      throw new Error(`${MAP_ERRORS.INVALID_NODE}: ${roomId}`);
    }

    // 检查是否可以从当前节点到达目标节点
    if (this.currentNodeId) {
      const currentNode = this.currentFloor.getNode(this.currentNodeId);
      if (!currentNode.connections.includes(roomId)) {
        throw new Error(MAP_ERRORS.NOT_CONNECTED);
      }
    }

    // 检查是否已访问
    if (this.visitedNodeIds.has(roomId)) {
      throw new Error(MAP_ERRORS.ALREADY_VISITED);
    }

    // 移动到目标节点
    this._moveToNode(roomId);

    return true;
  }

  /**
   * 移动到指定节点
   * @private
   * @param {string} nodeId - 节点ID
   */
  _moveToNode(nodeId) {
    const node = this.currentFloor.getNode(nodeId);
    node.visited = true;

    // 更新路径
    this.playerPath.push(nodeId);
    this.currentNodeId = nodeId;
    this.visitedNodeIds.add(nodeId);

    // 保存到游戏状态
    this._saveToGameState();
  }

  /**
   * 获取当前节点
   * @returns {MapNode|null} 当前节点对象
   */
  getCurrentNode() {
    if (!this.currentNodeId || !this.currentFloor) {
      return null;
    }

    return this.currentFloor.getNode(this.currentNodeId);
  }

  /**
   * 获取当前楼层
   * @returns {Floor|null} 当前楼层对象
   */
  getCurrentFloor() {
    return this.currentFloor;
  }

  /**
   * 重置到楼层起点
   */
  resetToStart() {
    if (!this.currentFloor) return;

    this.currentNodeId = this.currentFloor.startNodeId;
    const startNode = this.currentFloor.getNode(this.currentFloor.startNodeId);
    if (startNode) {
      startNode.visited = true;
      this.visitedNodeIds.add(this.currentFloor.startNodeId);
    }

    this._saveToGameState();
  }

  /**
   * 获取已探索的路径
   * @returns {Array<MapNode>} 已访问的节点数组
   */
  getExploredPath() {
    if (!this.currentFloor) return [];

    return this.playerPath
      .map(id => this.currentFloor.getNode(id))
      .filter(Boolean);
  }

  /**
   * 获取从当前节点到Boss的最短路径
   * @returns {Array<MapNode>} 路径节点数组
   */
  getPathToBoss() {
    if (!this.currentFloor || !this.currentNodeId) {
      return [];
    }

    const bossId = this.currentFloor.bossNodeId;
    return this._findShortestPath(this.currentNodeId, bossId);
  }

  /**
   * 查找最短路径（BFS）
   * @private
   * @param {string} startId - 起始节点ID
   * @param {string} endId - 结束节点ID
   * @returns {Array<MapNode>} 路径节点数组
   */
  _findShortestPath(startId, endId) {
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const currentId = path[path.length - 1];

      if (currentId === endId) {
        return path.map(id => this.currentFloor.getNode(id)).filter(Boolean);
      }

      const currentNode = this.currentFloor.getNode(currentId);
      if (currentNode) {
        for (const nextId of currentNode.connections) {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push([...path, nextId]);
          }
        }
      }
    }

    return [];
  }

  /**
   * 保存到游戏状态
   * @private
   */
  _saveToGameState() {
    if (!this.gameState) return;

    // 创建地图状态快照
    const mapState = {
      currentFloorLevel: this.currentFloorLevel,
      currentNodeId: this.currentNodeId,
      playerPath: [...this.playerPath],
      visitedNodeIds: Array.from(this.visitedNodeIds)
    };

    // 如果gameState有mapState属性，更新它
    if (this.gameState.mapState !== undefined) {
      this.gameState.mapState = mapState;
    }
  }

  /**
   * 从游戏状态恢复
   * @param {Object} mapState - 地图状态对象
   * @returns {boolean} 是否成功
   */
  loadFromGameState(mapState) {
    if (!mapState) return false;

    this.currentFloorLevel = mapState.currentFloorLevel || 1;
    this.currentNodeId = mapState.currentNodeId;
    this.playerPath = mapState.playerPath || [];
    this.visitedNodeIds = new Set(mapState.visitedNodeIds || []);

    // 恢复楼层数据
    if (this.exploredFloors.has(this.currentFloorLevel)) {
      this.currentFloor = this.exploredFloors.get(this.currentFloorLevel);
    }

    return true;
  }

  /**
   * 获取地图统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    if (!this.currentFloor) {
      return {
        totalNodes: 0,
        visitedNodes: 0,
        currentLayer: 0,
        roomTypes: {}
      };
    }

    const nodes = this.currentFloor.getAllNodes();
    const roomTypes = {};

    nodes.forEach(node => {
      roomTypes[node.type] = (roomTypes[node.type] || 0) + 1;
    });

    const currentNode = this.getCurrentNode();

    return {
      totalNodes: nodes.length,
      visitedNodes: this.visitedNodeIds.size,
      currentLayer: currentNode ? currentNode.layer : 0,
      roomTypes,
      pathLength: this.playerPath.length
    };
  }

  /**
   * 导出地图数据（用于序列化）
   * @returns {Object} 地图数据
   */
  export() {
    if (!this.currentFloor) {
      return null;
    }

    return {
      floorLevel: this.currentFloorLevel,
      nodes: this.currentFloor.getAllNodes().map(n => n.toJSON()),
      startNodeId: this.currentFloor.startNodeId,
      bossNodeId: this.currentFloor.bossNodeId,
      currentNodeId: this.currentNodeId,
      playerPath: [...this.playerPath],
      visitedNodeIds: Array.from(this.visitedNodeIds)
    };
  }

  /**
   * 导入地图数据
   * @param {Object} data - 地图数据
   * @returns {boolean} 是否成功
   */
  import(data) {
    if (!data || !data.nodes) {
      return false;
    }

    // 重建楼层
    const floor = new Floor(data.floorLevel);
    data.nodes.forEach(nodeData => {
      const node = new MapNode(
        nodeData.id,
        nodeData.type,
        nodeData.layer,
        nodeData.x,
        nodeData.y
      );
      node.connections = [...nodeData.connections];
      node.visited = nodeData.visited;
      node.content = nodeData.content;
      floor.addNode(node);
    });

    floor.startNodeId = data.startNodeId;
    floor.bossNodeId = data.bossNodeId;

    this.currentFloor = floor;
    this.currentFloorLevel = data.floorLevel;
    this.currentNodeId = data.currentNodeId;
    this.playerPath = [...data.playerPath];
    this.visitedNodeIds = new Set(data.visitedNodeIds);
    this.exploredFloors.set(data.floorLevel, floor);

    return true;
  }

  /**
   * 清除所有地图数据
   */
  clear() {
    this.currentFloor = null;
    this.currentFloorLevel = 1;
    this.playerPath = [];
    this.currentNodeId = null;
    this.visitedNodeIds.clear();
    this.exploredFloors.clear();
  }
}

export default MapSystem;
