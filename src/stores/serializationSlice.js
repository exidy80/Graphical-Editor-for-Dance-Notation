import { v4 as uuidv4 } from 'uuid';

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
    const newShapes = shapes.map((shape) => ({
      ...shape,
      id: uuidv4(),
    }));

    // Handle locks array - provide default empty array if null/undefined or not an array
    const locks = Array.isArray(serializedPanel.locks)
      ? serializedPanel.locks
      : [];
    const newLocks = locks.map((lock) => ({
      ...lock,
      id: uuidv4(),
      members: (lock.members || []).map((member) => ({
        ...member,
        dancerId: oldToNew.get(member.dancerId) || member.dancerId,
      })),
    }));

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
