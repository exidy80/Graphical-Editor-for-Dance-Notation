/**
 * Shape Registry — single source of truth for all shape-type metadata.
 *
 * Keys are the exact string values already persisted in saved dance files
 * (as found in constants/shapeTypes.js).  NEVER rename a key — doing so
 * would silently break all saved files that contain that shape type.
 *
 * Adding a new shape type:
 *   1. Add the string constant to shapeTypes.js.
 *   2. Add an entry here with category, renderKind, defaultDimensions, and
 *      renderConfig (null for shapes whose renderer is fully self-contained).
 *   3. Nothing else needs to change — layersConfig, dimensions, and
 *      shapeConfigs all derive from this registry automatically.
 *
 * Fields
 * ──────
 *  category          – which layer the shape belongs to
 *                      ('movement' | 'signals' | 'feet' | 'location')
 *  renderKind        – how Symbols.js renders the shape; determines which
 *                      config export in shapeConfigs.js carries it
 *  defaultDimensions – {width, height} used by getActualDimensions for
 *                      selection-box / bounding-box calculations
 *  renderConfig      – type-specific render arguments passed to the renderer;
 *                      null for shapes whose renderer needs no extra data
 */

import * as ShapeTypes from './shapeTypes';

export const DEFAULT_SHAPE_DIMENSIONS = { width: 50, height: 50 };

