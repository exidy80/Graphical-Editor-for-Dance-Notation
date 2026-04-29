import { v4 as uuidv4 } from 'uuid';
import {
  createStageX,
  createStageNext,
  createStageCenter,
} from '../constants/shapeTypes';
import { UI_DIMENSIONS } from '../utils/dimensions';

// Factory function to create initial panels with default dancer positions and shapes
const createInitialPanel = () => {
  const DEFAULT_PANEL_SIZE = UI_DIMENSIONS.DEFAULT_PANEL_SIZE;
  const canvasCenter = UI_DIMENSIONS.CANVAS_CENTER;
  const dancerYOffset = (DEFAULT_PANEL_SIZE.height * 0.6) / 2;

  return {
    id: uuidv4(),
    dancers: [
      {
        id: uuidv4(),
        x: canvasCenter.x,
        y: canvasCenter.y - dancerYOffset,
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
        x: canvasCenter.x,
        y: canvasCenter.y + dancerYOffset,
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
      {
        id: uuidv4(),
        ...createStageCenter(canvasCenter.x, canvasCenter.y),
      },
      {
        id: uuidv4(),
        ...createStageX(canvasCenter.x, canvasCenter.y),
      },
      {
        id: uuidv4(),
        ...createStageNext(canvasCenter.x, canvasCenter.y),
      },
    ],
    locks: [],
    notes: '',
  };
};

export default createInitialPanel;
