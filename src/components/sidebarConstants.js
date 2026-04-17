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

// Foot symbol metadata (image keys) used by FootworkTab and ContextMenu.
export const footShapeMapping = {
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
};

// Map the feet types to left or right
export const feetButtonMapping = {
  Basic: { [SIDES.LEFT]: 'Left Foot Basic', [SIDES.RIGHT]: 'Right Foot Basic' },
  Heel: { [SIDES.LEFT]: 'Left Heel', [SIDES.RIGHT]: 'Right Heel' },
  Ball: { [SIDES.LEFT]: 'Left Ball', [SIDES.RIGHT]: 'Right Ball' },
  Whole: { [SIDES.LEFT]: 'Whole Left', [SIDES.RIGHT]: 'Whole Right' },
  Hover: { [SIDES.LEFT]: 'Hov Left', [SIDES.RIGHT]: 'Hov Right' },
};
