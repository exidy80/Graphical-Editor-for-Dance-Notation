// Centralized dimension definitions for consistent object sizing across the application

// Dancer dimensions (should match Dancer.js)
export const DANCER_DIMENSIONS = {
  HEAD_SIZE: 30,
  BODY_WIDTH: 60,
  BODY_HEIGHT: 5,
  TOTAL_HEIGHT: 75, // headSize + bodyHeight + 40 (extra space for hand positions)
  // Actual visual center calculation based on dancer layout:
  // Head triangle: -15px to +15px, Body rectangle: +7.5px to +12.5px
  // Visual center: (-15 + 12.5) / 2 = -1.25px
  VISUAL_CENTER_Y: -1.25,
};

// Hand selector dimensions
export const HAND_DIMENSIONS = {
  WIDTH: 15,
  HEIGHT: 5,
};

// Arm thickness options
export const ARM_THICKNESS = {
  THIN: 2,
  THICK: 5,
  HIT_STROKE_WIDTH: 10,
};

// Shape base dimensions (should match Symbols.js)
export const SHAPE_DIMENSIONS = {
  straightLine: { width: 75, height: 20 },
  curvedLine: { width: 75, height: 20 },
  signal: { width: 75, height: 20 },
  spinThree: { width: 60, height: 60 },
  spinTwo: { width: 60, height: 60 },
  spinOne: { width: 60, height: 60 },
  spinHalf: { width: 40, height: 40 },
  spinQuarter: { width: 40, height: 40 },
  knee: { width: 6, height: 6 },
  waist: { width: 12, height: 2 },
  shoulder: { width: 12, height: 6 },
  overhead: { width: 10, height: 10 },
  image: { width: 60, height: 60 }, // Images scaled to 0.3 by default in Symbols.js
  stageX: { width: 20, height: 20 },
  default: { width: 50, height: 50 },
};

// Style constants for shapes
export const SHAPE_STYLE = {
  POINTER_WIDTH: 5,
  STROKE_WIDTH_THIN: 2,
  STROKE_WIDTH_THICK: 3,
  HIT_STROKE_WIDTH: 10,
  IMAGE_SCALE_FACTOR: 0.3,
};

// Panel and UI dimensions
export const UI_DIMENSIONS = {
  DEFAULT_PANEL_SIZE: { width: 300, height: 300 },
  MIN_TRANSFORM_SIZE: 5, // Minimum width/height for transforms
};

/**
 * Get the actual dimensions of an object including scale factors
 * @param {Object} object - The dancer or shape object
 * @param {string} objectType - 'dancer' or 'shape'
 * @returns {Object} {width, height} - Actual scaled dimensions
 */
export const getActualDimensions = (object, objectType) => {
  const scaleX = object.scaleX || 1;
  const scaleY = object.scaleY || 1;

  if (objectType === 'dancer') {
    return {
      width: DANCER_DIMENSIONS.BODY_WIDTH * scaleX,
      height: DANCER_DIMENSIONS.TOTAL_HEIGHT * scaleY,
    };
  } else {
    // For shapes, get base dimensions and apply scale
    const baseDimensions =
      SHAPE_DIMENSIONS[object.type] || SHAPE_DIMENSIONS.default;
    return {
      width: baseDimensions.width * scaleX,
      height: baseDimensions.height * scaleY,
    };
  }
};

/**
 * Calculate the center offset for an object (distance from top-left corner to center)
 * @param {Object} object - The dancer or shape object
 * @param {string} objectType - 'dancer' or 'shape'
 * @returns {Object} {offsetX, offsetY} - Offset to center
 */
export const getCenterOffset = (object, objectType) => {
  const { width, height } = getActualDimensions(object, objectType);

  if (objectType === 'dancer') {
    // For dancers, use the actual visual center based on head+body layout
    const scaleY = object.scaleY || 1;
    return {
      offsetX: width / 2,
      offsetY: DANCER_DIMENSIONS.VISUAL_CENTER_Y * scaleY,
    };
  } else {
    // For shapes, use standard geometric center
    return {
      offsetX: width / 2,
      offsetY: height / 2,
    };
  }
};
