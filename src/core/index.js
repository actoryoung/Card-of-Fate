/**
 * Entry point for the core module
 * Exports all main classes
 */

export { CardManager } from './CardManager.js';
export { RelicManager, RELIC_RARITY, RELIC_POOL, TRIGGER_TIMING, EFFECT_TYPES } from './RelicManager.js';
export {
  IntentSystem,
  INTENT_TYPES,
  DEFAULT_INTENT_ICONS,
  INTENT_COLORS,
  EFFECT_NAMES as INTENT_EFFECT_NAMES,
  ERROR_CODES as INTENT_ERROR_CODES
} from './IntentSystem.js';
export { default as StatusEffects, STATUS_TYPES, ERROR_CODES as STATUS_ERROR_CODES } from './StatusEffects.js';
export {
  MapSystem,
  ROOM_TYPES,
  MAP_ERRORS,
  GOLDEN_RATIO,
  MAP_CONFIG
} from './MapSystem.js';
export {
  ShopSystem,
  SHOP_ERROR_CODES,
  SHOP_PRODUCT_TYPES
} from './ShopSystem.js';
export {
  EventSystem,
  EVENT_TYPES,
  EVENT_RARITY,
  CONSEQUENCE_TYPES,
  ERROR_CODES as EVENT_ERROR_CODES
} from './EventSystem.js';
export {
  ProgressionSystem,
  PROGRESSION_ERROR_CODES,
  DEFAULT_CONFIG as PROGRESSION_DEFAULT_CONFIG
} from './ProgressionSystem.js';
export {
  CharacterSystem,
  CHARACTER_IDS,
  CHARACTER_COLORS,
  UNLOCK_CONDITIONS,
  CHARACTER_ERRORS,
  DEFAULT_CHARACTERS
} from './CharacterSystem.js';
export {
  MetaProgressionSystem,
  ACHIEVEMENT_TYPES,
  ACHIEVEMENT_RARITY,
  UNLOCK_TYPES,
  STORAGE_KEYS as META_STORAGE_KEYS,
  ERROR_CODES as META_ERROR_CODES,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_CHARACTERS as META_DEFAULT_CHARACTERS
} from './MetaProgressionSystem.js';