import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import Canvas from '../Canvas';
import { useAppStore } from '../../stores';
import {
  DANCER_DIMENSIONS,
  SHAPE_DIMENSIONS,
  getCenterOffset,
} from '../../utils/dimensions';

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
      expect(currentRotation).toBe(initialRotation - 15); // Default rotation step

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
      expect(currentShape.rotation).toBe(initialRotation - 15);

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

      // Rotate 90 degrees (6 * 15)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];
      expect(rotatedState.rotation).toBe(90);

      // Rotate back -45 degrees (3 * -15)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
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

      // Rotate 45 degrees (3 * 15)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(rotatedState.rotation).toBe(45);

      // Rotate back to 0 (3 * -15)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(finalState.rotation).toBe(0);
    });

    test('should not move symbol position on first rotation (anti-jump test)', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw, handleShapeSelection } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      
      // Add a shape EXACTLY like Sidebar does - without explicit rotation, offsetX, or offsetY
      const shapeId = 'no-jump-test-shape';
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
          draggable: true
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });
      
      const beforeRotation = useAppStore.getState().panels[0].shapes.find(s => s.id === shapeId);
      expect(beforeRotation.x).toBe(initialX);
      expect(beforeRotation.y).toBe(initialY);
      expect(beforeRotation.rotation).toBeUndefined(); // Should be undefined like real shapes
      expect(beforeRotation.offsetX).toBeUndefined(); // Should be undefined initially
      expect(beforeRotation.offsetY).toBeUndefined(); // Should be undefined initially
      
      // Calculate expected position after offset compensation
      // For 'signal' type: width=75, height=20, so center offset is (37.5, 10)
      const expectedX = initialX + SHAPE_DIMENSIONS.signal.width / 2; // 150 + 37.5 = 187.5
      const expectedY = initialY + SHAPE_DIMENSIONS.signal.height / 2; // 120 + 10 = 130
      
      // First rotation - offsets get set and position gets compensated
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });
      
      const afterFirstRotation = useAppStore.getState().panels[0].shapes.find(s => s.id === shapeId);
      
      // The rotation should change and position should be compensated to maintain visual position
      expect(afterFirstRotation.rotation).toBe(15);
      expect(afterFirstRotation.x).toBe(expectedX); // Position compensated for offset
      expect(afterFirstRotation.y).toBe(expectedY); // Position compensated for offset
      expect(afterFirstRotation.offsetX).toBeDefined(); // Should now have offset set
      expect(afterFirstRotation.offsetY).toBeDefined(); // Should now have offset set
      
      // Second rotation should NOT change position (offsets already set)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });
      
      const afterSecondRotation = useAppStore.getState().panels[0].shapes.find(s => s.id === shapeId);
      expect(afterSecondRotation.rotation).toBe(30);
      expect(afterSecondRotation.x).toBe(expectedX); // Should stay at compensated position
      expect(afterSecondRotation.y).toBe(expectedY); // Should stay at compensated position
    });

    test('should properly handle center-preserving rotation with scaled objects', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
        setMaintainRotationCenter,
        _calculateCenterPreservingPosition,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a scaled shape to test with
      const shapeId = 'test-scaled-shape';
      act(() => {
        setMaintainRotationCenter(true); // Enable center-preserving rotation
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'signal',
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 2.0, // Double width
          scaleY: 1.5, // 1.5x height
          fill: 'blue',
          stroke: 'red',
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // Calculate expected center based on actual scaled dimensions
      // Base signal shape from SHAPE_DIMENSIONS, scaled to 150x30
      const scaledWidth = SHAPE_DIMENSIONS.signal.width * 2.0;
      const scaledHeight = SHAPE_DIMENSIONS.signal.height * 1.5;
      const expectedCenterX = initialState.x + scaledWidth / 2;
      const expectedCenterY = initialState.y + scaledHeight / 2;

      // Test the center calculation function directly
      const calculatedPos = _calculateCenterPreservingPosition(
        initialState,
        'shape',
        90,
      );

      // The function should calculate a position that, when combined with the rotation,
      // maintains the same visual center position
      expect(typeof calculatedPos.x).toBe('number');
      expect(typeof calculatedPos.y).toBe('number');
      expect(isFinite(calculatedPos.x)).toBe(true);
      expect(isFinite(calculatedPos.y)).toBe(true);
    });

    test('should maintain visual center within margin of error during rotation', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
        setMaintainRotationCenter,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a scaled shape to test center preservation
      const shapeId = 'test-center-preservation';
      act(() => {
        setMaintainRotationCenter(true);
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'spinOne',
          x: 200,
          y: 150,
          rotation: 0,
          scaleX: 1.5,
          scaleY: 2.0,
          fill: 'green',
          stroke: 'blue',
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // Calculate initial visual center
      // Base spinOne shape from SHAPE_DIMENSIONS, scaled to 90x120
      const initialWidth = SHAPE_DIMENSIONS.spinOne.width * 1.5;
      const initialHeight = SHAPE_DIMENSIONS.spinOne.height * 2.0;

      // Before rotation, object is at its original position
      let initialCenterX = initialState.x + initialWidth / 2;
      let initialCenterY = initialState.y + initialHeight / 2;

      // Perform a rotation (90 degrees = 6 * 15)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // After the first rotation, the object should have offset values set
      // and position adjusted to maintain visual center

      // Verify rotation was applied
      expect(rotatedState.rotation).toBe(90);

      // Verify that offsets were set to center
      const expectedOffsetX =
        (SHAPE_DIMENSIONS.spinOne.width * (rotatedState.scaleX || 1)) / 2;
      const expectedOffsetY =
        (SHAPE_DIMENSIONS.spinOne.height * (rotatedState.scaleY || 1)) / 2;

      expect(rotatedState.offsetX).toBeCloseTo(expectedOffsetX, 1);
      expect(rotatedState.offsetY).toBeCloseTo(expectedOffsetY, 1);

      // The visual appearance should be preserved. The position compensation should
      // make the shape appear in the same visual location despite the coordinate changes.
      // Since we moved the shape by (+offsetX, +offsetY) to compensate for the offset change,
      // the shape should now be at the original position + the offset values.
      const expectedX = initialState.x + expectedOffsetX;
      const expectedY = initialState.y + expectedOffsetY;
      
      expect(rotatedState.x).toBeCloseTo(expectedX, 1);
      expect(rotatedState.y).toBeCloseTo(expectedY, 1);
    });

    test('should maintain dancer center within margin of error during multiple rotations', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        updateDancerState,
        handleDancerSelection,
        setMaintainRotationCenter,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Set up a scaled dancer for testing - reset all properties first
      act(() => {
        setMaintainRotationCenter(true);
        updateDancerState(panelId, dancerId, {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 0.8, // Slightly smaller
          scaleY: 1.2, // Slightly taller
          offsetX: undefined, // Reset offset values from previous tests
          offsetY: undefined,
        });
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore.getState().panels[0].dancers[0];

      // Calculate initial visual center
      // Dancer base dimensions from DANCER_DIMENSIONS
      const initialWidth = DANCER_DIMENSIONS.BODY_WIDTH * 0.8;
      const initialHeight = DANCER_DIMENSIONS.TOTAL_HEIGHT * 1.2;

      // Before rotation
      const adjustedInitialCenterX = initialState.x + initialWidth / 2;
      const adjustedInitialCenterY = initialState.y + initialHeight / 2;

      // Perform rotation (45 degrees = 3 * 15)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];

      // Verify rotation was applied
      expect(rotatedState.rotation).toBe(-45);

      // Verify that offsets were set to center (based on actual dancer dimensions)
      // Expected offsets based on DANCER_DIMENSIONS with scale factors 0.8 and 1.2
      const expectedOffsetX =
        (DANCER_DIMENSIONS.BODY_WIDTH * (rotatedState.scaleX || 1)) / 2;
      const expectedOffsetY =
        DANCER_DIMENSIONS.VISUAL_CENTER_Y * (rotatedState.scaleY || 1);

      expect(rotatedState.offsetX).toBeCloseTo(expectedOffsetX, 1);
      expect(rotatedState.offsetY).toBeCloseTo(expectedOffsetY, 1);

      // Dancers should maintain their original position when offsets are set (no compensation needed)
      // Position should remain unchanged from initial state
      expect(rotatedState.x).toBe(initialState.x);
      expect(rotatedState.y).toBe(initialState.y);

      // Perform another rotation to test that subsequent rotations don't change center
      const beforeSecondRotationX = rotatedState.x;
      const beforeSecondRotationY = rotatedState.y;

      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore.getState().panels[0].dancers[0];

      // Verify final rotation
      expect(finalState.rotation).toBe(-60);

      // Verify center position unchanged from previous rotation
      expect(Math.abs(finalState.x - beforeSecondRotationX)).toBeLessThan(0.1);
      expect(Math.abs(finalState.y - beforeSecondRotationY)).toBeLessThan(0.1);
    });

    test('should allow disabling center-preserving rotation', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        updateDancerState,
        handleDancerSelection,
        setMaintainRotationCenter,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Disable center-preserving rotation
      act(() => {
        setMaintainRotationCenter(false);
        updateDancerState(panelId, dancerId, { x: 100, y: 100, rotation: 0 });
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore.getState().panels[0].dancers[0];
      const initialX = initialState.x;
      const initialY = initialState.y;

      // Rotate 15 degrees
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];

      // With center-preserving disabled, position should remain unchanged
      expect(rotatedState.x).toBe(initialX);
      expect(rotatedState.y).toBe(initialY);
      expect(rotatedState.rotation).toBe(15);
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
      expect(currentRotation).toBe(initialRotation - 1); // Fine rotation step
    });

    test('should delete selected symbol with delete key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw, handleShapeSelection } = useAppStore.getState();
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
          stroke: 'black'
        });
        initializeDefaultKeystrokes();
      });
      
      // Verify shape was added
      let shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some(s => s.id === 'delete-test-shape')).toBe(true);
      
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
      expect(shapes.some(s => s.id === 'delete-test-shape')).toBe(false);
      expect(useAppStore.getState().selectedShapeId).toBeNull();
    });

    test('should delete selected symbol with backspace key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw, handleShapeSelection } = useAppStore.getState();
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
          stroke: 'blue'
        });
        handleShapeSelection(panelId, 'backspace-test-shape');
        initializeDefaultKeystrokes();
      });
      
      // Verify shape exists and is selected
      let shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some(s => s.id === 'backspace-test-shape')).toBe(true);
      expect(useAppStore.getState().selectedShapeId?.shapeId).toBe('backspace-test-shape');
      
      // Delete with Backspace key
      act(() => {
        handleKeystroke('Backspace', { key: 'Backspace' });
      });
      
      // Verify shape was deleted
      shapes = useAppStore.getState().panels[0].shapes;
      expect(shapes.some(s => s.id === 'backspace-test-shape')).toBe(false);
      expect(useAppStore.getState().selectedShapeId).toBeNull();
    });

    test('should do nothing when delete key pressed with no symbol selected', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      
      // Add a shape but don't select it
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'no-delete-shape',
          type: 'curvedLine',
          x: 200,
          y: 200,
          fill: 'green',
          stroke: 'green'
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
      expect(useAppStore.getState().panels[0].shapes.some(s => s.id === 'no-delete-shape')).toBe(true);
    });

    test('should do nothing when delete key pressed with dancer selected', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleDancerSelection } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;
      
      // Select a dancer
      act(() => {
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });
      
      const initialDancerCount = useAppStore.getState().panels[0].dancers.length;
      
      // Verify dancer is selected (not shape)
      expect(useAppStore.getState().selectedDancer).toEqual({ panelId, dancerId });
      expect(useAppStore.getState().selectedShapeId).toBeNull();
      
      // Try to delete - should do nothing since dancers can't be deleted
      act(() => {
        handleKeystroke('Delete', { key: 'Delete' });
      });
      
      // Verify dancers are unchanged
      const finalDancerCount = useAppStore.getState().panels[0].dancers.length;
      expect(finalDancerCount).toBe(initialDancerCount);
      expect(useAppStore.getState().panels[0].dancers.some(d => d.id === dancerId)).toBe(true);
    });

    test('should reset rotation with r key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw, handleShapeSelection, updateShapeState } = useAppStore.getState();
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
          stroke: 'black'
        });
        handleShapeSelection(panelId, 'rotation-reset-shape');
        initializeDefaultKeystrokes();
      });
      
      // Verify shape has rotation
      let shape = useAppStore.getState().panels[0].shapes.find(s => s.id === 'rotation-reset-shape');
      expect(shape.rotation).toBe(45);
      
      // Reset rotation with 'r' key
      act(() => {
        handleKeystroke('r', { key: 'r' });
      });
      
      // Verify rotation was reset
      shape = useAppStore.getState().panels[0].shapes.find(s => s.id === 'rotation-reset-shape');
      expect(shape.rotation).toBe(0);
    });

    test('should reset dancer rotation to original starting rotation with r key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleDancerSelection, updateDancerState } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      
      // Test red dancer (should reset to 180)
      const redDancerId = useAppStore.getState().panels[0].dancers[0].id;
      act(() => {
        updateDancerState(panelId, redDancerId, { rotation: 90 }); // Change from original
        handleDancerSelection(panelId, redDancerId);
        initializeDefaultKeystrokes();
      });
      
      // Verify red dancer has modified rotation
      let redDancer = useAppStore.getState().panels[0].dancers.find(d => d.id === redDancerId);
      expect(redDancer.rotation).toBe(90);
      
      // Reset rotation with 'r' key
      act(() => {
        handleKeystroke('r', { key: 'r' });
      });
      
      // Verify red dancer was reset to 180 (original starting rotation)
      redDancer = useAppStore.getState().panels[0].dancers.find(d => d.id === redDancerId);
      expect(redDancer.rotation).toBe(180);
      
      // Test blue dancer (should reset to 0)
      const blueDancerId = useAppStore.getState().panels[0].dancers[1].id;
      act(() => {
        updateDancerState(panelId, blueDancerId, { rotation: 270 }); // Change from original
        handleDancerSelection(panelId, blueDancerId);
      });
      
      // Verify blue dancer has modified rotation
      let blueDancer = useAppStore.getState().panels[0].dancers.find(d => d.id === blueDancerId);
      expect(blueDancer.rotation).toBe(270);
      
      // Reset rotation with 'r' key
      act(() => {
        handleKeystroke('r', { key: 'r' });
      });
      
      // Verify blue dancer was reset to 0 (original starting rotation)
      blueDancer = useAppStore.getState().panels[0].dancers.find(d => d.id === blueDancerId);
      expect(blueDancer.rotation).toBe(0);
    });

    test('should deselect all objects with escape key', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw, handleShapeSelection } = useAppStore.getState();
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
          stroke: 'black'
        });
        handleShapeSelection(panelId, 'escape-test-shape');
        initializeDefaultKeystrokes();
      });
      
      // Verify shape is selected
      expect(useAppStore.getState().selectedShapeId?.shapeId).toBe('escape-test-shape');
      
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
  });
});
