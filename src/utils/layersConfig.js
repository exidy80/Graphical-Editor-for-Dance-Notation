// utils/layersConfig.js
import { SHAPE_REGISTRY } from '../constants/shapeRegistry';

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

// 3. Shared classifier — derived from the central shape registry.
//    Adding a new shape type no longer requires editing this file.
export function isShapeInCategory(shape, catKey) {
  const entry = SHAPE_REGISTRY[shape.type];
  if (!entry) return false;
  return entry.category === catKey;
}