export const SHAPE_REGISTRY = {
  // ── Location / stage markers ─────────────────────────────────────────────
  [ShapeTypes.STAGE_X]: {
    category: 'location',
    renderKind: 'stageX',
    defaultDimensions: { width: 20, height: 20 },
    renderConfig: null,
  },
  [ShapeTypes.STAGE_NEXT]: {
    category: 'location',
    renderKind: 'stageNext',
    defaultDimensions: { width: 20, height: 20 },
    renderConfig: null,
  },
  [ShapeTypes.STAGE_CENTER]: {
    category: 'location',
    renderKind: 'stageCenter',
    defaultDimensions: { width: 10, height: 10 },
    renderConfig: null,
  },

  // ── Straight lines — full size (L) ───────────────────────────────────────
  [ShapeTypes.STRAIGHT_LINE]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: { points: [-37.5, 0, 37.5, 0] },
  },
  [ShapeTypes.STRAIGHT_LINE_UP]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 20, height: 75 },
    renderConfig: { points: [0, 37.5, 0, -37.5] },
  },
  [ShapeTypes.STRAIGHT_LINE_DOWN]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 20, height: 75 },
    renderConfig: { points: [0, -37.5, 0, 37.5] },
  },

  // ── Straight lines — two-thirds size (M) ─────────────────────────────────
  [ShapeTypes.TWO_THIRDS_STRAIGHT_LINE]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 50, height: 20 },
    renderConfig: { points: [-25, 0, 25, 0] },
  },
  [ShapeTypes.TWO_THIRDS_STRAIGHT_LINE_UP]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 20, height: 50 },
    renderConfig: { points: [0, 25, 0, -25] },
  },
  [ShapeTypes.TWO_THIRDS_STRAIGHT_LINE_DOWN]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 20, height: 50 },
    renderConfig: { points: [0, -25, 0, 25] },
  },

  // ── Straight lines — one-third size (S) ──────────────────────────────────
  [ShapeTypes.ONE_THIRD_STRAIGHT_LINE]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 25, height: 20 },
    renderConfig: { points: [-12.5, 0, 12.5, 0] },
  },
  [ShapeTypes.ONE_THIRD_STRAIGHT_LINE_UP]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 20, height: 25 },
    renderConfig: { points: [0, 12.5, 0, -12.5] },
  },
  [ShapeTypes.ONE_THIRD_STRAIGHT_LINE_DOWN]: {
    category: 'movement',
    renderKind: 'straightLine',
    defaultDimensions: { width: 20, height: 25 },
    renderConfig: { points: [0, -12.5, 0, 12.5] },
  },

  // ── Curved lines — quarter turn ───────────────────────────────────────────
  [ShapeTypes.QUARTER_CURVED_LINE]: {
    category: 'movement',
    renderKind: 'curvedLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: {
      numPoints: 3,
      radiusIncrement: 30,
      angleIncrement: Math.PI / 14,
      startAngle: 0,
    },
  },
  [ShapeTypes.QUARTER_CURVED_LINE_UP]: {
    category: 'movement',
    renderKind: 'curvedLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: {
      numPoints: 3,
      radiusIncrement: 30,
      angleIncrement: Math.PI / 14,
      startAngle: -Math.PI / 2,
    },
  },
  [ShapeTypes.QUARTER_CURVED_LINE_DOWN]: {
    category: 'movement',
    renderKind: 'curvedLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: {
      numPoints: 3,
      radiusIncrement: 30,
      angleIncrement: -Math.PI / 14,
      startAngle: Math.PI / 2,
    },
  },

  // ── Curved lines — half turn ──────────────────────────────────────────────
  [ShapeTypes.HALF_CURVED_LINE]: {
    category: 'movement',
    renderKind: 'curvedLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: {
      numPoints: 6,
      radiusIncrement: 30,
      angleIncrement: Math.PI / 5,
      startAngle: 0,
      pattern: 'arc',
    },
  },
  [ShapeTypes.HALF_CURVED_LINE_UP]: {
    category: 'movement',
    renderKind: 'curvedLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: {
      numPoints: 6,
      radiusIncrement: 30,
      angleIncrement: Math.PI / 5,
      startAngle: Math.PI / 2,
      pattern: 'arc',
    },
  },
  [ShapeTypes.HALF_CURVED_LINE_DOWN]: {
    category: 'movement',
    renderKind: 'curvedLine',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: {
      numPoints: 6,
      radiusIncrement: 30,
      angleIncrement: -Math.PI / 5,
      startAngle: -Math.PI / 2,
      pattern: 'arc',
    },
  },

  // ── Spins — two full rotations ────────────────────────────────────────────
  [ShapeTypes.SPIN_TWO]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 30,
      radiusIncrement: 1,
      angleIncrement: Math.PI / 6,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_TWO_CW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 30,
      radiusIncrement: 1,
      angleIncrement: Math.PI / 6,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_TWO_CCW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 30,
      radiusIncrement: 1,
      angleIncrement: Math.PI / 6,
      direction: 'ccw',
    },
  },

  // ── Spins — one and a half rotations ─────────────────────────────────────
  [ShapeTypes.SPIN_ONE_AND_HALF]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 20,
      radiusIncrement: 1,
      angleIncrement: Math.PI / 6,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_ONE_AND_HALF_CW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 20,
      radiusIncrement: 1,
      angleIncrement: Math.PI / 6,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_ONE_AND_HALF_CCW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 20,
      radiusIncrement: 1,
      angleIncrement: Math.PI / 6,
      direction: 'ccw',
    },
  },

  // ── Spins — one full rotation ─────────────────────────────────────────────
  [ShapeTypes.SPIN_ONE]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 36,
      radiusIncrement: 25,
      angleIncrement: Math.PI / 18,
      pattern: 'circle',
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_ONE_CW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 36,
      radiusIncrement: 25,
      angleIncrement: Math.PI / 18,
      pattern: 'circle',
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_ONE_CCW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 60, height: 60 },
    renderConfig: {
      numPoints: 36,
      radiusIncrement: 25,
      angleIncrement: Math.PI / 18,
      pattern: 'circle',
      direction: 'ccw',
    },
  },

  // ── Spins — half rotation ─────────────────────────────────────────────────
  [ShapeTypes.SPIN_HALF]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 40, height: 40 },
    renderConfig: {
      numPoints: 12,
      radiusIncrement: 2,
      angleIncrement: Math.PI / 17,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_HALF_CW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 40, height: 40 },
    renderConfig: {
      numPoints: 12,
      radiusIncrement: 2,
      angleIncrement: Math.PI / 17,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_HALF_CCW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 40, height: 40 },
    renderConfig: {
      numPoints: 12,
      radiusIncrement: 2,
      angleIncrement: Math.PI / 17,
      direction: 'ccw',
    },
  },

  // ── Spins — quarter rotation ──────────────────────────────────────────────
  [ShapeTypes.SPIN_QUARTER]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 40, height: 40 },
    renderConfig: {
      numPoints: 8,
      radiusIncrement: 2,
      angleIncrement: Math.PI / 20,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_QUARTER_CW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 40, height: 40 },
    renderConfig: {
      numPoints: 8,
      radiusIncrement: 2,
      angleIncrement: Math.PI / 20,
      direction: 'cw',
    },
  },
  [ShapeTypes.SPIN_QUARTER_CCW]: {
    category: 'movement',
    renderKind: 'spin',
    defaultDimensions: { width: 40, height: 40 },
    renderConfig: {
      numPoints: 8,
      radiusIncrement: 2,
      angleIncrement: Math.PI / 20,
      direction: 'ccw',
    },
  },

  // ── Direction signals ─────────────────────────────────────────────────────
  [ShapeTypes.SIGNAL]: {
    category: 'signals',
    renderKind: 'direction',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: { points: [10, 10, 30, 10] },
  },
  [ShapeTypes.DIRECTION_UP]: {
    category: 'signals',
    renderKind: 'direction',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: { points: [10, 30, 10, 10] },
  },
  [ShapeTypes.DIRECTION_DOWN]: {
    category: 'signals',
    renderKind: 'direction',
    defaultDimensions: { width: 75, height: 20 },
    renderConfig: { points: [10, 10, 10, 30] },
  },

  // ── Hand / interaction signals ────────────────────────────────────────────
  [ShapeTypes.BLOCK]: {
    category: 'signals',
    renderKind: 'block',
    defaultDimensions: { width: 10, height: 10 },
    renderConfig: null,
  },
  [ShapeTypes.SPLIT_HANDS]: {
    category: 'signals',
    renderKind: 'splitHands',
    defaultDimensions: DEFAULT_SHAPE_DIMENSIONS,
    renderConfig: null,
  },
  [ShapeTypes.LINK_HANDS]: {
    category: 'signals',
    renderKind: 'linkHands',
    defaultDimensions: DEFAULT_SHAPE_DIMENSIONS,
    renderConfig: null,
  },

  // ── Elevation markers ─────────────────────────────────────────────────────
  [ShapeTypes.OVERHEAD]: {
    category: 'signals',
    renderKind: 'overhead',
    defaultDimensions: { width: 10, height: 10 },
    renderConfig: null,
  },
  [ShapeTypes.SHOULDER]: {
    category: 'signals',
    renderKind: 'shoulder',
    defaultDimensions: { width: 10, height: 10 },
    renderConfig: null,
  },
  [ShapeTypes.WAIST]: {
    category: 'signals',
    renderKind: 'waist',
    defaultDimensions: { width: 12, height: 2 },
    renderConfig: null,
  },
  [ShapeTypes.HIP]: {
    category: 'signals',
    renderKind: 'hip',
    defaultDimensions: { width: 6, height: 6 },
    renderConfig: null,
  },
  [ShapeTypes.KNEE]: {
    category: 'signals',
    renderKind: 'knee',
    defaultDimensions: { width: 6, height: 6 },
    renderConfig: null,
  },

  // ── Feet ──────────────────────────────────────────────────────────────────
  [ShapeTypes.IMAGE]: {
    category: 'feet',
    renderKind: 'image',
    defaultDimensions: { width: 96, height: 137 },
    renderConfig: null,
  },
};
