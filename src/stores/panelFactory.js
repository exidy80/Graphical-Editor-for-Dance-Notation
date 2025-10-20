import { v4 as uuidv4 } from 'uuid';

// Factory function to create initial panels with default dancer positions and shapes
const createInitialPanel = () => ({
  id: uuidv4(),
  dancers: [
    {
      id: uuidv4(),
      x: 150,
      y: 40,
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
      x: 150,
      y: 220,
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
      type: 'stageX',
      x: 147,
      y: 127,
      width: 20,
      height: 20,
      draggable: true,
      text: 'X',
      fontSize: 20,
      fill: 'black',
    },
  ],
  locks: [],
});

export default createInitialPanel;
