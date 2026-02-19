// utils/layersConfig.js
import * as ShapeTypes from '../constants/shapeTypes';

// 1. Master list of categories
export const LAYER_CATEGORIES = [
  { key: 'body', label: 'Body' }, // dancers
  { key: 'movement', label: 'Movement' },
  { key: 'signals', label: 'Signals' },
  { key: 'feet', label: 'Feet' },
  { key: 'location', label: 'Location' },
];

// 2. Convenience: array of just the keys
export const LAYER_KEYS = LAYER_CATEGORIES.map((c) => c.key);
// ['body', 'movement', 'signals', 'feet', 'location']

// 3. Type sets (still only defined here)
const MOVEMENT_TYPES = new Set([
  ShapeTypes.STRAIGHT_LINE,
  ShapeTypes.STRAIGHT_LINE_UP,
  ShapeTypes.STRAIGHT_LINE_DOWN,
  ShapeTypes.QUARTER_CURVED_LINE,
  ShapeTypes.QUARTER_CURVED_LINE_UP,
  ShapeTypes.QUARTER_CURVED_LINE_DOWN,
  ShapeTypes.HALF_CURVED_LINE,
  ShapeTypes.HALF_CURVED_LINE_UP,
  ShapeTypes.HALF_CURVED_LINE_DOWN,
  ShapeTypes.SPIN_TWO,
  ShapeTypes.SPIN_TWO_CW,
  ShapeTypes.SPIN_TWO_CCW,
  ShapeTypes.SPIN_ONE_AND_HALF,
  ShapeTypes.SPIN_ONE_AND_HALF_CW,
  ShapeTypes.SPIN_ONE_AND_HALF_CCW,
  ShapeTypes.SPIN_ONE,
  ShapeTypes.SPIN_ONE_CW,
  ShapeTypes.SPIN_ONE_CCW,
  ShapeTypes.SPIN_HALF,
  ShapeTypes.SPIN_HALF_CW,
  ShapeTypes.SPIN_HALF_CCW,
  ShapeTypes.SPIN_QUARTER,
  ShapeTypes.SPIN_QUARTER_CW,
  ShapeTypes.SPIN_QUARTER_CCW,
]);

const SIGNALS_TYPES = new Set([
  ShapeTypes.SIGNAL,
  ShapeTypes.BLOCK,
  ShapeTypes.SPLIT_HANDS,
  ShapeTypes.LINK_HANDS,
  ShapeTypes.OVERHEAD,
  ShapeTypes.SHOULDER,
  ShapeTypes.WAIST,
  ShapeTypes.HIP,
  ShapeTypes.KNEE,
  ShapeTypes.DIRECTION_UP,
  ShapeTypes.DIRECTION_DOWN,
]);

const FEET_TYPES = new Set([ShapeTypes.IMAGE]);

const LOCATION_TYPES = new Set([
  ShapeTypes.STAGE_X,
  ShapeTypes.STAGE_NEXT,
  ShapeTypes.STAGE_CENTER,
]);

// 4. Shared classifier
export function isShapeInCategory(shape, catKey) {
  switch (catKey) {
    case 'movement':
      return MOVEMENT_TYPES.has(shape.type);
    case 'signals':
      return SIGNALS_TYPES.has(shape.type);
    case 'feet':
      return FEET_TYPES.has(shape.type);
    case 'location':
      return LOCATION_TYPES.has(shape.type);
    default:
      return false;
  }
}
