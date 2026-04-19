// Keystroke management slice - handles keyboard shortcuts and key bindings

const canvasNodeRegistry = new Map();

const makeRegistryKey = (panelId, itemType, itemId) =>
  `${panelId}:${itemType}:${itemId}`;

const getNodeVisualCenter = (node) => {
  const rect = node.getClientRect();
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
};

const getCenterDeltaInParentSpace = (node, beforeCenter, afterCenter) => {
  const parent = node.getParent?.();
  if (!parent?.getAbsoluteTransform) {
    return {
      x: beforeCenter.x - afterCenter.x,
      y: beforeCenter.y - afterCenter.y,
    };
  }

  const parentTransform = parent.getAbsoluteTransform().copy();
  parentTransform.invert();

  const beforeLocal = parentTransform.point(beforeCenter);
  const afterLocal = parentTransform.point(afterCenter);

  return {
    x: beforeLocal.x - afterLocal.x,
    y: beforeLocal.y - afterLocal.y,
  };
};

const rotatePointAroundPivot = (point, pivot, degrees) => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;

  // Screen-space rotation where positive angles rotate clockwise.
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
};

const getStageDeltaInParentSpace = (
  node,
  beforeStagePoint,
  afterStagePoint,
) => {
  const parent = node.getParent?.();
  if (!parent?.getAbsoluteTransform) {
    return {
      x: afterStagePoint.x - beforeStagePoint.x,
      y: afterStagePoint.y - beforeStagePoint.y,
    };
  }

  const parentTransform = parent.getAbsoluteTransform().copy();
  parentTransform.invert();

  const beforeLocal = parentTransform.point(beforeStagePoint);
  const afterLocal = parentTransform.point(afterStagePoint);

  return {
    x: afterLocal.x - beforeLocal.x,
    y: afterLocal.y - beforeLocal.y,
  };
};

