import * as ShapeTypes from '../constants/shapeTypes';

// Color constants
export const COLORS = {
  RED: 'red',
  BLUE: 'blue',
};

// Side constants
export const SIDES = {
  LEFT: 'left',
  RIGHT: 'right',
};

// Map the shapes to their types
export const shapeMapping = {
  'Straight Line': { type: ShapeTypes.STRAIGHT_LINE },
  'Straight Line Up': { type: ShapeTypes.STRAIGHT_LINE_UP },
  'Straight Line Down': { type: ShapeTypes.STRAIGHT_LINE_DOWN },
  'Quarter Curved Line': { type: ShapeTypes.QUARTER_CURVED_LINE },
  'Quarter Curved Line Up': { type: ShapeTypes.QUARTER_CURVED_LINE_UP },
  'Quarter Curved Line Down': { type: ShapeTypes.QUARTER_CURVED_LINE_DOWN },
  'Half Curved Line': { type: ShapeTypes.HALF_CURVED_LINE },
  'Half Curved Line Up': { type: ShapeTypes.HALF_CURVED_LINE_UP },
  'Half Curved Line Down': { type: ShapeTypes.HALF_CURVED_LINE_DOWN },
  '2 Spin': { type: ShapeTypes.SPIN_TWO },
  '2 Spin CW': { type: ShapeTypes.SPIN_TWO_CW },
  '2 Spin CCW': { type: ShapeTypes.SPIN_TWO_CCW },
  '1.5 Spin': { type: ShapeTypes.SPIN_ONE_AND_HALF },
  '1.5 Spin CW': { type: ShapeTypes.SPIN_ONE_AND_HALF_CW },
  '1.5 Spin CCW': { type: ShapeTypes.SPIN_ONE_AND_HALF_CCW },
  '1 Spin': { type: ShapeTypes.SPIN_ONE },
  '1 Spin CW': { type: ShapeTypes.SPIN_ONE_CW },
  '1 Spin CCW': { type: ShapeTypes.SPIN_ONE_CCW },
  'Half Spin': { type: ShapeTypes.SPIN_HALF },
  'Half Spin CW': { type: ShapeTypes.SPIN_HALF_CW },
  'Half Spin CCW': { type: ShapeTypes.SPIN_HALF_CCW },
  'Quarter Spin': { type: ShapeTypes.SPIN_QUARTER },
  'Quarter Spin CW': { type: ShapeTypes.SPIN_QUARTER_CW },
  'Quarter Spin CCW': { type: ShapeTypes.SPIN_QUARTER_CCW },
  Direction: { type: ShapeTypes.SIGNAL },
  'Left Foot Basic': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'leftFootBasicRed',
    imageKeyBlue: 'leftFootBasicBlue',
  },
  'Right Foot Basic': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'rightFootBasicRed',
    imageKeyBlue: 'rightFootBasicBlue',
  },
  'Left Heel': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'leftHeelRed',
    imageKeyBlue: 'leftHeelBlue',
  },
  'Right Heel': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'rightHeelRed',
    imageKeyBlue: 'rightHeelBlue',
  },
  'Left Ball': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'leftBallRed',
    imageKeyBlue: 'leftBallBlue',
  },
  'Right Ball': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'rightBallRed',
    imageKeyBlue: 'rightBallBlue',
  },
  'Whole Left': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'wholeRedLeft',
    imageKeyBlue: 'wholeBlueLeft',
  },
  'Whole Right': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'wholeRedRight',
    imageKeyBlue: 'wholeBlueRight',
  },
  'Hov Left': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'hovRedLeft',
    imageKeyBlue: 'hovBlueLeft',
  },
  'Hov Right': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'hovRedRight',
    imageKeyBlue: 'hovBlueRight',
  },
  'Centre Point': {
    type: ShapeTypes.IMAGE,
    imageKeyRed: 'centrePoint',
    imageKeyBlue: 'centrePoint',
  },
  Overhead: { type: ShapeTypes.OVERHEAD },
  Shoulder: { type: ShapeTypes.SHOULDER },
  Waist: { type: ShapeTypes.WAIST },
  Hip: { type: ShapeTypes.HIP },
  Knee: { type: ShapeTypes.KNEE },
  'Direction Up': { type: ShapeTypes.DIRECTION_UP },
  'Direction Down': { type: ShapeTypes.DIRECTION_DOWN },
  Block: { type: ShapeTypes.BLOCK },
  'Split Hands': { type: ShapeTypes.SPLIT_HANDS },
  'Link Hands': { type: ShapeTypes.LINK_HANDS },
};

// Map the feet types to left or right
export const feetButtonMapping = {
  Basic: { [SIDES.LEFT]: 'Left Foot Basic', [SIDES.RIGHT]: 'Right Foot Basic' },
  Heel: { [SIDES.LEFT]: 'Left Heel', [SIDES.RIGHT]: 'Right Heel' },
  Ball: { [SIDES.LEFT]: 'Left Ball', [SIDES.RIGHT]: 'Right Ball' },
  Whole: { [SIDES.LEFT]: 'Whole Left', [SIDES.RIGHT]: 'Whole Right' },
  Hover: { [SIDES.LEFT]: 'Hov Left', [SIDES.RIGHT]: 'Hov Right' },
};
