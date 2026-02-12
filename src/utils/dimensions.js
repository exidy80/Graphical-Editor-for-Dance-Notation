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
  VISUAL_CENTER_Y: -200,
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
  quarterCurvedLine: { width: 75, height: 20 },
  halfCurvedLine: { width: 75, height: 20 },
  signal: { width: 75, height: 20 },
  spinTwo: { width: 60, height: 60 },
  spinOneAndHalf: { width: 60, height: 60 },
  spinOne: { width: 60, height: 60 },
  spinHalf: { width: 40, height: 40 },
  spinQuarter: { width: 40, height: 40 },
  overhead: { width: 10, height: 10 },
  shoulder: { width: 10, height: 10 },
  waist: { width: 12, height: 2 },
  hip: { width: 6, height: 6 },
  knee: { width: 6, height: 6 },
  image: { width: 60, height: 60 }, // Images scaled to 0.3 by default in Symbols.js
  stageX: { width: 20, height: 20 },
  stageNext: { width: 20, height: 20 },
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
const DEFAULT_PANEL_SIZE = { width: 300, height: 300 };
const CANVAS_SIZE = { width: 600, height: 600 }; // Fixed canvas size that panels are viewports into
const PANEL_NOTES_HEIGHT = 50;
const PANEL_VISUAL_CENTER = {
  x: CANVAS_SIZE.width / 2,
  y: (CANVAS_SIZE.height - PANEL_NOTES_HEIGHT) / 2,
};

export const UI_DIMENSIONS = {
  DEFAULT_PANEL_SIZE,
  CANVAS_SIZE,
  PANEL_NOTES_HEIGHT,
  PANEL_VISUAL_CENTER,
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
