import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';

describe('Keystroke Framework', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useAppStore.setState({
        panels: [useAppStore.getState().panels[0]], // Keep only first panel
        selectedPanel: null,
        selectedDancer: null,
        selectedHand: null,
        selectedShapeId: null,
      });
    });
  });

  describe('Keystroke Registration and Management', () => {
    test('should register keystroke handlers', () => {
      const { registerKeystroke, getRegisteredKeystrokes } =
        useAppStore.getState();

      expect(registerKeystroke).toBeDefined();
      expect(getRegisteredKeystrokes).toBeDefined();

      // Register a test keystroke
      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate left',
          handler: jest.fn(),
          context: 'dancer',
        });
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(keystrokes).toHaveProperty('ArrowLeft:dancer');
      expect(keystrokes['ArrowLeft:dancer'].description).toBe('Rotate left');
      expect(keystrokes['ArrowLeft:dancer'].context).toBe('dancer');
    });

    test('should unregister keystroke handlers', () => {
      const {
        registerKeystroke,
        unregisterKeystroke,
        getRegisteredKeystrokes,
      } = useAppStore.getState();

      // Register and then unregister
      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate left',
          handler: jest.fn(),
          context: 'dancer',
        });
        unregisterKeystroke('ArrowLeft');
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(keystrokes).not.toHaveProperty('ArrowLeft');
    });

    test('should support modifier key combinations', () => {
      const { registerKeystroke, getRegisteredKeystrokes } =
        useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate left slowly',
          handler: jest.fn(),
          context: 'dancer',
          modifiers: { ctrl: true },
        });

        registerKeystroke('ArrowLeft', {
          description: 'Rotate left quickly',
          handler: jest.fn(),
          context: 'dancer',
          modifiers: { shift: true },
        });
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(
        Object.keys(keystrokes).filter((k) => k.includes('ArrowLeft')),
      ).toHaveLength(2);
    });

    test('should validate keystroke handler registration', () => {
      const { registerKeystroke } = useAppStore.getState();

      // Should throw error for invalid handler
      expect(() => {
        act(() => {
          registerKeystroke('ArrowLeft', {
            description: 'Test',
            handler: 'not a function', // Invalid handler
            context: 'dancer',
          });
        });
      }).toThrow();

      // Should throw error for missing required fields
      expect(() => {
        act(() => {
          registerKeystroke('ArrowLeft', {
            handler: jest.fn(),
            // Missing description and context
          });
        });
      }).toThrow();
    });
  });

  describe('Context-Aware Keystroke Handling', () => {
    test('should ignore keystrokes when focus is in an input', () => {
      const handler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Test handler',
          handler,
          context: 'global',
        });
      });

      const preventDefault = jest.fn();
      handleKeystroke('ArrowLeft', {
        key: 'ArrowLeft',
        target: { tagName: 'INPUT' },
        preventDefault,
      });

      expect(handler).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    test('should only execute keystrokes in correct context', () => {
      const dancerHandler = jest.fn();
      const symbolHandler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate dancer left',
          handler: dancerHandler,
          context: 'dancer',
        });

        registerKeystroke('ArrowLeft', {
          description: 'Rotate symbol left',
          handler: symbolHandler,
          context: 'symbol',
        });
      });

      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;
      const shapeId = useAppStore.getState().panels[0].shapes[0]?.id;

      // Select dancer and trigger keystroke
      act(() => {
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      expect(dancerHandler).toHaveBeenCalledTimes(1);
      expect(symbolHandler).not.toHaveBeenCalled();

      // Reset mocks
      dancerHandler.mockReset();
      symbolHandler.mockReset();

      // Select symbol and trigger keystroke
      if (shapeId) {
        act(() => {
          useAppStore.getState().setSelectedDancer(null);
          useAppStore.getState().handleShapeSelection(panelId, shapeId);
          handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        });

        expect(symbolHandler).toHaveBeenCalledTimes(1);
        expect(dancerHandler).not.toHaveBeenCalled();
      }
    });

    test('should determine context based on current selection', () => {
      const { getCurrentKeystrokeContext } = useAppStore.getState();

      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // No selection
      expect(getCurrentKeystrokeContext()).toBe('none');

      // Dancer selected
      act(() => {
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });
      expect(getCurrentKeystrokeContext()).toBe('dancer');

      // Hand selected
      act(() => {
        useAppStore.getState().handleHandClick(panelId, dancerId, 'left');
      });
      expect(getCurrentKeystrokeContext()).toBe('hand');

      // Symbol selected
      const shapes = useAppStore.getState().panels[0].shapes;
      if (shapes.length > 0) {
        act(() => {
          useAppStore.getState().setSelectedDancer(null);
          useAppStore.getState().setSelectedHand(null);
          useAppStore.getState().handleShapeSelection(panelId, shapes[0].id);
        });
        expect(getCurrentKeystrokeContext()).toBe('symbol');
      }
    });
  });

  describe('Arrow Key Rotation Functionality', () => {
    test('should register default arrow key rotation handlers', () => {
      const { initializeDefaultKeystrokes, getRegisteredKeystrokes } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(keystrokes).toHaveProperty('ArrowLeft:dancer');
      expect(keystrokes).toHaveProperty('ArrowRight:dancer');
      expect(keystrokes['ArrowLeft:dancer'].description).toContain('Rotate');
      expect(keystrokes['ArrowRight:dancer'].description).toContain('Rotate');
    });

    test('should rotate selected dancer with arrow keys', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });

      const initialState = useAppStore.getState();
      const initialRotation = initialState.panels[0].dancers[0].rotation || 0;

      // Rotate left
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      let currentState = useAppStore.getState();
      let currentRotation = currentState.panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation - 45); // Default rotation step

      // Rotate right
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      currentState = useAppStore.getState();
      currentRotation = currentState.panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation); // Back to initial
    });

    test('should rotate selected symbol with arrow keys', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape to test with
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'test-shape-id',
          type: 'circle',
          x: 100,
          y: 100,
          rotation: 0,
          fill: 'red',
          stroke: 'black',
        });
        initializeDefaultKeystrokes();
      });

      const shapes = useAppStore.getState().panels[0].shapes;
      const shapeId = 'test-shape-id'; // Use the known ID

      act(() => {
        useAppStore.getState().handleShapeSelection(panelId, shapeId);
      });

      const initialRotation =
        useAppStore.getState().panels[0].shapes.find((s) => s.id === shapeId)
          .rotation || 0;

      // Rotate left
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      let currentShape = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(currentShape.rotation).toBe(initialRotation - 45);

      // Rotate right
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      currentShape = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(currentShape.rotation).toBe(initialRotation);
    });

    test('should handle multiple rotations correctly for dancers', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        updateDancerState,
        handleDancerSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Set specific dancer position for testing
      act(() => {
        updateDancerState(panelId, dancerId, { x: 100, y: 100, rotation: 0 });
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      // Rotate 90 degrees (2 * 45)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];
      expect(rotatedState.rotation).toBe(90);

      // Rotate back -45 degrees (1 * -45)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore.getState().panels[0].dancers[0];
      expect(finalState.rotation).toBe(45);
    });

    test('should handle multiple rotations correctly for shapes', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape to test with
      const shapeId = 'test-multi-rotate-shape';
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'signal',
          x: 200,
          y: 150,
          rotation: 0,
          fill: 'red',
          stroke: 'black',
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      // Rotate 45 degrees (1 * 45)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(rotatedState.rotation).toBe(45);

      // Rotate back to 0 (1 * -45)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(finalState.rotation).toBe(0);
    });

    test('should not move symbol position during rotation (simple rotation test)', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape EXACTLY like Sidebar does - without explicit rotation, offsetX, or offsetY
      const shapeId = 'simple-rotation-test-shape';
      const initialX = 150;
      const initialY = 120;

      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'signal',
          x: initialX,
          y: initialY,
          // NOTE: No rotation, offsetX, or offsetY properties - mimicking real Sidebar behavior
          fill: 'red',
          stroke: 'black',
          draggable: true,
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      const beforeRotation = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(beforeRotation.x).toBe(initialX);
      expect(beforeRotation.y).toBe(initialY);
      expect(beforeRotation.rotation).toBeUndefined(); // Should be undefined like real shapes

      // First rotation - only rotation property should change
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const afterFirstRotation = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // The rotation should change but position should remain the same
      expect(afterFirstRotation.rotation).toBe(45);
      expect(afterFirstRotation.x).toBe(initialX); // Position should remain unchanged
      expect(afterFirstRotation.y).toBe(initialY); // Position should remain unchanged

      // Second rotation should also only change rotation
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const afterSecondRotation = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(afterSecondRotation.rotation).toBe(90);
      expect(afterSecondRotation.x).toBe(initialX); // Position should remain unchanged
      expect(afterSecondRotation.y).toBe(initialY); // Position should remain unchanged
    });

    test('should respect rotation step configuration', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, setRotationStep } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      act(() => {
        setRotationStep(30); // Set custom rotation step
        initializeDefaultKeystrokes();
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });

      const initialRotation =
        useAppStore.getState().panels[0].dancers[0].rotation || 0;

      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const currentRotation =
        useAppStore.getState().panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation - 30);
    });

    test('should handle rotation with modifier keys for fine control', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });

      const initialRotation =
        useAppStore.getState().panels[0].dancers[0].rotation || 0;

      // Fine rotation with shift modifier
      act(() => {
        handleKeystroke('ArrowLeft', {
          key: 'ArrowLeft',
          shiftKey: true,
        });
      });

      const currentRotation =
        useAppStore.getState().panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation - 5); // Fine rotation step
    });

    test('should delete selected symbol with delete key', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape to test deletion
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'delete-test-shape',
          type: 'signal',
          x: 100,
          y: 100,
          fill: 'red',
          stroke: 'black',
        });
        initializeDefaultKeystrokes();
      });

      // Verify shape was added
      let shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some((s) => s.id === 'delete-test-shape')).toBe(true);

      // Select the shape
      act(() => {
        handleShapeSelection(panelId, 'delete-test-shape');
      });

      // Verify shape is selected
      const selectedShape = useAppStore.getState().selectedShapeId;
      expect(selectedShape?.shapeId).toBe('delete-test-shape');

      // Delete with Delete key
      act(() => {
        handleKeystroke('Delete', { key: 'Delete' });
      });

      // Verify shape was deleted
      shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some((s) => s.id === 'delete-test-shape')).toBe(false);
      expect(useAppStore.getState().selectedShapeId).toBeNull();
    });

    test('should delete selected symbol with backspace key', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape to test deletion
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'backspace-test-shape',
          type: 'spinOne',
          x: 150,
          y: 150,
          fill: 'blue',
          stroke: 'blue',
        });
        handleShapeSelection(panelId, 'backspace-test-shape');
        initializeDefaultKeystrokes();
      });

      // Verify shape exists and is selected
      let shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some((s) => s.id === 'backspace-test-shape')).toBe(true);
      expect(useAppStore.getState().selectedShapeId?.shapeId).toBe(
        'backspace-test-shape',
      );

      // Delete with Backspace key
      act(() => {
        handleKeystroke('Backspace', { key: 'Backspace' });
      });

      // Verify shape was deleted
      shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some((s) => s.id === 'backspace-test-shape')).toBe(false);
      expect(useAppStore.getState().selectedShapeId).toBeNull();
    });

    test('should do nothing when delete key pressed with no symbol selected', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape but don't select it
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'no-delete-shape',
          type: 'quarterCurvedLine',
          x: 200,
          y: 200,
          fill: 'green',
          stroke: 'green',
        });
        initializeDefaultKeystrokes();
      });

      const initialShapeCount = useAppStore.getState().panels[0].shapes.length;

      // Ensure no shape is selected
      act(() => {
        useAppStore.setState({ selectedShapeId: null });
      });

      // Try to delete with no selection
      act(() => {
        handleKeystroke('Delete', { key: 'Delete' });
      });

      // Verify no shapes were deleted
      const finalShapeCount = useAppStore.getState().panels[0].shapes.length;
      expect(finalShapeCount).toBe(initialShapeCount);
      expect(
        useAppStore
          .getState()
          .panels[0].shapes.some((s) => s.id === 'no-delete-shape'),
      ).toBe(true);
    });

    test('should do nothing when delete key pressed with dancer selected', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleDancerSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Select a dancer
      act(() => {
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      const initialDancerCount =
        useAppStore.getState().panels[0].dancers.length;

      // Verify dancer is selected (not shape)
      expect(useAppStore.getState().selectedDancer).toEqual({
        panelId,
        dancerId,
      });
      expect(useAppStore.getState().selectedShapeId).toBeNull();

      // Try to delete - should do nothing since dancers can't be deleted
      act(() => {
        handleKeystroke('Delete', { key: 'Delete' });
      });

      // Verify dancers are unchanged
      const finalDancerCount = useAppStore.getState().panels[0].dancers.length;
      expect(finalDancerCount).toBe(initialDancerCount);
      expect(
        useAppStore.getState().panels[0].dancers.some((d) => d.id === dancerId),
      ).toBe(true);
    });

    test('should reset rotation with r key', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
        updateShapeState,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a rotated shape
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'rotation-reset-shape',
          type: 'signal',
          x: 100,
          y: 100,
          rotation: 45,
          fill: 'red',
          stroke: 'black',
        });
        handleShapeSelection(panelId, 'rotation-reset-shape');
        initializeDefaultKeystrokes();
      });

      // Verify shape has rotation
      let shape = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === 'rotation-reset-shape');
      expect(shape.rotation).toBe(45);

      // Reset rotation with 'r' key
      act(() => {
        handleKeystroke('r', { key: 'r' });
      });

      // Verify rotation was reset
      shape = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === 'rotation-reset-shape');
      expect(shape.rotation).toBe(0);
    });

    test('should reset dancer rotation to original starting rotation with r key', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleDancerSelection,
        updateDancerState,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Test red dancer (should reset to 180)
      const redDancerId = useAppStore.getState().panels[0].dancers[0].id;
      act(() => {
        updateDancerState(panelId, redDancerId, { rotation: 90 }); // Change from original
        handleDancerSelection(panelId, redDancerId);
        initializeDefaultKeystrokes();
      });

      // Verify red dancer has modified rotation
      let redDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.id === redDancerId);
      expect(redDancer.rotation).toBe(90);

      // Reset rotation with 'r' key
      act(() => {
        handleKeystroke('r', { key: 'r' });
      });

      // Verify red dancer was reset to 180 (original starting rotation)
      redDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.id === redDancerId);
      expect(redDancer.rotation).toBe(180);

      // Test blue dancer (should reset to 0)
      const blueDancerId = useAppStore.getState().panels[0].dancers[1].id;
      act(() => {
        updateDancerState(panelId, blueDancerId, { rotation: 270 }); // Change from original
        handleDancerSelection(panelId, blueDancerId);
      });

      // Verify blue dancer has modified rotation
      let blueDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.id === blueDancerId);
      expect(blueDancer.rotation).toBe(270);

      // Reset rotation with 'r' key
      act(() => {
        handleKeystroke('r', { key: 'r' });
      });

      // Verify blue dancer was reset to 0 (original starting rotation)
      blueDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.id === blueDancerId);
      expect(blueDancer.rotation).toBe(0);
    });

    test('should deselect all objects with escape key', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add and select a shape
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'escape-test-shape',
          type: 'signal',
          x: 100,
          y: 100,
          fill: 'red',
          stroke: 'black',
        });
        handleShapeSelection(panelId, 'escape-test-shape');
        initializeDefaultKeystrokes();
      });

      // Verify shape is selected
      expect(useAppStore.getState().selectedShapeId?.shapeId).toBe(
        'escape-test-shape',
      );

      // Press escape to deselect
      act(() => {
        handleKeystroke('Escape', { key: 'Escape' });
      });

      // Verify nothing is selected
      expect(useAppStore.getState().selectedShapeId).toBeNull();
      expect(useAppStore.getState().selectedDancer).toBeNull();
      expect(useAppStore.getState().selectedHand).toBeNull();
    });
  });

  describe('Integration with Canvas Component', () => {
    test('should have KeystrokeHandler component available', () => {
      // This test verifies the KeystrokeHandler component exists and can be imported
      const KeystrokeHandler = require('../KeystrokeHandler').default;
      expect(KeystrokeHandler).toBeDefined();
    });

    test('should initialize keystrokes when KeystrokeHandler mounts', () => {
      const { getRegisteredKeystrokes } = useAppStore.getState();

      // Should have default keystrokes after initialization
      const keystrokes = getRegisteredKeystrokes();
      expect(Object.keys(keystrokes).length).toBeGreaterThan(0);
      expect(keystrokes).toHaveProperty('ArrowLeft:dancer');
      expect(keystrokes).toHaveProperty('ArrowLeft:symbol');
    });
  });

  describe('Extensibility and Configuration', () => {
    test('should allow custom keystroke registration at runtime', () => {
      const customHandler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('KeyR', {
          description: 'Custom reset function',
          handler: customHandler,
          context: 'global',
        });
      });

      act(() => {
        handleKeystroke('KeyR', { key: 'r' });
      });

      expect(customHandler).toHaveBeenCalledTimes(1);
    });

    test('should support keystroke handler priority system', () => {
      const lowPriorityHandler = jest.fn();
      const highPriorityHandler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('KeyT', {
          description: 'Low priority',
          handler: lowPriorityHandler,
          context: 'global',
          priority: 1,
        });

        registerKeystroke('KeyT', {
          description: 'High priority',
          handler: highPriorityHandler,
          context: 'global',
          priority: 10,
        });
      });

      act(() => {
        handleKeystroke('KeyT', { key: 't' });
      });

      // Higher priority should be called, lower priority should be skipped
      expect(highPriorityHandler).toHaveBeenCalledTimes(1);
      expect(lowPriorityHandler).not.toHaveBeenCalled();
    });

    test('should provide keystroke help/documentation functionality', () => {
      const { getKeystrokeHelp, initializeDefaultKeystrokes } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      const help = getKeystrokeHelp();
      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toHaveProperty('key');
      expect(help[0]).toHaveProperty('description');
      expect(help[0]).toHaveProperty('context');
    });

    test('should support keyboard shortcut conflicts detection', () => {
      const { registerKeystroke, detectKeystrokeConflicts } =
        useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'First handler',
          handler: jest.fn(),
          context: 'dancer',
        });

        registerKeystroke('ArrowLeft', {
          description: 'Second handler',
          handler: jest.fn(),
          context: 'dancer',
        });
      });

      const conflicts = detectKeystrokeConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].key).toBe('ArrowLeft');
      expect(conflicts[0].context).toBe('dancer');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle keystrokes gracefully when no selection exists', () => {
      const { handleKeystroke, initializeDefaultKeystrokes } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      // No selection active
      expect(() => {
        act(() => {
          handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        });
      }).not.toThrow();
    });

    test('should handle invalid keystroke events', () => {
      const { handleKeystroke } = useAppStore.getState();

      expect(() => {
        act(() => {
          handleKeystroke(null, null);
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          handleKeystroke('InvalidKey', { key: 'InvalidKey' });
        });
      }).not.toThrow();
    });

    test('should cleanup keystroke handlers on unmount', () => {
      const {
        clearAllKeystrokes,
        getRegisteredKeystrokes,
        initializeDefaultKeystrokes,
      } = useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      expect(Object.keys(getRegisteredKeystrokes()).length).toBeGreaterThan(0);

      act(() => {
        clearAllKeystrokes();
      });

      expect(Object.keys(getRegisteredKeystrokes()).length).toBe(0);
    });

    test('should select red dancer with w key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const redDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.colour === 'red');

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.setState({ selectedPanel: panelId });
        handleKeystroke('w', { key: 'w' });
      });

      const { selectedDancer } = useAppStore.getState();
      expect(selectedDancer).toBeTruthy();
      expect(selectedDancer.panelId).toBe(panelId);
      expect(selectedDancer.dancerId).toBe(redDancer.id);
    });

    test('should select red dancer with f key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const redDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.colour === 'red');

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.setState({ selectedPanel: panelId });
        handleKeystroke('f', { key: 'f' });
      });

      const { selectedDancer } = useAppStore.getState();
      expect(selectedDancer).toBeTruthy();
      expect(selectedDancer.panelId).toBe(panelId);
      expect(selectedDancer.dancerId).toBe(redDancer.id);
    });

    test('should select blue dancer with m key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const blueDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.colour === 'blue');

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.setState({ selectedPanel: panelId });
        handleKeystroke('m', { key: 'm' });
      });

      const { selectedDancer } = useAppStore.getState();
      expect(selectedDancer).toBeTruthy();
      expect(selectedDancer.panelId).toBe(panelId);
      expect(selectedDancer.dancerId).toBe(blueDancer.id);
    });

    test('should select blue dancer with l key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const blueDancer = useAppStore
        .getState()
        .panels[0].dancers.find((d) => d.colour === 'blue');

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.setState({ selectedPanel: panelId });
        handleKeystroke('l', { key: 'l' });
      });

      const { selectedDancer } = useAppStore.getState();
      expect(selectedDancer).toBeTruthy();
      expect(selectedDancer.panelId).toBe(panelId);
      expect(selectedDancer.dancerId).toBe(blueDancer.id);
    });

    test('should not select dancer if no panel is selected', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.setState({ selectedPanel: null });
        handleKeystroke('w', { key: 'w' });
      });

      const { selectedDancer } = useAppStore.getState();
      expect(selectedDancer).toBeNull();
    });
  });
});
