import { v4 as uuidv4 } from 'uuid';
import * as ShapeTypes from '../constants/shapeTypes';
import {
  createStageNext,
  createStageX,
  createStageCenter,
} from '../constants/shapeTypes';

// Serialization slice - handles converting panels to/from JSON for save/load operations
const createSerializationSlice = (set, get) => ({
  serializePanel: (panelId) => {
    const panel = get().panels.find((p) => p.id === panelId);
    if (!panel) return null;

    // Ensure essential arrays exist
    const dancers = panel.dancers || [];
    const shapes = panel.shapes || [];
    const headShapes = panel.headShapes || [];
    const handShapes = panel.handShapes || [];

    return {
      ...panel,
      dancers: dancers.map((dancer, index) => ({
        id: dancer.id,
        x: dancer.x || 0,
        y: dancer.y || 0,
        rotation: dancer.rotation || 0,
        scaleX: dancer.scaleX || 1,
        scaleY: dancer.scaleY || 1,
        colour: dancer.colour || 'red',
        headShape: headShapes[index] || 'Upright',
        handShapes: handShapes[index] || { left: 'Waist', right: 'Waist' },
        leftHandPos: dancer.leftHandPos || { x: -30, y: -40 },
        rightHandPos: dancer.rightHandPos || { x: 30, y: -40 },
        leftElbowPos: dancer.leftElbowPos || { x: -45, y: -12 },
        rightElbowPos: dancer.rightElbowPos || { x: 45, y: -12 },
        leftHandRotation: dancer.leftHandRotation || 0,
        rightHandRotation: dancer.rightHandRotation || 0,
        leftLowerArmThickness: dancer.leftLowerArmThickness || 'thick',
        leftUpperArmThickness: dancer.leftUpperArmThickness || 'thick',
        rightLowerArmThickness: dancer.rightLowerArmThickness || 'thick',
        rightUpperArmThickness: dancer.rightUpperArmThickness || 'thick',
      })),
      shapes: shapes.map((shape) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x || 0,
        y: shape.y || 0,
        width: shape.width,
        height: shape.height,
        radius: shape.radius,
        text: shape.text,
        fontSize: shape.fontSize,
        draggable: shape.draggable !== false, // Default to true unless explicitly false
        rotation: shape.rotation || 0,
        scaleX: shape.scaleX || 1,
        scaleY: shape.scaleY || 1,
        opacity: shape.opacity !== undefined ? shape.opacity : 1,
        stroke: shape.stroke,
        fill: shape.fill,
        imageKey: shape.imageKey,
      })),
      locks: (panel.locks || []).map((lock) => ({
        id: lock.id,
        members: (lock.members || []).map((m) => ({
          dancerId: m.dancerId,
          side: m.side,
        })),
      })),
      // Preserve the original arrays for proper deserialization
      headShapes: headShapes,
      handShapes: handShapes,
    };
  },

  deserializePanel: (serializedPanel) => {
    if (!serializedPanel) {
      return null;
    }

    const oldToNew = new Map();

    // Handle dancers array - provide default empty array if null/undefined or not an array
    const dancers = Array.isArray(serializedPanel.dancers)
      ? serializedPanel.dancers
      : [];
    const newDancers = dancers.map((dancer) => {
      const newId = uuidv4();
      oldToNew.set(dancer.id, newId);
      return { ...dancer, id: newId };
    });

    // Handle shapes array - provide default empty array if null/undefined or not an array
    const shapes = Array.isArray(serializedPanel.shapes)
      ? serializedPanel.shapes
      : [];
    const newShapes = shapes.map((shape) => {
      const newShape = {
        ...shape,
        id: uuidv4(),
        rotation: shape.rotation ?? 0,
        scaleX: shape.scaleX ?? 1,
        scaleY: shape.scaleY ?? 1,
        opacity: shape.opacity ?? 1,
        draggable: shape.draggable !== false,
      };

      // BACKWARD COMPATIBILITY: Add missing properties for stage markers
      // Older saved files may not have text, fontSize, or fill properties on stage markers
      // because these were previously hardcoded in the renderer
      if (shape.type === ShapeTypes.STAGE_X && !shape.text) {
        const defaults = createStageX();
        return {
          ...newShape,
          text: defaults.text,
          fontSize: defaults.fontSize,
          fill: newShape.fill ?? defaults.fill,
        };
      }
      if (shape.type === ShapeTypes.STAGE_NEXT && !shape.text) {
        const defaults = createStageNext();
        return {
          ...newShape,
          text: defaults.text,
          fontSize: defaults.fontSize,
          fill: newShape.fill ?? defaults.fill,
        };
      }
      if (shape.type === ShapeTypes.STAGE_CENTER && !shape.radius) {
        const defaults = createStageCenter();
        return {
          ...newShape,
          radius: defaults.radius,
          fill: defaults.fill,
        };
      }

      return newShape;
    });

    // BACKWARD COMPATIBILITY: Add stageNext if it doesn't exist
    // Older saved files created before stageNext was introduced only had stageX
    // This ensures all panels have both stage markers
    const hasStageNext = newShapes.some(
      (shape) => shape.type === ShapeTypes.STAGE_NEXT,
    );
    if (!hasStageNext) {
      const stageX = newShapes.find(
        (shape) => shape.type === ShapeTypes.STAGE_X,
      );
      if (stageX) {
        // Add stageNext at the same position as stageX
        newShapes.push({
          id: uuidv4(),
          ...createStageNext(stageX.x, stageX.y),
        });
      }
    }

    // BACKWARD COMPATIBILITY: Add stageCenter if it doesn't exist
    // Older saved files created before stageCenter was introduced
    // This ensures all panels have the stageCenter marker
    const hasStageCenter = newShapes.some(
      (shape) => shape.type === ShapeTypes.STAGE_CENTER,
    );
    if (!hasStageCenter) {
      const stageX = newShapes.find(
        (shape) => shape.type === ShapeTypes.STAGE_X,
      );
      if (stageX) {
        // Add stageCenter at the same position as stageX
        // It should be at the beginning of the shapes array to render underneath
        newShapes.unshift({
          id: uuidv4(),
          ...createStageCenter(stageX.x, stageX.y),
        });
      }
    }

    // Handle locks array - provide default empty array if null/undefined or not an array
    const locks = Array.isArray(serializedPanel.locks)
      ? serializedPanel.locks
      : [];
    const dancerIdSet = new Set(newDancers.map((dancer) => dancer.id));
    const newLocks = locks
      .map((lock) => ({
        ...lock,
        id: uuidv4(),
        members: (lock.members || [])
          .map((member) => ({
            ...member,
            dancerId: oldToNew.get(member.dancerId) || member.dancerId,
          }))
          .filter((member) => dancerIdSet.has(member.dancerId)),
      }))
      .filter((lock) => (lock.members || []).length >= 2);

    return {
      ...serializedPanel,
      id: uuidv4(),
      dancers: newDancers,
      shapes: newShapes,
      locks: newLocks,
      headShapes: serializedPanel.headShapes || [],
      handShapes: serializedPanel.handShapes || [],
    };
  },
});

export default createSerializationSlice;