const createKeystrokeSlice = (set, get, api) => ({
  // State
  keystrokes: {},

  // Runtime Konva node registry for keyboard transforms
  registerCanvasNode: (panelId, itemId, itemType, node) => {
    const key = makeRegistryKey(panelId, itemType, itemId);
    if (node) {
      canvasNodeRegistry.set(key, node);
    } else {
      canvasNodeRegistry.delete(key);
    }
  },

  getCanvasNode: (panelId, itemId, itemType) =>
    canvasNodeRegistry.get(makeRegistryKey(panelId, itemType, itemId)),

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
    const { selectedItems, selectedHand } = get();
    if (selectedHand) return 'hand';
    return selectedItems[0]?.type ?? 'none';
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
  rotationStep: 45, // Default rotation step in degrees
  fineRotationStep: 5, // Fine rotation step with modifier keys

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
      context: 'shape',
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
      context: 'shape',
      priority: 1,
    });

    // Option/Alt + arrow keys - rotate multi-selection around shared center
    registerKeystroke('ArrowLeft', {
      description:
        'Rotate multi-selection counter-clockwise around shared center',
      handler: (event, context) => {
        const { rotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(-rotationStep);
      },
      context: 'dancer',
      modifiers: { alt: true },
      priority: 4,
    });

    registerKeystroke('ArrowLeft', {
      description:
        'Rotate multi-selection counter-clockwise around shared center',
      handler: (event, context) => {
        const { rotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(-rotationStep);
      },
      context: 'shape',
      modifiers: { alt: true },
      priority: 4,
    });

    registerKeystroke('ArrowRight', {
      description: 'Rotate multi-selection clockwise around shared center',
      handler: (event, context) => {
        const { rotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(rotationStep);
      },
      context: 'dancer',
      modifiers: { alt: true },
      priority: 4,
    });

    registerKeystroke('ArrowRight', {
      description: 'Rotate multi-selection clockwise around shared center',
      handler: (event, context) => {
        const { rotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(rotationStep);
      },
      context: 'shape',
      modifiers: { alt: true },
      priority: 4,
    });

    // Option/Alt + Ctrl/Cmd + arrow keys - fine group rotation around shared center
    registerKeystroke('ArrowLeft', {
      description:
        'Fine rotate multi-selection counter-clockwise around shared center',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(-fineRotationStep);
      },
      context: 'dancer',
      modifiers: { alt: true, ctrl: true },
      priority: 5,
    });

    registerKeystroke('ArrowLeft', {
      description:
        'Fine rotate multi-selection counter-clockwise around shared center',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(-fineRotationStep);
      },
      context: 'shape',
      modifiers: { alt: true, ctrl: true },
      priority: 5,
    });

    registerKeystroke('ArrowRight', {
      description: 'Fine rotate multi-selection clockwise around shared center',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(fineRotationStep);
      },
      context: 'dancer',
      modifiers: { alt: true, ctrl: true },
      priority: 5,
    });

    registerKeystroke('ArrowRight', {
      description: 'Fine rotate multi-selection clockwise around shared center',
      handler: (event, context) => {
        const { fineRotationStep } = get();
        get()._rotateSelectionAroundSharedCenter(fineRotationStep);
      },
      context: 'shape',
      modifiers: { alt: true, ctrl: true },
      priority: 5,
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
      context: 'shape',
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
      context: 'shape',
      modifiers: { shift: true },
      priority: 2,
    });

    // Ctrl/Cmd + arrow keys - nudge selection by 1px
    registerKeystroke('ArrowLeft', {
      description: 'Nudge selection left by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(-1, 0);
      },
      context: 'dancer',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowLeft', {
      description: 'Nudge selection left by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(-1, 0);
      },
      context: 'shape',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowRight', {
      description: 'Nudge selection right by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(1, 0);
      },
      context: 'dancer',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowRight', {
      description: 'Nudge selection right by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(1, 0);
      },
      context: 'shape',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowUp', {
      description: 'Nudge selection up by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(0, -1);
      },
      context: 'dancer',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowUp', {
      description: 'Nudge selection up by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(0, -1);
      },
      context: 'shape',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowDown', {
      description: 'Nudge selection down by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(0, 1);
      },
      context: 'dancer',
      modifiers: { ctrl: true },
      priority: 3,
    });

    registerKeystroke('ArrowDown', {
      description: 'Nudge selection down by 1px',
      handler: (event, context) => {
        get()._nudgeSelection(0, 1);
      },
      context: 'shape',
      modifiers: { ctrl: true },
      priority: 3,
    });

    // Delete key configurations - shared between Delete and Backspace
    const deleteKeyConfig = {
      description: 'Delete selected symbol(s)',
      handler: () => {
        console.log('Delete key pressed - deleting selected shapes');
        get().handleDeleteSelectedShapes();
      },
      context: 'global',
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
        const { symbolPlacement, cancelSymbolPlacement } = get();
        if (symbolPlacement?.active) {
          cancelSymbolPlacement();
          return;
        }
        set({
          selectedItems: [],
          selectedHand: null,
        });
      },
      context: 'global',
      priority: 1,
    });

    // R key - reset rotation of selected object to original starting rotation
    registerKeystroke('r', {
      description: 'Reset rotation to starting position',
      handler: (event, context) => {
        const { selectedItems, updateDancerState, updateShapeState, panels } =
          get();
        if (!selectedItems.length) return;

        selectedItems.forEach((item) => {
          const panel = panels.find((p) => p.id === item.panelId);
          if (!panel) return;

          if (item.type === 'dancer') {
            const dancer = panel.dancers.find((d) => d.id === item.id);
            if (!dancer) return;
            const originalRotation = dancer.colour === 'red' ? 180 : 0;
            updateDancerState(item.panelId, item.id, {
              rotation: originalRotation,
            });
          } else if (item.type === 'shape') {
            updateShapeState(item.panelId, item.id, { rotation: 0 });
          }
        });
      },
      context: 'global',
      priority: 1,
    });

    // Cmd+Z (Ctrl+Z) - Undo last action
    registerKeystroke('z', {
      description: 'Undo last action',
      handler: (event, context) => {
        const temporalStore = api?.temporal;
        if (!temporalStore) {
          console.warn('Undo failed: temporal store not available');
          return;
        }
        const temporalState = temporalStore.getState();
        if (temporalState.pastStates.length > 0) {
          temporalState.undo();
          console.log('Undo performed');
        } else {
          console.log('Nothing to undo');
        }
      },
      context: 'global',
      modifiers: { ctrl: true },
      priority: 1,
    });

    // Cmd+Y (Ctrl+Y) - Redo last undone action
    registerKeystroke('y', {
      description: 'Redo last undone action',
      handler: (event, context) => {
        const temporalStore = api?.temporal;
        if (!temporalStore) {
          console.warn('Redo failed: temporal store not available');
          return;
        }
        const temporalState = temporalStore.getState();
        if (temporalState.futureStates.length > 0) {
          temporalState.redo();
          console.log('Redo performed');
        } else {
          console.log('Nothing to redo');
        }
      },
      context: 'global',
      modifiers: { ctrl: true },
      priority: 1,
    });

    // Cmd+S (Ctrl+S) - Save file
    registerKeystroke('s', {
      description: 'Save file',
      handler: (event, context) => {
        const { triggerSave } = get();
        if (triggerSave) {
          triggerSave();
        } else {
          console.warn('Save handler not available');
        }
      },
      context: 'global',
      modifiers: { ctrl: true },
      priority: 1,
    });

    // Cmd+Shift+S (Ctrl+Shift+S) - Save As
    registerKeystroke('s', {
      description: 'Save file as...',
      handler: (event, context) => {
        const { triggerSaveAs } = get();
        if (triggerSaveAs) {
          triggerSaveAs();
        } else {
          console.warn('Save As handler not available');
        }
      },
      context: 'global',
      modifiers: { ctrl: true, shift: true },
      priority: 2, // Higher priority than regular save
    });

    // Cmd+O (Ctrl+O) - Open file
    registerKeystroke('o', {
      description: 'Open file',
      handler: (event, context) => {
        const { triggerOpen } = get();
        if (triggerOpen) {
          triggerOpen();
        } else {
          console.warn('Open handler not available');
        }
      },
      context: 'global',
      modifiers: { ctrl: true },
      priority: 1,
    });

    // W key - select red dancer in current panel
    registerKeystroke('w', {
      description: 'Select red dancer in current panel',
      handler: (event, context) => {
        const { selectedPanel, panels, handleDancerSelection } = get();
        if (selectedPanel) {
          const panel = panels.find((p) => p.id === selectedPanel);
          if (panel && panel.dancers.length > 0) {
            // Red dancer is typically at index 0
            const redDancer =
              panel.dancers.find((d) => d.colour === 'red') || panel.dancers[0];
            handleDancerSelection(selectedPanel, redDancer.id);
          }
        }
      },
      context: 'global',
      priority: 1,
    });

    // F key - select red dancer in current panel (alternative to W)
    registerKeystroke('f', {
      description: 'Select red dancer in current panel',
      handler: (event, context) => {
        const { selectedPanel, panels, handleDancerSelection } = get();
        if (selectedPanel) {
          const panel = panels.find((p) => p.id === selectedPanel);
          if (panel && panel.dancers.length > 0) {
            // Red dancer is typically at index 0
            const redDancer =
              panel.dancers.find((d) => d.colour === 'red') || panel.dancers[0];
            handleDancerSelection(selectedPanel, redDancer.id);
          }
        }
      },
      context: 'global',
      priority: 1,
    });

    // M key - select blue dancer in current panel
    registerKeystroke('m', {
      description: 'Select blue dancer in current panel',
      handler: (event, context) => {
        const { selectedPanel, panels, handleDancerSelection } = get();
        if (selectedPanel) {
          const panel = panels.find((p) => p.id === selectedPanel);
          if (panel && panel.dancers.length > 1) {
            // Blue dancer is typically at index 1
            const blueDancer =
              panel.dancers.find((d) => d.colour === 'blue') ||
              panel.dancers[1];
            handleDancerSelection(selectedPanel, blueDancer.id);
          }
        }
      },
      context: 'global',
      priority: 1,
    });

    // L key - select blue dancer in current panel (alternative to M)
    registerKeystroke('l', {
      description: 'Select blue dancer in current panel',
      handler: (event, context) => {
        const { selectedPanel, panels, handleDancerSelection } = get();
        if (selectedPanel) {
          const panel = panels.find((p) => p.id === selectedPanel);
          if (panel && panel.dancers.length > 1) {
            // Blue dancer is typically at index 1
            const blueDancer =
              panel.dancers.find((d) => d.colour === 'blue') ||
              panel.dancers[1];
            handleDancerSelection(selectedPanel, blueDancer.id);
          }
        }
      },
      context: 'global',
      priority: 1,
    });
  },

  // Internal rotation helper
  _rotateSelection: (degrees) => {
    const {
      selectedItems,
      updateDancerState,
      updateShapeState,
      panels,
      getCanvasNode,
    } = get();
    if (!selectedItems.length) return;

    selectedItems.forEach((item) => {
      const panel = panels.find((p) => p.id === item.panelId);
      if (!panel) return;

      const node = getCanvasNode(item.panelId, item.id, item.type);
      if (node) {
        // Match Transformer behavior by preserving the visual center as Konva rotates.
        const beforeCenter = getNodeVisualCenter(node);
        node.rotation((node.rotation() || 0) + degrees);
        const afterCenter = getNodeVisualCenter(node);
        const parentSpaceDelta = getCenterDeltaInParentSpace(
          node,
          beforeCenter,
          afterCenter,
        );
        node.x(node.x() + parentSpaceDelta.x);
        node.y(node.y() + parentSpaceDelta.y);

        const nextState = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        };

        if (item.type === 'dancer') {
          updateDancerState(item.panelId, item.id, nextState);
        } else if (item.type === 'shape') {
          updateShapeState(item.panelId, item.id, nextState);
        }
        return;
      }

      if (item.type === 'dancer') {
        const dancer = panel.dancers.find((d) => d.id === item.id);
        if (!dancer) return;
        updateDancerState(item.panelId, item.id, {
          rotation: (dancer.rotation || 0) + degrees,
        });
      } else if (item.type === 'shape') {
        const shape = panel.shapes.find((s) => s.id === item.id);
        if (!shape) return;
        updateShapeState(item.panelId, item.id, {
          rotation: (shape.rotation || 0) + degrees,
        });
      }
    });
  },

  _rotateSelectionAroundSharedCenter: (degrees) => {
    const {
      selectedItems,
      updateDancerState,
      updateShapeState,
      panels,
      getCanvasNode,
    } = get();
    if (!selectedItems.length) return;

    const selectionData = selectedItems
      .map((item) => {
        const panel = panels.find((p) => p.id === item.panelId);
        if (!panel) return null;

        const object =
          item.type === 'dancer'
            ? panel.dancers.find((d) => d.id === item.id)
            : panel.shapes.find((s) => s.id === item.id);
        if (!object) return null;

        const node = getCanvasNode(item.panelId, item.id, item.type);
        if (node) {
          const rect = node.getClientRect();
          return {
            item,
            object,
            node,
            center: {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
            },
            rect,
          };
        }

        const x = object.x || 0;
        const y = object.y || 0;
        return {
          item,
          object,
          node: null,
          center: { x, y },
          rect: { x, y, width: 0, height: 0 },
        };
      })
      .filter(Boolean);

    if (!selectionData.length) return;

    // Use mean center as a stable group pivot; axis-aligned bounds can drift as items rotate.
    const totalCenter = selectionData.reduce(
      (acc, entry) => ({
        x: acc.x + entry.center.x,
        y: acc.y + entry.center.y,
      }),
      { x: 0, y: 0 },
    );
    const pivot = {
      x: totalCenter.x / selectionData.length,
      y: totalCenter.y / selectionData.length,
    };

    selectionData.forEach(({ item, object, node, center }) => {
      const nextCenter = rotatePointAroundPivot(center, pivot, degrees);

      if (node) {
        // Match single-item rotation behavior first, then move to the grouped pivot target.
        const beforeCenter = getNodeVisualCenter(node);
        node.rotation((node.rotation() || 0) + degrees);
        const afterRotationCenter = getNodeVisualCenter(node);
        const centerPreserveDelta = getCenterDeltaInParentSpace(
          node,
          beforeCenter,
          afterRotationCenter,
        );
        node.x(node.x() + centerPreserveDelta.x);
        node.y(node.y() + centerPreserveDelta.y);

        const orbitDelta = getStageDeltaInParentSpace(
          node,
          beforeCenter,
          nextCenter,
        );
        node.x(node.x() + orbitDelta.x);
        node.y(node.y() + orbitDelta.y);

        const nextState = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        };

        if (item.type === 'dancer') {
          updateDancerState(item.panelId, item.id, nextState);
        } else if (item.type === 'shape') {
          updateShapeState(item.panelId, item.id, nextState);
        }
        return;
      }

      const nextState = {
        x: (object.x || 0) + (nextCenter.x - center.x),
        y: (object.y || 0) + (nextCenter.y - center.y),
        rotation: (object.rotation || 0) + degrees,
      };

      if (item.type === 'dancer') {
        updateDancerState(item.panelId, item.id, nextState);
      } else if (item.type === 'shape') {
        updateShapeState(item.panelId, item.id, nextState);
      }
    });
  },

  _nudgeSelection: (dx, dy) => {
    const { selectedItems, updateDancerState, updateShapeState, panels } =
      get();
    if (!selectedItems.length) return;

    selectedItems.forEach((item) => {
      const panel = panels.find((p) => p.id === item.panelId);
      if (!panel) return;

      if (item.type === 'dancer') {
        const dancer = panel.dancers.find((d) => d.id === item.id);
        if (!dancer) return;
        updateDancerState(item.panelId, item.id, {
          x: (dancer.x || 0) + dx,
          y: (dancer.y || 0) + dy,
        });
      } else if (item.type === 'shape') {
        const shape = panel.shapes.find((s) => s.id === item.id);
        if (!shape) return;
        updateShapeState(item.panelId, item.id, {
          x: (shape.x || 0) + dx,
          y: (shape.y || 0) + dy,
        });
      }
    });
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
