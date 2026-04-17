// Shape type constants to avoid magic strings throughout the codebase

// Stage markers
export const STAGE_X = 'stageX';
export const STAGE_NEXT = 'stageNext';
export const STAGE_CENTER = 'stageCenter';

// Spin types (two full rotations)
export const SPIN_TWO_CW = 'spinTwoCW';
export const SPIN_TWO_CCW = 'spinTwoCCW';

// Spin types (one and a half rotations)
export const SPIN_ONE_AND_HALF_CW = 'spinOneAndHalfCW';
export const SPIN_ONE_AND_HALF_CCW = 'spinOneAndHalfCCW';

// Spin types (one rotation)
export const SPIN_ONE_CW = 'spinOneCW';
export const SPIN_ONE_CCW = 'spinOneCCW';

// Spin types (half rotation)
export const SPIN_HALF_CW = 'spinHalfCW';
export const SPIN_HALF_CCW = 'spinHalfCCW';

// Spin types (quarter rotation)
export const SPIN_QUARTER_CW = 'spinQuarterCW';
export const SPIN_QUARTER_CCW = 'spinQuarterCCW';

// Lines
export const STRAIGHT_LINE_UP = 'straightLineUp';
export const STRAIGHT_LINE_DOWN = 'straightLineDown';
export const TWO_THIRDS_STRAIGHT_LINE_UP = 'twoThirdsStraightLineUp';
export const TWO_THIRDS_STRAIGHT_LINE_DOWN = 'twoThirdsStraightLineDown';
export const ONE_THIRD_STRAIGHT_LINE_UP = 'oneThirdStraightLineUp';
export const ONE_THIRD_STRAIGHT_LINE_DOWN = 'oneThirdStraightLineDown';

// Curved lines (quarter)
export const QUARTER_CURVED_LINE_UP = 'quarterCurvedLineUp';
export const QUARTER_CURVED_LINE_DOWN = 'quarterCurvedLineDown';

// Curved lines (half)
export const HALF_CURVED_LINE_UP = 'halfCurvedLineUp';
export const HALF_CURVED_LINE_DOWN = 'halfCurvedLineDown';

// Directions and signals
export const DIRECTION_UP = 'directionUp';
export const DIRECTION_DOWN = 'directionDown';

// Basic shapes
export const BLOCK = 'block';
export const IMAGE = 'image';

// Hand signals
export const SPLIT_HANDS = 'splitHands';
export const LINK_HANDS = 'linkHands';
export const HASH_SIGN = 'hashSign';
export const ASTERISK_SIGN = 'asteriskSign';

// Elevation markers
export const KNEE = 'knee';
export const HIP = 'hip';
export const WAIST = 'waist';
export const SHOULDER = 'shoulder';
export const OVERHEAD = 'overhead';

// Factory functions for creating stage marker shapes
// These ensure consistency across all parts of the application
export const createStageX = (x = 147, y = 127) => ({
  type: STAGE_X,
  x,
  y,
  width: 20,
  height: 20,
  draggable: true,
  text: 'O',
  fontSize: 20,
  fill: 'black',
});

export const createStageNext = (x = 147, y = 127) => ({
  type: STAGE_NEXT,
  x,
  y,
  width: 20,
  height: 20,
  draggable: true,
  text: '+',
  fontSize: 24,
  fill: 'black',
});

export const createStageCenter = (x = 147, y = 127) => ({
  type: STAGE_CENTER,
  x,
  y,
  radius: 5,
  draggable: false,
  fill: 'green',
});
