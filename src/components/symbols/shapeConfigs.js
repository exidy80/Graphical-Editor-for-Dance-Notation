import * as ShapeTypes from '../../constants/shapeTypes';

// Configuration for spin symbols
export const SPIN_CONFIGS = {
  [ShapeTypes.SPIN_TWO]: {
    numPoints: 30,
    radiusIncrement: 1,
    angleIncrement: Math.PI / 6,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_TWO_CW]: {
    numPoints: 30,
    radiusIncrement: 1,
    angleIncrement: Math.PI / 6,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_TWO_CCW]: {
    numPoints: 30,
    radiusIncrement: 1,
    angleIncrement: Math.PI / 6,
    scaleX: -1,
  },

  [ShapeTypes.SPIN_ONE_AND_HALF]: {
    numPoints: 20,
    radiusIncrement: 1,
    angleIncrement: Math.PI / 6,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_ONE_AND_HALF_CW]: {
    numPoints: 20,
    radiusIncrement: 1,
    angleIncrement: Math.PI / 6,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_ONE_AND_HALF_CCW]: {
    numPoints: 20,
    radiusIncrement: 1,
    angleIncrement: Math.PI / 6,
    scaleX: -1,
  },

  [ShapeTypes.SPIN_ONE]: {
    numPoints: 36,
    radiusIncrement: 25,
    angleIncrement: Math.PI / 18,
    pattern: 'circle',
    scaleX: 1,
  },
  [ShapeTypes.SPIN_ONE_CW]: {
    numPoints: 36,
    radiusIncrement: 25,
    angleIncrement: Math.PI / 18,
    pattern: 'circle',
    scaleX: 1,
  },
  [ShapeTypes.SPIN_ONE_CCW]: {
    numPoints: 36,
    radiusIncrement: 25,
    angleIncrement: Math.PI / 18,
    pattern: 'circle',
    scaleX: -1,
  },

  [ShapeTypes.SPIN_HALF]: {
    numPoints: 12,
    radiusIncrement: 2,
    angleIncrement: Math.PI / 17,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_HALF_CW]: {
    numPoints: 12,
    radiusIncrement: 2,
    angleIncrement: Math.PI / 17,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_HALF_CCW]: {
    numPoints: 12,
    radiusIncrement: 2,
    angleIncrement: Math.PI / 17,
    scaleX: -1,
  },

  [ShapeTypes.SPIN_QUARTER]: {
    numPoints: 8,
    radiusIncrement: 2,
    angleIncrement: Math.PI / 20,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_QUARTER_CW]: {
    numPoints: 8,
    radiusIncrement: 2,
    angleIncrement: Math.PI / 20,
    scaleX: 1,
  },
  [ShapeTypes.SPIN_QUARTER_CCW]: {
    numPoints: 8,
    radiusIncrement: 2,
    angleIncrement: Math.PI / 20,
    scaleX: -1,
  },
};

// Configuration for curved line symbols
export const CURVED_LINE_CONFIGS = {
  [ShapeTypes.QUARTER_CURVED_LINE]: {
    numPoints: 3,
    radiusIncrement: 30,
    angleIncrement: Math.PI / 14,
    startAngle: 0,
  },
  [ShapeTypes.QUARTER_CURVED_LINE_UP]: {
    numPoints: 3,
    radiusIncrement: 30,
    angleIncrement: Math.PI / 14,
    startAngle: -Math.PI / 2,
  },
  [ShapeTypes.QUARTER_CURVED_LINE_DOWN]: {
    numPoints: 3,
    radiusIncrement: 30,
    angleIncrement: -Math.PI / 14,
    startAngle: Math.PI / 2,
  },

  [ShapeTypes.HALF_CURVED_LINE]: {
    numPoints: 6,
    radiusIncrement: 30,
    angleIncrement: Math.PI / 5,
    startAngle: 0,
    pattern: 'arc',
  },
  [ShapeTypes.HALF_CURVED_LINE_UP]: {
    numPoints: 6,
    radiusIncrement: 30,
    angleIncrement: Math.PI / 5,
    startAngle: Math.PI / 2,
    pattern: 'arc',
  },
  [ShapeTypes.HALF_CURVED_LINE_DOWN]: {
    numPoints: 6,
    radiusIncrement: 30,
    angleIncrement: -Math.PI / 5,
    startAngle: -Math.PI / 2,
    pattern: 'arc',
  },
};

// Configuration for straight line arrows
export const STRAIGHT_LINE_CONFIGS = {
  [ShapeTypes.STRAIGHT_LINE]: { points: [-37.5, 0, 37.5, 0] },
  [ShapeTypes.STRAIGHT_LINE_UP]: { points: [0, 37.5, 0, -37.5] },
  [ShapeTypes.STRAIGHT_LINE_DOWN]: { points: [0, -37.5, 0, 37.5] },
};

// Configuration for direction arrows
export const DIRECTION_CONFIGS = {
  [ShapeTypes.SIGNAL]: { points: [10, 10, 30, 10] },
  [ShapeTypes.DIRECTION_UP]: { points: [10, 30, 10, 10] },
  [ShapeTypes.DIRECTION_DOWN]: { points: [10, 10, 10, 30] },
};
