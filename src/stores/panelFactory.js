import { v4 as uuidv4 } from 'uuid';
import { createStageX, createStageNext } from '../constants/shapeTypes';
import { UI_DIMENSIONS } from '../utils/dimensions';

// Fixed canvas size - positions are absolute on this canvas
// The panel is a viewport window into this canvas
const CANVAS_SIZE = UI_DIMENSIONS.CANVAS_SIZE;

// Get the store to access current panelSize (not used for positions anymore)
let getStoreState = null;
export const setStoreGetter = (getter) => {
  getStoreState = getter;
};

// Factory function to create initial panels with default dancer positions and shapes
const createInitialPanel = () => {
  // Positions are ALWAYS based on fixed canvas size, regardless of zoom/panel size
  // Original positions were relative to DEFAULT_PANEL_SIZE (300x300)
  // At 100% zoom, viewport shows canvas center (150-450), so add 150 to panel positions
  const DEFAULT_PANEL_SIZE = UI_DIMENSIONS.DEFAULT_PANEL_SIZE;
  const viewportOffset = (CANVAS_SIZE.width - DEFAULT_PANEL_SIZE.width) / 2; // 150

  const canvasCenterX = CANVAS_SIZE.width / 2; // 300
  const topY = DEFAULT_PANEL_SIZE.height * 0.13 + viewportOffset; // 39 + 150 = 189
  const bottomY = DEFAULT_PANEL_SIZE.height * 0.73 + viewportOffset; // 219 + 150 = 369
  const stageMarkersY = DEFAULT_PANEL_SIZE.height * 0.42 + viewportOffset; // 126 + 150 = 276

  return {
    id: uuidv4(),
    dancers: [
      {
        id: uuidv4(),
        x: canvasCenterX,
        y: topY,
        colour: 'red',
        rotation: 180,
        scaleX: 1,
        scaleY: 1,
        leftHandPos: { x: -30, y: -40 },
        rightHandPos: { x: 30, y: -40 },
        leftElbowPos: { x: -45, y: -12 },
        rightElbowPos: { x: 45, y: -12 },
        leftHandRotation: 0,
        rightHandRotation: 0,
        leftUpperArmThickness: 'thick',
        leftLowerArmThickness: 'thick',
        rightUpperArmThickness: 'thick',
        rightLowerArmThickness: 'thick',
      },
      {
        id: uuidv4(),
        x: canvasCenterX,
        y: bottomY,
        colour: 'blue',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        leftHandPos: { x: -30, y: -40 },
        rightHandPos: { x: 30, y: -40 },
        leftElbowPos: { x: -45, y: -12 },
        rightElbowPos: { x: 45, y: -12 },
        leftHandRotation: 0,
        rightHandRotation: 0,
        leftUpperArmThickness: 'thick',
        leftLowerArmThickness: 'thick',
        rightUpperArmThickness: 'thick',
        rightLowerArmThickness: 'thick',
      },
    ],
    headShapes: ['Upright', 'Upright'],
    handShapes: [
      { left: 'Waist', right: 'Waist' },
      { left: 'Waist', right: 'Waist' },
    ],
    shapes: [
      { id: uuidv4(), ...createStageX(canvasCenterX - 3, stageMarkersY) },
      { id: uuidv4(), ...createStageNext(canvasCenterX - 3, stageMarkersY) },
    ],
    locks: [],
    notes: '',
  };
};

export default createInitialPanel;
