// Keystroke management slice - handles keyboard shortcuts and key bindings
import { getCenterOffset } from '../utils/dimensions.js';

const createKeystrokeSlice = (set, get) => ({
  // State
  keystrokes: {},

  // Core keystroke management
  registerKeystroke: (key, config) => {
    const {
      description,
      handler,
      context,
      modifiers = {},
      priority = 0,
    } = config;

    // Validate required fields
    if (!description || typeof handler !== 'function' || !context) {
      throw new Error(
        'Keystroke registration requires description, handler function, and context',
      );
    }

    // Create unique key including modifiers AND context
    const keystrokeKey = createKeystrokeKey(key, modifiers, context);

    set((state) => ({
      keystrokes: {
        ...state.keystrokes,
        [keystrokeKey]: {
          originalKey: key,
          description,
          handler,
          context,
          modifiers,
          priority,
        },
      },
    }));
  },

  unregisterKeystroke: (key, modifiers = {}, context = null) => {
    if (context) {
      const keystrokeKey = createKeystrokeKey(key, modifiers, context);
      set((state) => {
        const { [keystrokeKey]: removed, ...remainingKeystrokes } =
          state.keystrokes;
        return { keystrokes: remainingKeystrokes };
      });
    } else {
      // Remove all registrations for this key+modifiers across all contexts
      set((state) => {
        const remainingKeystrokes = {};
        const targetKeyBase = createKeystrokeKey(key, modifiers);
        Object.entries(state.keystrokes).forEach(([k, config]) => {
          if (!k.startsWith(targetKeyBase + ':')) {
            remainingKeystrokes[k] = config;
          }
        });
        return { keystrokes: remainingKeystrokes };
      });
    }
  },

  getRegisteredKeystrokes: () => {
    return get().keystrokes;
  },

  clearAllKeystrokes: () => {
    set({ keystrokes: {} });
  },

  // Context detection
  getCurrentKeystrokeContext: () => {
    const { selectedDancer, selectedHand, selectedShapeId } = get();

    if (selectedHand) return 'hand';
    if (selectedDancer) return 'dancer';
    if (selectedShapeId) return 'symbol';
    return 'none';
  },

  // Keystroke execution
  handleKeystroke: (key, event) => {
    if (!key || !event) return;

    const { keystrokes } = get();
    const currentContext = get().getCurrentKeystrokeContext();

    // Create keystroke key with modifiers
    const modifiers = {
      ctrl: event.ctrlKey || event.metaKey, // Support both Ctrl and Cmd
      shift: event.shiftKey,
      alt: event.altKey,
    };

    // Look for context-specific handler first, then global handler
    const contextKey = createKeystrokeKey(key, modifiers, currentContext);
    const globalKey = createKeystrokeKey(key, modifiers, 'global');

    // Find matching keystrokes
    const matchingKeystrokes = Object.entries(keystrokes)
      .filter(([k, config]) => {
        return k === contextKey || k === globalKey;
      })
      .map(([k, config]) => config)
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    // Execute the highest priority handler
    if (matchingKeystrokes.length > 0) {
      const handler = matchingKeystrokes[0];
      try {
        handler.handler(event, currentContext);
        // Prevent default browser behavior for handled keystrokes
        if (event.preventDefault) {
          event.preventDefault();
        }
      } catch (error) {
        console.warn('Error executing keystroke handler:', error);
      }
    }
  },

  // Configuration
  maintainRotationCenter: true, // Set to false to disable center-maintaining rotation
  rotationStep: 15, // Default rotation step in degrees
  fineRotationStep: 1, // Fine rotation step with modifier keys

  // Helper function to calculate new position that maintains visual center during rotation
  _calculateCenterPreservingPosition: (object, objectType, rotationDegrees) => {
    // This function is kept for potential future use
    // Currently, rotation center is maintained using Konva's offset system

    return {
      x: object.x,
      y: object.y,
    };
  },

  setRotationStep: (step) => {
    set({ rotationStep: step });
  },

  setFineRotationStep: (step) => {
    set({ fineRotationStep: step });
  },

  setMaintainRotationCenter: (maintain) => {
    set({ maintainRotationCenter: maintain });
  },

  // Default keystroke initialization
  initializeDefaultKeystrokes: () => {
    const { registerKeystroke } = get();

    // Left arrow - rotate counter-clockwise
    registerKeystroke('ArrowLeft', {
      description: 'Rotate selection counter-clockwise',
      handler: (event, context) => {
        const { rotationStep, fineRotationStep } = get();
        const step = event.shiftKey ? fineRotationStep : rotationStep;
        get()._rotateSelection(-step);
      },
      context: 'dancer',
      priority: 1,
    });

    registerKeystroke('ArrowLeft', {
      description: 'Rotate selection counter-clockwise',
      handler: (event, context) => {
        const { rotationStep, fineRotationStep } = get();
        const step = event.shiftKey ? fineRotationStep : rotationStep;
        get()._rotateSelection(-step);
      },
      context: 'symbol',
      priority: 1,
    });

    // Right arrow - rotate clockwise
    registerKeystroke('ArrowRight', {
      description: 'Rotate selection clockwise',
      handler: (event, context) => {
        const { rotationStep, fineRotationStep } = get();
        const step = event.shiftKey ? fineRotationStep : rotationStep;
        get()._rotateSelection(step);
      },
      context: 'dancer',
      priority: 1,
    });

    registerKeystroke('ArrowRight', {
      description: 'Rotate selection clockwise',
      handler: (event, context) => {
        const { rotationStep, fineRotationStep } = get();
        const step = event.shiftKey ? fineRotationStep : rotationStep;
        get()._rotateSelection(step);
      },
      context: 'symbol',
      priority: 1,
    });

    // Left arrow with Shift - fine rotation counter-clockwise
    registerKeystroke('ArrowLeft', {
      description: 'Fine rotate selection counter-clockwise',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelection(-fineRotationStep);
      },
      context: 'dancer',
      modifiers: { shift: true },
      priority: 2, // Higher priority than normal arrow keys
    });

    registerKeystroke('ArrowLeft', {
      description: 'Fine rotate selection counter-clockwise',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelection(-fineRotationStep);
      },
      context: 'symbol',
      modifiers: { shift: true },
      priority: 2,
    });

    // Right arrow with Shift - fine rotation clockwise
    registerKeystroke('ArrowRight', {
      description: 'Fine rotate selection clockwise',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelection(fineRotationStep);
      },
      context: 'dancer',
      modifiers: { shift: true },
      priority: 2,
    });

    registerKeystroke('ArrowRight', {
      description: 'Fine rotate selection clockwise',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelection(fineRotationStep);
      },
      context: 'symbol',
      modifiers: { shift: true },
      priority: 2,
    });

    // Delete key configurations - shared between Delete and Backspace
    const deleteKeyConfig = {
      description: 'Delete selected symbol',
      handler: (event, context) => {
        const { selectedShapeId, handleDelete } = get();
        if (selectedShapeId) {
          handleDelete(selectedShapeId);
        }
        // Note: Does nothing if no symbol is selected - dancers cannot be deleted
      },
      context: 'symbol',
      priority: 1,
    };

    // Delete key - remove selected symbol (only works for symbols, not dancers)
    registerKeystroke('Delete', deleteKeyConfig);

    // Backspace key - alternative delete key (common on Mac)
    registerKeystroke('Backspace', deleteKeyConfig);

    // Escape key - deselect everything (global context)
    registerKeystroke('Escape', {
      description: 'Deselect all objects',
      handler: (event, context) => {
        set({ 
          selectedDancer: null,
          selectedHand: null,
          selectedShapeId: null
        });
      },
      context: 'global',
      priority: 1,
    });

    // Space key - toggle rotation center maintenance for selected object
    registerKeystroke(' ', {  // Space key
      description: 'Toggle rotation center maintenance',
      handler: (event, context) => {
        const { maintainRotationCenter, setMaintainRotationCenter } = get();
        setMaintainRotationCenter(!maintainRotationCenter);
        console.log(`Rotation center maintenance: ${!maintainRotationCenter ? 'enabled' : 'disabled'}`);
      },
      context: 'global',
      priority: 1,
    });

    // R key - reset rotation of selected object to original starting rotation
    registerKeystroke('r', {
      description: 'Reset rotation to starting position',
      handler: (event, context) => {
        const { selectedDancer, selectedShapeId, updateDancerState, updateShapeState, panels } = get();
        
        if (selectedDancer) {
          const { panelId, dancerId } = selectedDancer;
          const panel = panels.find(p => p.id === panelId);
          if (panel) {
            const dancer = panel.dancers.find(d => d.id === dancerId);
            if (dancer) {
              // Reset to original starting rotation based on dancer color
              const originalRotation = dancer.colour === 'red' ? 180 : 0;
              updateDancerState(panelId, dancerId, { rotation: originalRotation });
            }
          }
        } else if (selectedShapeId) {
          const { panelId, shapeId } = selectedShapeId;
          // Shapes always reset to 0
          updateShapeState(panelId, shapeId, { rotation: 0 });
        }
      },
      context: 'global',
      priority: 1,
    });
  },

  // Internal rotation helper
  _rotateSelection: (degrees) => {
    const {
      selectedDancer,
      selectedShapeId,
      updateDancerState,
      updateShapeState,
      maintainRotationCenter,
    } = get();

    if (selectedDancer) {
      const { panelId, dancerId } = selectedDancer;
      const panel = get().panels.find((p) => p.id === panelId);
      if (panel) {
        const dancer = panel.dancers.find((d) => d.id === dancerId);
        if (dancer) {
          const currentRotation = dancer.rotation || 0;
          const newRotation = currentRotation + degrees;

          if (maintainRotationCenter) {
            // Use centralized dimension calculation for center-based rotation
            const { offsetX, offsetY } = getCenterOffset(dancer, 'dancer');

            // If this is the first time setting offsets, just set them without adjusting position
            // The offset tells Konva where the rotation point is within the object
            if (dancer.offsetX === undefined && dancer.offsetY === undefined) {
              updateDancerState(panelId, dancerId, {
                rotation: newRotation,
                offsetX: offsetX,
                offsetY: offsetY,
                // DON'T adjust x,y - dancers were working correctly before
              });
            } else {
              // Just update rotation, offsets already set
              updateDancerState(panelId, dancerId, { rotation: newRotation });
            }
          } else {
            // Simple rotation without position adjustment
            updateDancerState(panelId, dancerId, { rotation: newRotation });
          }
        }
      }
    } else if (selectedShapeId) {
      const { panelId, shapeId } = selectedShapeId;
      const panel = get().panels.find((p) => p.id === panelId);
      if (panel) {
        const shape = panel.shapes.find((s) => s.id === shapeId);
        if (shape) {
          const currentRotation = shape.rotation || 0;
          const newRotation = currentRotation + degrees;

          if (maintainRotationCenter) {
            // Use centralized dimension calculation for center-based rotation
            const { offsetX, offsetY } = getCenterOffset(shape, 'shape');

            // If this is the first time setting offsets, we need to adjust position to compensate
            // for the visual shift that occurs when changing the rotation center
            if (shape.offsetX === undefined && shape.offsetY === undefined) {
              // When we set offset for the first time, Konva changes the rotation center
              // from top-left (0,0) to the offset point. To keep the shape visually in the 
              // same place, we need to move the shape's x,y coordinates by the offset amount.
              updateShapeState(panelId, shapeId, {
                rotation: newRotation,
                offsetX: offsetX,
                offsetY: offsetY,
                x: shape.x + offsetX,  // Compensate for offset change
                y: shape.y + offsetY   // Compensate for offset change
              });
            } else {
              // Just update rotation, offsets already set
              updateShapeState(panelId, shapeId, { rotation: newRotation });
            }
          } else {
            // Simple rotation without position adjustment
            updateShapeState(panelId, shapeId, { rotation: newRotation });
          }
        }
      }
    }
  },

  // Help and documentation
  getKeystrokeHelp: () => {
    const { keystrokes } = get();
    return Object.entries(keystrokes)
      .map(([key, config]) => ({
        key: formatKeystrokeDisplay(config.originalKey, config.modifiers),
        description: config.description,
        context: config.context,
        priority: config.priority,
      }))
      .sort(
        (a, b) => a.context.localeCompare(b.context) || b.priority - a.priority,
      );
  },

  // Conflict detection
  detectKeystrokeConflicts: () => {
    const { keystrokes } = get();
    const conflicts = [];
    const contextGroups = {};

    // Group keystrokes by context and key combination
    Object.entries(keystrokes).forEach(([key, config]) => {
      const groupKey = `${config.context}:${config.originalKey}`;
      if (!contextGroups[groupKey]) {
        contextGroups[groupKey] = [];
      }
      contextGroups[groupKey].push({ key, config });
    });

    // Find conflicts (multiple handlers for same key+context)
    Object.entries(contextGroups).forEach(([groupKey, handlers]) => {
      if (handlers.length > 1) {
        const [context, originalKey] = groupKey.split(':');
        conflicts.push({
          key: originalKey,
          context,
          handlers: handlers.map((h) => h.config),
        });
      }
    });

    return conflicts;
  },
});

// Helper function to create unique keystroke keys
const createKeystrokeKey = (key, modifiers = {}, context = null) => {
  const modifierParts = [];
  if (modifiers.ctrl) modifierParts.push('Ctrl');
  if (modifiers.shift) modifierParts.push('Shift');
  if (modifiers.alt) modifierParts.push('Alt');

  let keyString =
    modifierParts.length > 0 ? `${modifierParts.join('+')}+${key}` : key;

  // Include context in the key to make it unique per context
  if (context) {
    keyString += `:${context}`;
  }

  return keyString;
};

// Helper function to format keystroke display
const formatKeystrokeDisplay = (key, modifiers = {}) => {
  const modifierParts = [];
  if (modifiers.ctrl) modifierParts.push('Ctrl');
  if (modifiers.shift) modifierParts.push('Shift');
  if (modifiers.alt) modifierParts.push('Alt');

  const displayKey = key.replace('Arrow', '').replace('Key', '');
  return modifierParts.length > 0
    ? `${modifierParts.join('+')}+${displayKey}`
    : displayKey;
};

export default createKeystrokeSlice;
